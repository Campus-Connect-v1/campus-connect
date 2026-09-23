// models/social.model.js
import { v4 as uuidv4 } from "uuid";
import db from "../config/db.js";
import mysql from "mysql";
import {
  hiddenPostFilterSql,
  feedPreferenceScoreSql,
} from "./moderation.model.js";

// Create a new post
export const createPostModel = async (postData) => {
  try {
    const postId = `post_${uuidv4()}`;
    // Every optional column defaults to null, not undefined. mysql2's execute()
    // refuses an undefined bind outright -- "Bind parameters must not contain
    // undefined" -- so a text-only post, which simply has no media_url key in
    // the request body, failed with a 500 before it ever reached the database.
    // createStoryModel already does this; posts were the outlier.
    const {
      user_id,
      content = null,
      media_url = null,
      media_type = "text",
      visibility = "connections",
      expires_at = null,
    } = postData;

    const query = `
      INSERT INTO posts (post_id, user_id, content, media_url, media_type, visibility, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      postId,
      user_id,
      content,
      media_url,
      media_type,
      visibility,
      expires_at,
    ]);

    return { post_id: postId, ...postData };
  } catch (error) {
    throw new Error(`Database error in createPost: ${error.message}`);
  }
};

// Get posts for user's feed (from connections)
/**
 * Encode/decode a feed cursor.
 *
 * The cursor is the sort key of the last row returned -- preference score,
 * then creation time, then post id as the tiebreak. base64 is not for secrecy
 * (the values are the caller's own last row); it keeps an opaque token out of
 * a URL so clients cannot be tempted to construct one by hand.
 */
export const encodeFeedCursor = (row) =>
  Buffer.from(
    JSON.stringify({
      s: Number(row.preference_score ?? 0),
      t: new Date(row.created_at).toISOString(),
      i: row.post_id,
    })
  ).toString("base64url");

const decodeFeedCursor = (cursor) => {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(String(cursor), "base64url").toString("utf8"));
    if (typeof parsed?.i !== "string" || !parsed?.t) return null;
    // A malformed cursor is treated as no cursor rather than as an error: the
    // worst case is the reader gets page one again, which beats a 400 on what
    // is usually a stale client.
    return { s: Number(parsed.s) || 0, t: new Date(parsed.t), i: parsed.i };
  } catch {
    return null;
  }
};

/**
 * How the feed decides what is eligible.
 *
 * "following" — posts from people you follow, plus your connections and your
 * own. This is the timeline proper.
 *
 * "discovery" — every public post from your university. Used when you follow
 * too few people for a graph query to fill a screen, because an empty feed is
 * the worst possible first impression and a new account has no graph yet.
 *
 * Before this, the clause was simply `OR p.visibility = 'public'` with no
 * graph term at all: every public post by every account in the database was in
 * everyone's feed. That is a firehose, and it works only while the database is
 * small enough that the firehose and a timeline look the same.
 */
export const FEED_MODES = { FOLLOWING: "following", DISCOVERY: "discovery" };

export const getFeedPostsModel = async (
  userId,
  limit = 20,
  offset = 0,
  cursor = null,
  mode = FEED_MODES.FOLLOWING
) => {
  const safeLimit = Number.isInteger(parseInt(limit)) ? parseInt(limit) : 20;
  const safeOffset = Number.isInteger(parseInt(offset)) ? parseInt(offset) : 0;
  const after = decodeFeedCursor(cursor);

  try {
    // Visibility is enforced here, in the query.
    //
    // This previously returned every active post regardless of `visibility`,
    // so posts marked 'connections' or 'private' were served to everyone. The
    // column existed and was written on create, but nothing ever read it.
    //
    // The connections test is bidirectional: you are connected if you are
    // either side of an accepted row, because `connections` stores one
    // directed row per pair.
    //
    // Hidden posts and "see less" signals come from moderation.model.js so the
    // two stay in one place. preference_score is aliased and then ordered by
    // name, which keeps the correlated subquery to a single bind.
    const postsQuery = `
      SELECT 
        p.post_id,
        p.user_id,
        p.content,
        p.media_url,
        p.media_type,
        p.visibility,
        p.created_at,
        p.expires_at,
        u.first_name,
        u.last_name,
        u.profile_picture_url,
        u.profile_headline,
        pol.poll_id,
        ${feedPreferenceScoreSql()} AS preference_score
      FROM posts p
      JOIN users u ON p.user_id = u.user_id
      LEFT JOIN polls pol ON pol.post_id = p.post_id
      WHERE p.is_active = 1
        AND (p.expires_at IS NULL OR p.expires_at > NOW())
        AND (
          p.user_id = ?
          OR (
            -- Public posts are visible to anyone; the graph decides whether
            -- they are RELEVANT. Two different questions that were previously
            -- answered by the same clause.
            p.visibility = 'public'
            AND (
              ${mode === FEED_MODES.DISCOVERY
                  // Campus-wide, not world-wide. A student with no graph yet
                  // should meet their own university, not every account on the
                  // platform -- that is a firehose wearing a different hat.
                  ? "u.university_id = (SELECT university_id FROM users WHERE user_id = ?)"
                  : `EXISTS (
                SELECT 1 FROM follows f
                WHERE f.follower_id = ? AND f.following_id = p.user_id
              )`}
            )
          )
          OR (
            -- Campus-wide: anyone at the same university, no graph required.
            -- This sits between public and connections and is the audience the
            -- composer has always called "Campus".
            p.visibility = 'university'
            AND u.university_id = (SELECT university_id FROM users WHERE user_id = ?)
          )
          OR (
            p.visibility = 'connections'
            AND EXISTS (
              SELECT 1 FROM connections c
              WHERE c.status = 'accepted'
                AND (
                  (c.requester_id = ? AND c.receiver_id = p.user_id)
                  OR (c.receiver_id = ? AND c.requester_id = p.user_id)
                )
            )
          )
        )
        AND ${hiddenPostFilterSql()}
      ORDER BY preference_score DESC, p.created_at DESC, p.post_id DESC
    `;

    /**
     * Keyset pagination.
     *
     * OFFSET is stable only while the underlying rows are: post something new
     * and every row shifts down one, so page two repeats the item that was
     * last on page one. At this size that is a correctness bug rather than a
     * speed one -- the cost of OFFSET 70 here is unmeasurable -- but it is the
     * one the reader actually notices.
     *
     * The comparison is lexicographic over the full sort key. Row-value syntax
     * ((a,b,c) < (?,?,?)) would be terser, but MySQL will not use an index for
     * it, and spelling it out leaves room to add one later.
     *
     * preference_score is deterministic per (viewer, post), so the key is
     * stable between pages. A "see less" tap mid-scroll changes it and can
     * shuffle what is still to come -- which is the correct response to the
     * reader having just told us their preferences changed.
     */
    const keysetSql = after
      ? `WHERE f.preference_score < ?
           OR (f.preference_score = ? AND f.created_at < ?)
           OR (f.preference_score = ? AND f.created_at = ? AND f.post_id < ?)`
      : "";

    const paginatedQuery = `
      SELECT f.* FROM (${postsQuery}) f
      ${keysetSql}
      ORDER BY f.preference_score DESC, f.created_at DESC, f.post_id DESC
      LIMIT ${safeLimit}${after ? "" : ` OFFSET ${safeOffset}`};
    `;

    // Five binds, all the same viewer: preference score, own posts, both sides
    // of the connections test, and the hidden-posts filter.
    // Bind order tracks the clause above: preference score, own posts, the
    // follows test (absent in discovery, where the branch is a literal), both
    // sides of the connections test, then the hidden-posts filter.
    // Both modes take six binds; only the third differs in meaning -- the
    // viewer's university in discovery, the viewer's follow edge otherwise.
    // Seven now: preference score, own posts, the follows test (or the
    // viewer university in discovery), the university-visibility test, both
    // sides of the connections test, then the hidden-posts filter.
    const viewerBinds = [userId, userId, userId, userId, userId, userId, userId];
    const cursorBinds = after
      ? [after.s, after.s, after.t, after.s, after.t, after.i]
      : [];

    const [posts] = await db.execute(paginatedQuery, [...viewerBinds, ...cursorBinds]);

    // If no posts, return empty array
    if (posts.length === 0) {
      return [];
    }

    // Get post IDs for batch queries
    const postIds = posts.map((post) => post.post_id);
    const placeholders = postIds.map(() => "?").join(",");

    // Get like counts for all posts
    const likesQuery = `
      SELECT post_id, COUNT(*) as like_count 
      FROM post_likes 
      WHERE post_id IN (${placeholders})
      GROUP BY post_id
    `;
    const [likeCounts] = await db.execute(likesQuery, postIds);

    // Get comment counts for all posts
    const commentsQuery = `
      SELECT post_id, COUNT(*) as comment_count 
      FROM post_comments 
      WHERE post_id IN (${placeholders}) AND is_active = 1
      GROUP BY post_id
    `;
    const [commentCounts] = await db.execute(commentsQuery, postIds);

    // Get user's likes for all posts
    const userLikesQuery = `
      SELECT post_id 
      FROM post_likes 
      WHERE post_id IN (${placeholders}) AND user_id = ?
    `;
    const [userLikes] = await db.execute(userLikesQuery, [...postIds, userId]);

    // Create lookup maps for fast access
    const likeCountMap = new Map();
    likeCounts.forEach((item) =>
      likeCountMap.set(item.post_id, item.like_count)
    );

    const commentCountMap = new Map();
    commentCounts.forEach((item) =>
      commentCountMap.set(item.post_id, item.comment_count)
    );

    const userLikedSet = new Set(userLikes.map((like) => like.post_id));

    // Combine all data
    const postsWithEngagement = posts.map((post) => ({
      ...post,
      like_count: likeCountMap.get(post.post_id) || 0,
      comment_count: commentCountMap.get(post.post_id) || 0,
      has_liked: userLikedSet.has(post.post_id),
    }));

    return postsWithEngagement;
  } catch (error) {
    console.error("Database error in getFeedPosts:", error);
    throw new Error(`Database error in getFeedPosts: ${error.message}`);
  }
};

// Get a single post with details
export const getPostByIdModel = async (postId, userId) => {
  try {
    const query = `
      SELECT 
        p.*,
        u.first_name,
        u.last_name,
        u.profile_picture_url,
        u.profile_headline,
        COUNT(DISTINCT pl.like_id) as like_count,
        COUNT(DISTINCT pc.comment_id) as comment_count,
        EXISTS(
          SELECT 1 FROM post_likes pl2 
          WHERE pl2.post_id = p.post_id AND pl2.user_id = ?
        ) as has_liked,
        pol.poll_id
      FROM posts p
      JOIN users u ON p.user_id = u.user_id
      LEFT JOIN post_likes pl ON p.post_id = pl.post_id
      LEFT JOIN post_comments pc ON p.post_id = pc.post_id AND pc.is_active = 1
      LEFT JOIN polls pol ON pol.post_id = p.post_id
      WHERE p.post_id = ? AND p.is_active = 1
      GROUP BY p.post_id
    `;

    const [rows] = await db.execute(query, [userId, postId]);
    return rows[0] || null;
  } catch (error) {
    throw new Error(`Database error in getPostById: ${error.message}`);
  }
};

// Like a post
export const likePostModel = async (postId, userId) => {
  try {
    // First, verify the post exists and is active
    const checkPostQuery = `
      SELECT post_id FROM posts 
      WHERE post_id = ? AND is_active = 1 
        AND (expires_at IS NULL OR expires_at > NOW())
    `;

    const [posts] = await db.execute(checkPostQuery, [postId]);

    if (posts.length === 0) {
      throw new Error("Post not found, inactive, or expired");
    }

    const likeId = `like_${uuidv4()}`;

    const query = `
      INSERT INTO post_likes (like_id, post_id, user_id)
      VALUES (?, ?, ?)
    `;

    const [result] = await db.execute(query, [likeId, postId, userId]);
    return { like_id: likeId, post_id: postId, user_id: userId };
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw new Error("Post already liked");
    }
    throw new Error(`Database error in likePost: ${error.message}`);
  }
};

// Unlike a post
export const unlikePostModel = async (postId, userId) => {
  try {
    const query = `
      DELETE FROM post_likes 
      WHERE post_id = ? AND user_id = ?
    `;

    const [result] = await db.execute(query, [postId, userId]);

    if (result.affectedRows === 0) {
      throw new Error("Like not found");
    }

    return { success: true };
  } catch (error) {
    throw new Error(`Database error in unlikePost: ${error.message}`);
  }
};

// Add comment to post
export const addCommentModel = async (commentData) => {
  try {
    const commentId = `comment_${uuidv4()}`;
    const { post_id, user_id, content, parent_comment_id = null } = commentData;

    const query = `
      INSERT INTO post_comments (comment_id, post_id, user_id, parent_comment_id, content)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      commentId,
      post_id,
      user_id,
      parent_comment_id,
      content,
    ]);

    return { comment_id: commentId, ...commentData };
  } catch (error) {
    throw new Error(`Database error in addComment: ${error.message}`);
  }
};

// Get comments for a post
export const getPostCommentsModel = async (postId, limit = 50, offset = 0, viewerId = null) => {
  try {
    // Like counts are aggregated in one grouped join rather than a correlated
    // subquery per row: at 50 comments the latter is 50 extra index lookups
    // for a number the client needs on every single row.
    const query = `
      SELECT
        pc.*,
        u.first_name,
        u.last_name,
        u.profile_picture_url,
        COALESCE(cl.like_count, 0) AS like_count,
        CASE WHEN mine.user_id IS NULL THEN 0 ELSE 1 END AS has_liked
      FROM post_comments pc
      JOIN users u ON pc.user_id = u.user_id
      LEFT JOIN (
        SELECT comment_id, COUNT(*) AS like_count
        FROM comment_likes
        GROUP BY comment_id
      ) cl ON cl.comment_id = pc.comment_id
      LEFT JOIN comment_likes mine
        ON mine.comment_id = pc.comment_id AND mine.user_id = ?
      WHERE pc.post_id = ? AND pc.is_active = 1
      ORDER BY pc.created_at ASC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.execute(query, [viewerId, postId, limit, offset]);
    return rows;
  } catch (error) {
    throw new Error(`Database error in getPostComments: ${error.message}`);
  }
};

// Delete a post (soft delete)
export const deletePostModel = async (postId, userId) => {
  try {
    const query = `
      UPDATE posts 
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE post_id = ? AND user_id = ?
    `;

    const [result] = await db.execute(query, [postId, userId]);

    if (result.affectedRows === 0) {
      throw new Error("Post not found or access denied");
    }

    return { success: true };
  } catch (error) {
    throw new Error(`Database error in deletePost: ${error.message}`);
  }
};

// ---------------------------------------------------------------------------
// Edits and comment removal
//
// Everything below soft-deletes (is_active = 0) to match deletePostModel: the
// feed, the counts and the moderation queue all filter on is_active, and a hard
// DELETE would cascade comments and likes out from under a post someone has
// merely tidied up.
// ---------------------------------------------------------------------------

/**
 * Edit a post's text. Ownership is part of the WHERE clause rather than a
 * separate SELECT, so a concurrent delete cannot slip between the check and
 * the write. Media is deliberately not editable -- the upload signature is
 * issued against a specific asset, so swapping it needs a new post.
 */
export const updatePostModel = async (postId, userId, content) => {
  try {
    const query = `
      UPDATE posts
      SET content = ?, updated_at = CURRENT_TIMESTAMP
      WHERE post_id = ? AND user_id = ? AND is_active = 1
    `;

    const [result] = await db.execute(query, [content, postId, userId]);

    if (result.affectedRows === 0) {
      throw new Error("Post not found or access denied");
    }

    return { post_id: postId, content };
  } catch (error) {
    throw new Error(`Database error in updatePost: ${error.message}`);
  }
};

/** Edit one's own comment. Same ownership-in-WHERE reasoning as above. */
export const updateCommentModel = async (commentId, userId, content) => {
  try {
    const query = `
      UPDATE post_comments
      SET content = ?, updated_at = CURRENT_TIMESTAMP
      WHERE comment_id = ? AND user_id = ? AND is_active = 1
    `;

    const [result] = await db.execute(query, [content, commentId, userId]);

    if (result.affectedRows === 0) {
      throw new Error("Comment not found or access denied");
    }

    return { comment_id: commentId, content };
  } catch (error) {
    throw new Error(`Database error in updateComment: ${error.message}`);
  }
};

/**
 * Remove a comment. Either the comment's author or the post's author may do
 * this -- letting someone clear a reply from their own post is the whole point
 * of a delete on a social feed, and it saves a round trip to the report queue
 * for something they can resolve themselves.
 *
 * Replies are cascaded: orphaned children would otherwise render under a
 * comment that is no longer there.
 */
export const deleteCommentModel = async (commentId, userId) => {
  try {
    const query = `
      UPDATE post_comments c
      JOIN posts p ON p.post_id = c.post_id
      SET c.is_active = 0, c.updated_at = CURRENT_TIMESTAMP
      WHERE c.comment_id = ?
        AND c.is_active = 1
        AND (c.user_id = ? OR p.user_id = ?)
    `;

    const [result] = await db.execute(query, [commentId, userId, userId]);

    if (result.affectedRows === 0) {
      throw new Error("Comment not found or access denied");
    }

    await db.execute(
      `UPDATE post_comments
       SET is_active = 0, updated_at = CURRENT_TIMESTAMP
       WHERE parent_comment_id = ? AND is_active = 1`,
      [commentId]
    );

    return { success: true };
  } catch (error) {
    throw new Error(`Database error in deleteComment: ${error.message}`);
  }
};

/**
 * Current like and comment totals for a post.
 *
 * Realtime events carry the authoritative count rather than a delta: a client
 * that missed a frame while backgrounded would otherwise drift, and there is
 * no way for it to notice. One round trip, two scalar subqueries.
 */
export const getPostCountsModel = async (postId) => {
  try {
    const [[counts]] = await db.execute(
      `SELECT
         (SELECT COUNT(*) FROM post_likes WHERE post_id = ?) AS like_count,
         (SELECT COUNT(*) FROM post_comments WHERE post_id = ? AND is_active = 1) AS comment_count`,
      [postId, postId]
    );

    return {
      like_count: Number(counts?.like_count ?? 0),
      comment_count: Number(counts?.comment_count ?? 0),
    };
  } catch (error) {
    // Counts are cosmetic: a failure here must not sink the action that
    // triggered the emit.
    console.error("getPostCounts failed:", error.message);
    return { like_count: null, comment_count: null };
  }
};

/** The author of a post, for ownership checks that need the id itself. */
export const getPostAuthorModel = async (postId) => {
  try {
    const [[row]] = await db.execute(
      `SELECT user_id FROM posts WHERE post_id = ? AND is_active = 1`,
      [postId]
    );
    return row?.user_id ?? null;
  } catch (error) {
    console.error("getPostAuthor failed:", error.message);
    return null;
  }
};

// ---------------------------------------------------------------------------
// Comment likes
// ---------------------------------------------------------------------------

/**
 * Like a comment. The comment must still be active — liking one that was just
 * deleted would leave a row pointing at something the feed no longer renders.
 * Returns the comment's post so the caller can broadcast to the right room.
 */
export const likeCommentModel = async (commentId, userId) => {
  try {
    const [[comment]] = await db.execute(
      `SELECT comment_id, post_id, user_id
       FROM post_comments
       WHERE comment_id = ? AND is_active = 1`,
      [commentId]
    );

    if (!comment) throw new Error("Comment not found");

    const likeId = `clike_${uuidv4()}`;
    await db.execute(
      `INSERT INTO comment_likes (like_id, comment_id, user_id) VALUES (?, ?, ?)`,
      [likeId, commentId, userId]
    );

    return {
      like_id: likeId,
      comment_id: commentId,
      post_id: comment.post_id,
      comment_author_id: comment.user_id,
    };
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") throw new Error("Comment already liked");
    if (error.message.includes("not found")) throw error;
    throw new Error(`Database error in likeComment: ${error.message}`);
  }
};

export const unlikeCommentModel = async (commentId, userId) => {
  try {
    const [[comment]] = await db.execute(
      `SELECT post_id FROM post_comments WHERE comment_id = ?`,
      [commentId]
    );

    const [result] = await db.execute(
      `DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?`,
      [commentId, userId]
    );

    if (result.affectedRows === 0) throw new Error("Like not found");

    return { success: true, post_id: comment?.post_id ?? null };
  } catch (error) {
    if (error.message.includes("not found")) throw error;
    throw new Error(`Database error in unlikeComment: ${error.message}`);
  }
};

/** Current like total for one comment, plus whether this viewer has liked it. */
export const getCommentLikeStateModel = async (commentId, userId) => {
  try {
    const [[row]] = await db.execute(
      `SELECT
         (SELECT COUNT(*) FROM comment_likes WHERE comment_id = ?) AS like_count,
         (SELECT COUNT(*) FROM comment_likes WHERE comment_id = ? AND user_id = ?) AS liked`,
      [commentId, commentId, userId]
    );
    return {
      like_count: Number(row?.like_count ?? 0),
      has_liked: Number(row?.liked ?? 0) > 0,
    };
  } catch (error) {
    console.error("getCommentLikeState failed:", error.message);
    return { like_count: null, has_liked: false };
  }
};

// ---------------------------------------------------------------------------
// Saved posts (bookmarks)
// ---------------------------------------------------------------------------

/**
 * Save a post. Idempotent by design: the client's bookmark button is a toggle
 * and a retry after a dropped response must not be an error, so a duplicate
 * returns the existing row rather than raising.
 */
export const savePostModel = async (postId, userId) => {
  try {
    const [[post]] = await db.execute(
      `SELECT post_id FROM posts WHERE post_id = ? AND is_active = 1`,
      [postId]
    );
    if (!post) throw new Error("Post not found");

    const savedId = `saved_${uuidv4()}`;
    await db.execute(
      `INSERT INTO saved_posts (saved_id, post_id, user_id) VALUES (?, ?, ?)`,
      [savedId, postId, userId]
    );

    return { saved_id: savedId, post_id: postId };
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return { post_id: postId, already_saved: true };
    if (error.message.includes("not found")) throw error;
    throw new Error(`Database error in savePost: ${error.message}`);
  }
};

/** Unsave. Also idempotent -- un-saving something already gone is a no-op. */
export const unsavePostModel = async (postId, userId) => {
  try {
    await db.execute(`DELETE FROM saved_posts WHERE post_id = ? AND user_id = ?`, [
      postId,
      userId,
    ]);
    return { success: true };
  } catch (error) {
    throw new Error(`Database error in unsavePost: ${error.message}`);
  }
};

/**
 * Just the ids, for hydrating the bookmark state of a feed in one request.
 * The saved *screen* needs whole posts, but every other screen only needs to
 * know which of the rows it is already showing are saved.
 */
export const getSavedPostIdsModel = async (userId) => {
  try {
    const [rows] = await db.execute(
      `SELECT sp.post_id
       FROM saved_posts sp
       JOIN posts p ON p.post_id = sp.post_id AND p.is_active = 1
       WHERE sp.user_id = ?
       ORDER BY sp.created_at DESC`,
      [userId]
    );
    return rows.map((row) => row.post_id);
  } catch (error) {
    throw new Error(`Database error in getSavedPostIds: ${error.message}`);
  }
};

/**
 * The saved posts themselves, shaped like the feed so the same card component
 * renders them without a second adapter.
 */
export const getSavedPostsModel = async (userId, limit = 50, offset = 0) => {
  try {
    const [rows] = await db.execute(
      `SELECT
         p.post_id, p.content, p.media_url, p.media_type, p.visibility,
         p.created_at, p.expires_at,
         u.user_id AS author_id, u.first_name, u.last_name,
         u.profile_picture_url, u.profile_headline,
         (SELECT COUNT(*) FROM post_likes WHERE post_id = p.post_id) AS like_count,
         (SELECT COUNT(*) FROM post_comments WHERE post_id = p.post_id AND is_active = 1) AS comment_count,
         (SELECT COUNT(*) FROM post_likes WHERE post_id = p.post_id AND user_id = ?) AS has_liked,
         pol.poll_id
       FROM saved_posts sp
       JOIN posts p ON p.post_id = sp.post_id AND p.is_active = 1
       JOIN users u ON u.user_id = p.user_id
       -- The feed and the profile query both join this; omitting it here meant
       -- a saved poll lost its options and rendered as a bare caption.
       LEFT JOIN polls pol ON pol.post_id = p.post_id
       WHERE sp.user_id = ?
       ORDER BY sp.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, userId, limit, offset]
    );

    return rows.map((row) => ({
      post_id: row.post_id,
      content: row.content,
      media_url: row.media_url,
      media_type: row.media_type,
      poll_id: row.poll_id ?? null,
      visibility: row.visibility,
      created_at: row.created_at,
      expires_at: row.expires_at,
      author: {
        user_id: row.author_id,
        first_name: row.first_name,
        last_name: row.last_name,
        profile_picture_url: row.profile_picture_url,
        profile_headline: row.profile_headline,
      },
      stats: { like_count: Number(row.like_count), comment_count: Number(row.comment_count) },
      user_actions: { has_liked: Number(row.has_liked) > 0, has_saved: true },
    }));
  } catch (error) {
    throw new Error(`Database error in getSavedPosts: ${error.message}`);
  }
};

// ---------------------------------------------------------------------------
// Posts by author
// ---------------------------------------------------------------------------

/**
 * One user's posts, as seen by a particular viewer.
 *
 * The client used to get this by pulling a page of the caller's own feed and
 * filtering it by author. That was already lossy -- it could only find posts
 * inside the fetched window -- and once the feed became graph-scoped it became
 * wrong: a profile for someone you do not follow would show nothing at all,
 * because none of their posts were in your feed to filter.
 *
 * Visibility is enforced here rather than inherited from the feed, and the
 * rules are the profile's own: your own posts always, public posts to anyone,
 * connections-only posts to accepted connections. Following someone does not
 * grant access to their 'connections' posts -- follow is about reach, the
 * connection is about trust, and conflating them would quietly widen who can
 * read a post someone deliberately restricted.
 *
 * Keyset on (created_at, post_id): a profile is strictly chronological, with
 * no preference score to fold in, so the cursor is simpler than the feed's.
 */
export const getUserPostsModel = async (
  authorId,
  viewerId,
  limit = 20,
  cursor = null
) => {
  const safeLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 50);

  let after = null;
  if (cursor) {
    try {
      const parsed = JSON.parse(Buffer.from(String(cursor), "base64url").toString("utf8"));
      if (parsed?.t && typeof parsed?.i === "string") {
        after = { t: new Date(parsed.t), i: parsed.i };
      }
    } catch {
      after = null;
    }
  }

  try {
    const keyset = after
      ? `AND (p.created_at < ? OR (p.created_at = ? AND p.post_id < ?))`
      : "";

    const query = `
      SELECT
        p.post_id, p.user_id, p.content, p.media_url, p.media_type,
        p.visibility, p.created_at, p.expires_at,
        u.first_name, u.last_name, u.profile_picture_url, u.profile_headline,
        pol.poll_id,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.post_id) AS like_count,
        (SELECT COUNT(*) FROM post_comments WHERE post_id = p.post_id AND is_active = 1) AS comment_count,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.post_id AND user_id = ?) AS has_liked,
        (SELECT COUNT(*) FROM saved_posts WHERE post_id = p.post_id AND user_id = ?) AS has_saved
      FROM posts p
      JOIN users u ON u.user_id = p.user_id
      LEFT JOIN polls pol ON pol.post_id = p.post_id
      WHERE p.user_id = ?
        AND p.is_active = 1
        AND (p.expires_at IS NULL OR p.expires_at > NOW())
        AND (
          p.user_id = ?
          OR p.visibility = 'public'
          OR (
            p.visibility = 'university'
            AND u.university_id = (SELECT university_id FROM users WHERE user_id = ?)
          )
          OR (
            p.visibility = 'connections'
            AND EXISTS (
              SELECT 1 FROM connections c
              WHERE c.status = 'accepted'
                AND (
                  (c.requester_id = ? AND c.receiver_id = p.user_id)
                  OR (c.receiver_id = ? AND c.requester_id = p.user_id)
                )
            )
          )
        )
        ${keyset}
      ORDER BY p.created_at DESC, p.post_id DESC
      LIMIT ${safeLimit}
    `;

    const binds = [viewerId, viewerId, authorId, viewerId, viewerId, viewerId, viewerId];
    if (after) binds.push(after.t, after.t, after.i);

    const [rows] = await db.execute(query, binds);

    return rows.map((row) => ({
      post_id: row.post_id,
      content: row.content,
      media_url: row.media_url,
      media_type: row.media_type,
      poll_id: row.poll_id ?? null,
      visibility: row.visibility,
      created_at: row.created_at,
      expires_at: row.expires_at,
      author: {
        user_id: row.user_id,
        first_name: row.first_name,
        last_name: row.last_name,
        profile_picture_url: row.profile_picture_url,
        profile_headline: row.profile_headline,
      },
      stats: {
        like_count: Number(row.like_count),
        comment_count: Number(row.comment_count),
      },
      user_actions: {
        has_liked: Number(row.has_liked) > 0,
        has_saved: Number(row.has_saved) > 0,
      },
    }));
  } catch (error) {
    throw new Error(`Database error in getUserPosts: ${error.message}`);
  }
};

/** Cursor for getUserPostsModel — chronological, so no score component. */
export const encodeUserPostCursor = (post) =>
  Buffer.from(
    JSON.stringify({ t: new Date(post.created_at).toISOString(), i: post.post_id })
  ).toString("base64url");
