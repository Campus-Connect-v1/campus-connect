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
export const getFeedPostsModel = async (userId, limit = 20, offset = 0) => {
  const safeLimit = Number.isInteger(parseInt(limit)) ? parseInt(limit) : 20;
  const safeOffset = Number.isInteger(parseInt(offset)) ? parseInt(offset) : 0;

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
          OR p.visibility = 'public'
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
      ORDER BY preference_score DESC, p.created_at DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset};
    `;

    // Five binds, all the same viewer: preference score, own posts, both sides
    // of the connections test, and the hidden-posts filter.
    const [posts] = await db.execute(postsQuery, [
      userId,
      userId,
      userId,
      userId,
      userId,
    ]);

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
export const getPostCommentsModel = async (postId, limit = 50, offset = 0) => {
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
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.execute(query, [postId, limit, offset]);
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
