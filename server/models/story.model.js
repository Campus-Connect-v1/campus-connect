// models/story.model.js
import { v4 as uuidv4 } from "uuid";
import { db } from "../config/db.js";

// Every story query filters on this pair rather than letting JS drop expired
// rows after the fetch. A story that crosses its expiry between the SELECT and
// the response must not appear, and post-filtering would also break LIMIT by
// returning short pages.
const ACTIVE_WINDOW = `s.is_active = 1 AND s.expires_at > NOW()`;

// Who may see a story, as SQL.
//
// `connections` stores ONE directed row per pair, so an accepted connection
// has to be matched from both ends. Checking only requester_id would hide
// roughly half of every user's friends -- the same mistake the
// connection_recommendations view made (see models/user.model.js).
//
// Expects `stories s` joined to the author as `u`. Placeholder order is fixed;
// build the params with visibilityParams().
const CAN_VIEW = `(
        s.user_id = ?
        OR s.visibility = 'public'
        OR (s.visibility = 'connections' AND EXISTS (
              SELECT 1 FROM connections c
              WHERE c.status = 'accepted'
                AND ((c.requester_id = ? AND c.receiver_id = s.user_id)
                  OR (c.receiver_id = ? AND c.requester_id = s.user_id))
           ))
        OR (s.visibility = 'university'
            AND u.university_id = (SELECT university_id FROM users WHERE user_id = ?))
      )`;

const visibilityParams = (viewerId) => [viewerId, viewerId, viewerId, viewerId];

// A repost has to render the original inline, so the post and its author come
// back on the same row. A per-story lookup would be one round trip per tray
// item on the home screen.
const REPOST_JOIN = `
      LEFT JOIN posts rp ON s.repost_post_id = rp.post_id AND rp.is_active = 1
      LEFT JOIN users ru ON rp.user_id = ru.user_id`;

const REPOST_COLUMNS = `
        rp.post_id          AS repost_post_id,
        rp.content          AS repost_content,
        rp.media_url        AS repost_media_url,
        rp.media_type       AS repost_media_type,
        ru.user_id          AS repost_author_id,
        ru.first_name       AS repost_author_first_name,
        ru.last_name        AS repost_author_last_name,
        ru.profile_picture_url AS repost_author_picture`;

const STORY_COLUMNS = `
        s.story_id,
        s.user_id,
        s.story_type,
        s.media_url,
        s.content,
        s.background_color,
        s.visibility,
        s.created_at,
        s.expires_at`;

// Create a story
export const createStoryModel = async (storyData) => {
  try {
    const storyId = `story_${uuidv4()}`;
    const {
      user_id,
      story_type = "image",
      media_url = null,
      content = null,
      background_color = null,
      repost_post_id = null,
      visibility = "connections",
      duration_hours = 24,
    } = storyData;

    // expires_at is derived from the database clock, not the app's. Every read
    // compares it against NOW() on the same server, so computing it here would
    // let any drift between the two shift the window.
    const query = `
      INSERT INTO stories (
        story_id, user_id, story_type, media_url, content,
        background_color, repost_post_id, visibility, expires_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR))
    `;

    await db.execute(query, [
      storyId,
      user_id,
      story_type,
      media_url,
      content,
      background_color,
      repost_post_id,
      visibility,
      duration_hours,
    ]);

    return await getStoryRowModel(storyId);
  } catch (error) {
    throw new Error(`Database error in createStory: ${error.message}`);
  }
};

// Fetch a story by id with no visibility or expiry filtering.
//
// Used for ownership decisions (viewers list, delete) and to echo a story back
// after insert. is_active is still honoured so a deleted story reads as gone,
// but an expired one does not: its author is allowed to see who watched it
// after the window closed.
export const getStoryOwnerModel = async (storyId) => {
  try {
    const query = `
      SELECT story_id, user_id, expires_at, is_active
      FROM stories
      WHERE story_id = ? AND is_active = 1
    `;

    const [rows] = await db.execute(query, [storyId]);
    return rows[0] || null;
  } catch (error) {
    throw new Error(`Database error in getStoryOwner: ${error.message}`);
  }
};

// Read one story with its repost payload, unfiltered. Internal helper for the
// create response.
const getStoryRowModel = async (storyId) => {
  const query = `
    SELECT ${STORY_COLUMNS},${REPOST_COLUMNS}
    FROM stories s
    JOIN users u ON s.user_id = u.user_id
    ${REPOST_JOIN}
    WHERE s.story_id = ?
  `;

  const [rows] = await db.execute(query, [storyId]);
  return rows[0] || null;
};

// Check that a post can be reposted into a story by this user.
//
// posts.visibility is enum('public','connections','private') -- it has no
// 'university' member, so a post is either open, connection-gated, or the
// author's alone.
export const getRepostablePostModel = async (postId, userId) => {
  try {
    const query = `
      SELECT
        p.post_id,
        p.user_id,
        p.content,
        p.media_url,
        p.media_type,
        p.visibility,
        (
          p.user_id = ?
          OR p.visibility = 'public'
          OR (p.visibility = 'connections' AND EXISTS (
                SELECT 1 FROM connections c
                WHERE c.status = 'accepted'
                  AND ((c.requester_id = ? AND c.receiver_id = p.user_id)
                    OR (c.receiver_id = ? AND c.requester_id = p.user_id))
             ))
        ) AS can_view
      FROM posts p
      WHERE p.post_id = ?
        AND p.is_active = 1
        AND (p.expires_at IS NULL OR p.expires_at > NOW())
    `;

    const [rows] = await db.execute(query, [userId, userId, userId, postId]);
    return rows[0] || null;
  } catch (error) {
    throw new Error(`Database error in getRepostablePost: ${error.message}`);
  }
};

// The home screen tray: visible active stories grouped by author.
//
// Two queries, not one per author. The first picks and orders the author
// groups so LIMIT/OFFSET page over authors rather than over stories -- paging
// a flat story list would split one person's tray across two pages. The
// second pulls the stories for exactly those authors.
export const getStoryFeedModel = async (viewerId, limit = 20, offset = 0) => {
  const safeLimit = Math.min(parseInt(limit, 10) || 20, 100);
  const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);

  try {
    // has_unseen leads the sort: a tray the viewer has already watched through
    // belongs behind the ones with something new in them.
    const groupsQuery = `
      SELECT
        s.user_id,
        u.first_name,
        u.last_name,
        u.profile_picture_url,
        COUNT(*) AS story_count,
        SUM(sv.view_id IS NULL) AS unseen_count,
        MAX(s.created_at) AS latest_story_at
      FROM stories s
      JOIN users u ON s.user_id = u.user_id
      LEFT JOIN story_views sv
        ON sv.story_id = s.story_id AND sv.user_id = ?
      WHERE ${ACTIVE_WINDOW}
        AND ${CAN_VIEW}
      GROUP BY s.user_id, u.first_name, u.last_name, u.profile_picture_url
      ORDER BY (SUM(sv.view_id IS NULL) > 0) DESC, latest_story_at DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}
    `;

    const [groups] = await db.execute(groupsQuery, [
      viewerId,
      ...visibilityParams(viewerId),
    ]);

    if (groups.length === 0) {
      return [];
    }

    const authorIds = groups.map((group) => group.user_id);
    const placeholders = authorIds.map(() => "?").join(",");

    // The visibility predicate is repeated here on purpose. Membership in the
    // group list only proves the author has SOME visible story; each
    // individual story carries its own visibility and must be re-checked.
    const storiesQuery = `
      SELECT ${STORY_COLUMNS},${REPOST_COLUMNS},
        (sv.view_id IS NOT NULL) AS has_viewed
      FROM stories s
      JOIN users u ON s.user_id = u.user_id
      ${REPOST_JOIN}
      LEFT JOIN story_views sv
        ON sv.story_id = s.story_id AND sv.user_id = ?
      WHERE s.user_id IN (${placeholders})
        AND ${ACTIVE_WINDOW}
        AND ${CAN_VIEW}
      ORDER BY s.created_at ASC
    `;

    const [stories] = await db.execute(storiesQuery, [
      viewerId,
      ...authorIds,
      ...visibilityParams(viewerId),
    ]);

    const storiesByAuthor = new Map();
    stories.forEach((story) => {
      if (!storiesByAuthor.has(story.user_id)) {
        storiesByAuthor.set(story.user_id, []);
      }
      storiesByAuthor.get(story.user_id).push(story);
    });

    return groups.map((group) => ({
      ...group,
      stories: storiesByAuthor.get(group.user_id) || [],
    }));
  } catch (error) {
    throw new Error(`Database error in getStoryFeed: ${error.message}`);
  }
};

// One author's active stories, under the same visibility rules
export const getUserStoriesModel = async (authorId, viewerId) => {
  try {
    const query = `
      SELECT ${STORY_COLUMNS},${REPOST_COLUMNS},
        u.first_name,
        u.last_name,
        u.profile_picture_url,
        (sv.view_id IS NOT NULL) AS has_viewed
      FROM stories s
      JOIN users u ON s.user_id = u.user_id
      ${REPOST_JOIN}
      LEFT JOIN story_views sv
        ON sv.story_id = s.story_id AND sv.user_id = ?
      WHERE s.user_id = ?
        AND ${ACTIVE_WINDOW}
        AND ${CAN_VIEW}
      ORDER BY s.created_at ASC
    `;

    const [rows] = await db.execute(query, [
      viewerId,
      authorId,
      ...visibilityParams(viewerId),
    ]);
    return rows;
  } catch (error) {
    throw new Error(`Database error in getUserStories: ${error.message}`);
  }
};

// A single story.
//
// can_view comes back as a column instead of being applied as a filter so the
// caller can tell "no such story" (no row -> 404) from "not yours to see"
// (can_view = 0 -> 403). Expiry stays a filter: an expired story is gone, not
// forbidden.
export const getStoryByIdModel = async (storyId, viewerId) => {
  try {
    const query = `
      SELECT ${STORY_COLUMNS},${REPOST_COLUMNS},
        u.first_name,
        u.last_name,
        u.profile_picture_url,
        (SELECT COUNT(*) FROM story_views v WHERE v.story_id = s.story_id) AS view_count,
        (SELECT COUNT(*) FROM story_views v2
          WHERE v2.story_id = s.story_id AND v2.user_id = ?) AS has_viewed,
        ${CAN_VIEW} AS can_view
      FROM stories s
      JOIN users u ON s.user_id = u.user_id
      ${REPOST_JOIN}
      WHERE s.story_id = ?
        AND ${ACTIVE_WINDOW}
    `;

    const [rows] = await db.execute(query, [
      viewerId,
      ...visibilityParams(viewerId),
      storyId,
    ]);
    return rows[0] || null;
  } catch (error) {
    throw new Error(`Database error in getStoryById: ${error.message}`);
  }
};

// Record that a user viewed a story.
//
// The UNIQUE(story_id, user_id) key makes re-viewing a no-op rather than an
// error: replaying a view is normal client behaviour (a tray re-render, a
// retried request), so a duplicate reports the existing view instead of
// failing the request.
export const recordStoryViewModel = async (storyId, userId) => {
  try {
    const viewId = `view_${uuidv4()}`;

    const query = `
      INSERT INTO story_views (view_id, story_id, user_id)
      VALUES (?, ?, ?)
    `;

    await db.execute(query, [viewId, storyId, userId]);
    return { view_id: viewId, story_id: storyId, user_id: userId, new: true };
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return { story_id: storyId, user_id: userId, new: false };
    }
    throw new Error(`Database error in recordStoryView: ${error.message}`);
  }
};

// Who viewed a story. Ownership is the caller's to check.
export const getStoryViewersModel = async (storyId, limit = 50, offset = 0) => {
  const safeLimit = Math.min(parseInt(limit, 10) || 50, 100);
  const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);

  try {
    const query = `
      SELECT
        sv.view_id,
        sv.viewed_at,
        u.user_id,
        u.first_name,
        u.last_name,
        u.profile_picture_url
      FROM story_views sv
      JOIN users u ON sv.user_id = u.user_id
      WHERE sv.story_id = ?
      ORDER BY sv.viewed_at DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}
    `;

    const [rows] = await db.execute(query, [storyId]);
    return rows;
  } catch (error) {
    throw new Error(`Database error in getStoryViewers: ${error.message}`);
  }
};

// Delete a story (soft delete, matching posts -- story_views rows stay
// referenced, and the row is still needed for the author's own history)
export const deleteStoryModel = async (storyId, userId) => {
  try {
    const query = `
      UPDATE stories
      SET is_active = 0
      WHERE story_id = ? AND user_id = ? AND is_active = 1
    `;

    const [result] = await db.execute(query, [storyId, userId]);
    return result.affectedRows > 0;
  } catch (error) {
    throw new Error(`Database error in deleteStory: ${error.message}`);
  }
};
