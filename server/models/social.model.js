// models/social.model.js
import { v4 as uuidv4 } from "uuid";
import db from "../config/db.js";
import mysql from "mysql";

const toNumber = (value, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const parseInterests = (raw) => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((item) => String(item).toLowerCase());
  } catch {
    return String(raw)
      .split(/[,;|]/)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
};

const sharedWordsScore = (viewer, author, content) => {
  const words = new Set(
    [
      ...viewer.interests,
      ...viewer.courses,
      viewer.program,
    ]
      .filter(Boolean)
      .flatMap((item) => String(item).toLowerCase().split(/[^a-z0-9]+/))
      .filter((item) => item.length > 2),
  );
  const haystack = `${author.interests.join(" ")} ${author.courses.join(" ")} ${
    author.program ?? ""
  } ${content ?? ""}`.toLowerCase();
  let score = 0;
  for (const word of words) {
    if (haystack.includes(word)) score += 1;
  }
  return Math.min(score, 6);
};

const applyFeedDiversity = (ranked) => {
  const selected = [];
  const deferred = [];
  const perUser = new Map();

  for (const post of ranked) {
    const count = perUser.get(post.user_id) ?? 0;
    if (count < 2) {
      selected.push(post);
      perUser.set(post.user_id, count + 1);
    } else {
      deferred.push({ ...post, feed_score: post.feed_score - count * 8 });
    }
  }

  return [...selected, ...deferred.sort((a, b) => b.feed_score - a.feed_score)];
};

// Create a new post
export const createPostModel = async (postData) => {
  try {
    const postId = `post_${uuidv4()}`;
    const {
      user_id,
      content,
      media_url,
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
      content ?? null,
      media_url ?? null,
      media_type ?? "text",
      visibility ?? "connections",
      expires_at ?? null,
    ]);

    return {
      post_id: postId,
      user_id,
      content: content ?? null,
      media_url: media_url ?? null,
      media_type: media_type ?? "text",
      visibility: visibility ?? "connections",
      expires_at: expires_at ?? null,
    };
  } catch (error) {
    throw new Error(`Database error in createPost: ${error.message}`);
  }
};

// Get posts for user's feed (from connections)
export const getFeedPostsModel = async (userId, limit = 20, offset = 0) => {
  const safeLimit = Number.isInteger(parseInt(limit)) ? parseInt(limit) : 20;
  const safeOffset = Number.isInteger(parseInt(offset)) ? parseInt(offset) : 0;
  const candidateLimit = Math.max(safeLimit + safeOffset + 80, 120);

  try {
    const [[viewerRow]] = await db.execute(
      `SELECT user_id, university_id, program, interests
       FROM users
       WHERE user_id = ?`,
      [userId],
    );

    const [viewerCourses] = await db.execute(
      `SELECT course_code, course_name
       FROM user_courses
       WHERE user_id = ? AND is_current = 1`,
      [userId],
    );

    const viewer = {
      university_id: viewerRow?.university_id,
      program: viewerRow?.program,
      interests: parseInterests(viewerRow?.interests),
      courses: viewerCourses.flatMap((course) => [
        course.course_code,
        course.course_name,
      ]),
    };

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
        u.university_id,
        u.program,
        u.interests,
        u.first_name,
        u.last_name,
        u.profile_picture_url,
        u.profile_headline,
        TIMESTAMPDIFF(MINUTE, p.created_at, NOW()) as age_minutes,
        COALESCE(l.like_count, 0) as like_count,
        COALESCE(c.comment_count, 0) as comment_count,
        COALESCE(l.recent_like_count, 0) as recent_like_count,
        COALESCE(c.recent_comment_count, 0) as recent_comment_count,
        CASE WHEN pl.user_id IS NULL THEN 0 ELSE 1 END as has_liked,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM connections cx
            WHERE cx.status = 'accepted'
              AND (
                (cx.requester_id = ? AND cx.receiver_id = p.user_id)
                OR (cx.receiver_id = ? AND cx.requester_id = p.user_id)
              )
          ) THEN 1
          ELSE 0
        END as is_connection,
        CASE WHEN fps.post_id IS NULL THEN 0 ELSE 1 END as has_seen
      FROM posts p
      JOIN users u ON p.user_id = u.user_id
      LEFT JOIN (
        SELECT
          post_id,
          COUNT(*) as like_count,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 12 HOUR) THEN 1 ELSE 0 END) as recent_like_count
        FROM post_likes
        GROUP BY post_id
      ) l ON l.post_id = p.post_id
      LEFT JOIN (
        SELECT
          post_id,
          COUNT(*) as comment_count,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 12 HOUR) THEN 1 ELSE 0 END) as recent_comment_count
        FROM post_comments
        WHERE is_active = 1
        GROUP BY post_id
      ) c ON c.post_id = p.post_id
      LEFT JOIN post_likes pl ON pl.post_id = p.post_id AND pl.user_id = ?
      LEFT JOIN feed_post_seen fps ON fps.user_id = ? AND fps.post_id = p.post_id
      WHERE p.is_active = 1
        AND (p.expires_at IS NULL OR p.expires_at > NOW())
        AND (
          p.visibility = 'public'
          OR p.user_id = ?
          OR u.university_id = ?
          OR EXISTS (
            SELECT 1
            FROM connections cx2
            WHERE cx2.status = 'accepted'
              AND (
                (cx2.requester_id = ? AND cx2.receiver_id = p.user_id)
                OR (cx2.receiver_id = ? AND cx2.requester_id = p.user_id)
              )
          )
        )
      ORDER BY p.created_at DESC
      LIMIT ${candidateLimit};
    `;

    const [posts] = await db.execute(postsQuery, [
      userId,
      userId,
      userId,
      userId,
      userId,
      viewer.university_id,
      userId,
      userId,
    ]);

    // If no posts, return empty array
    if (posts.length === 0) {
      return [];
    }

    const authorIds = [...new Set(posts.map((post) => post.user_id))];
    const authorMeta = new Map();
    if (authorIds.length) {
      const authorPlaceholders = authorIds.map(() => "?").join(",");
      const [authorCourses] = await db.execute(
        `SELECT user_id, course_code, course_name
         FROM user_courses
         WHERE user_id IN (${authorPlaceholders}) AND is_current = 1`,
        authorIds,
      );
      for (const id of authorIds) authorMeta.set(id, { courses: [] });
      for (const course of authorCourses) {
        authorMeta.get(course.user_id)?.courses.push(course.course_code, course.course_name);
      }
    }

    const scored = posts.map((post) => {
      const ageHours = Math.max(toNumber(post.age_minutes) / 60, 0);
      const likeCount = toNumber(post.like_count);
      const commentCount = toNumber(post.comment_count);
      const recentLikes = toNumber(post.recent_like_count);
      const recentComments = toNumber(post.recent_comment_count);
      const recencyScore = 42 / (1 + ageHours / 6);
      const sameUniversityScore = post.university_id === viewer.university_id ? 18 : 0;
      const connectionScore = post.is_connection ? 22 : 0;
      const engagementVelocityScore =
        Math.log1p(likeCount) * 3 +
        Math.log1p(commentCount) * 5 +
        recentLikes * 1.2 +
        recentComments * 3;
      const stalePenalty = ageHours > 48 ? 18 : ageHours > 24 ? 8 : 0;
      const seenPenalty = post.has_seen ? 28 : 0;
      const author = {
        program: post.program,
        interests: parseInterests(post.interests),
        courses: authorMeta.get(post.user_id)?.courses ?? [],
      };
      const overlapScore = sharedWordsScore(viewer, author, post.content) * 3;

      return {
        ...post,
        like_count: likeCount,
        comment_count: commentCount,
        has_liked: Boolean(post.has_liked),
        feed_score:
          recencyScore +
          sameUniversityScore +
          connectionScore +
          engagementVelocityScore +
          overlapScore -
          stalePenalty -
          seenPenalty,
      };
    });

    const ranked = applyFeedDiversity(
      scored.sort((a, b) => b.feed_score - a.feed_score),
    );

    return ranked.slice(safeOffset, safeOffset + safeLimit);
  } catch (error) {
    console.error("Database error in getFeedPosts:", error);
    throw new Error(`Database error in getFeedPosts: ${error.message}`);
  }
};

export const markFeedPostsSeenModel = async (userId, postIds = []) => {
  const uniquePostIds = [...new Set(postIds)].filter(Boolean);
  if (uniquePostIds.length === 0) return;

  const values = uniquePostIds.map(() => "(?, ?)").join(",");
  const params = uniquePostIds.flatMap((postId) => [userId, postId]);

  await db.execute(
    `INSERT INTO feed_post_seen (user_id, post_id)
     VALUES ${values}
     ON DUPLICATE KEY UPDATE seen_at = CURRENT_TIMESTAMP`,
    params,
  );
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
        ) as has_liked
      FROM posts p
      JOIN users u ON p.user_id = u.user_id
      LEFT JOIN post_likes pl ON p.post_id = pl.post_id
      LEFT JOIN post_comments pc ON p.post_id = pc.post_id AND pc.is_active = 1
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
export const getPostCommentsModel = async (postId, limit = 50, offset = 0) => {
  const safeLimit = Number.isInteger(parseInt(limit)) ? parseInt(limit) : 50;
  const safeOffset = Number.isInteger(parseInt(offset)) ? parseInt(offset) : 0;

  try {
    const query = `
      SELECT 
        pc.*,
        u.first_name,
        u.last_name,
        u.profile_picture_url
      FROM post_comments pc
      JOIN users u ON pc.user_id = u.user_id
      WHERE pc.post_id = ? AND pc.is_active = 1
      ORDER BY pc.created_at ASC
      LIMIT ${safeLimit} OFFSET ${safeOffset}
    `;

    const [rows] = await db.execute(query, [postId]);
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
