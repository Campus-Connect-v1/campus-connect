// controllers/social.controller.js
import {
  createPostModel,
  getFeedPostsModel,
  getPostByIdModel,
  likePostModel,
  unlikePostModel,
  addCommentModel,
  getPostCommentsModel,
  deletePostModel,
} from "../models/social.model.js";
import { isOwnMediaUrl } from "../config/cloudinary.js";
import { notify } from "../models/notification.model.js";
import { db } from "../config/db.js";

// Create a new post
export const createPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      content,
      media_url,
      media_type = "text",
      visibility = "connections",
      expires_at,
    } = req.body;

    if (!content && !media_url) {
      return res.status(400).json({
        message: "Either content or media_url is required",
      });
    }

    // media_url was accepted as an arbitrary string, so a post could point at
    // any URL on the internet -- a tracking pixel, or something that changes
    // to content nobody approved after the fact. Only accept media we hold.
    if (media_url && !isOwnMediaUrl(media_url)) {
      return res.status(400).json({
        message:
          "media_url must be a Cloudinary URL from this account. Upload via " +
          "POST /api/upload/signature first.",
      });
    }

    const postData = {
      user_id: userId,
      content,
      media_url,
      media_type,
      visibility,
      expires_at: expires_at || null,
    };

    const post = await createPostModel(postData);

    res.status(201).json({
      message: "Post created successfully",
      post: {
        post_id: post.post_id,
        content: post.content,
        media_url: post.media_url,
        media_type: post.media_type,
        poll_id: post.poll_id || null,
        visibility: post.visibility,
        expires_at: post.expires_at,
        created_at: post.created_at,
      },
    });
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({
      message: "Failed to create post",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get feed posts (from connections)
export const getFeedPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const posts = await getFeedPostsModel(
      userId,
      parseInt(limit),
      parseInt(offset)
    );

    res.status(200).json({
      message: "Feed posts retrieved successfully",
      count: posts.length,
      posts: posts.map((post) => ({
        post_id: post.post_id,
        content: post.content,
        media_url: post.media_url,
        media_type: post.media_type,
        poll_id: post.poll_id || null,
        visibility: post.visibility,
        created_at: post.created_at,
        expires_at: post.expires_at,
        author: {
          user_id: post.user_id,
          first_name: post.first_name,
          last_name: post.last_name,
          profile_picture_url: post.profile_picture_url,
          profile_headline: post.profile_headline,
        },
        stats: {
          like_count: parseInt(post.like_count),
          comment_count: parseInt(post.comment_count),
        },
        user_actions: {
          has_liked: Boolean(post.has_liked),
        },
      })),
    });
  } catch (error) {
    console.error("Get feed posts error:", error);
    res.status(500).json({
      message: "Failed to retrieve feed posts",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get a single post
export const getPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { post_id } = req.params;

    const post = await getPostByIdModel(post_id, userId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    res.status(200).json({
      message: "Post retrieved successfully",
      post: {
        post_id: post.post_id,
        content: post.content,
        media_url: post.media_url,
        media_type: post.media_type,
        poll_id: post.poll_id || null,
        visibility: post.visibility,
        created_at: post.created_at,
        expires_at: post.expires_at,
        author: {
          user_id: post.user_id,
          first_name: post.first_name,
          last_name: post.last_name,
          profile_picture_url: post.profile_picture_url,
          profile_headline: post.profile_headline,
        },
        stats: {
          like_count: parseInt(post.like_count),
          comment_count: parseInt(post.comment_count),
        },
        user_actions: {
          has_liked: Boolean(post.has_liked),
        },
      },
    });
  } catch (error) {
    console.error("Get post error:", error);
    res.status(500).json({
      message: "Failed to retrieve post",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Like a post
// Who should be told about activity on a post. Returns null when the actor is
// the author, so the caller can skip notifying someone about their own action.
const postAuthorToNotify = async (postId, actorId) => {
  try {
    const [[row]] = await db.execute(
      "SELECT user_id FROM posts WHERE post_id = ?",
      [postId]
    );
    return row && row.user_id !== actorId ? row.user_id : null;
  } catch {
    return null;
  }
};

const actorName = async (userId) => {
  try {
    const [[row]] = await db.execute(
      "SELECT first_name, last_name FROM users WHERE user_id = ?",
      [userId]
    );
    return row ? `${row.first_name} ${row.last_name}` : "Someone";
  } catch {
    return "Someone";
  }
};

export const likePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { post_id } = req.params;

    const like = await likePostModel(post_id, userId);

    // After the response is sent, not before: a notification failure must not
    // turn a successful like into a 500. notify() never throws, but the await
    // would still delay the reply for no benefit to the caller.
    const author = await postAuthorToNotify(post_id, userId);
    if (author) {
      notify({
        userId: author,
        actorId: userId,
        type: "post_like",
        resourceType: "post",
        resourceId: post_id,
        title: `${await actorName(userId)} liked your post`,
      });
    }

    res.status(201).json({
      message: "Post liked successfully",
      like: {
        like_id: like.like_id,
        post_id: like.post_id,
        user_id: like.user_id,
      },
    });
  } catch (error) {
    console.error("Like post error:", error);

    if (error.message.includes("Post already liked")) {
      return res.status(409).json({
        message: "Post already liked",
      });
    }

    if (
      error.message.includes("Post not found") ||
      error.message.includes("inactive") ||
      error.message.includes("expired")
    ) {
      return res.status(404).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to like post",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
// Unlike a post
export const unlikePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { post_id } = req.params;

    await unlikePostModel(post_id, userId);

    res.status(200).json({
      message: "Post unliked successfully",
    });
  } catch (error) {
    console.error("Unlike post error:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        message: "Like not found",
      });
    }

    res.status(500).json({
      message: "Failed to unlike post",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Add comment to post
export const addComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { post_id } = req.params;
    const { content, parent_comment_id = null } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({
        message: "Comment content is required",
      });
    }

    const commentData = {
      post_id,
      user_id: userId,
      content: content.trim(),
      parent_comment_id,
    };

    const comment = await addCommentModel(commentData);

    const commentAuthor = await postAuthorToNotify(post_id, userId);
    if (commentAuthor) {
      notify({
        userId: commentAuthor,
        actorId: userId,
        type: "post_comment",
        resourceType: "post",
        resourceId: post_id,
        title: `${await actorName(userId)} commented on your post`,
        body: String(content || "").slice(0, 140),
      });
    }

    res.status(201).json({
      message: "Comment added successfully",
      comment: {
        comment_id: comment.comment_id,
        content: comment.content,
        parent_comment_id: comment.parent_comment_id,
        created_at: comment.created_at,
      },
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({
      message: "Failed to add comment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get post comments
export const getPostComments = async (req, res) => {
  try {
    const { post_id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const comments = await getPostCommentsModel(
      post_id,
      parseInt(limit),
      parseInt(offset)
    );

    res.status(200).json({
      message: "Comments retrieved successfully",
      count: comments.length,
      comments: comments.map((comment) => ({
        comment_id: comment.comment_id,
        content: comment.content,
        parent_comment_id: comment.parent_comment_id,
        created_at: comment.created_at,
        author: {
          user_id: comment.user_id,
          first_name: comment.first_name,
          last_name: comment.last_name,
          profile_picture_url: comment.profile_picture_url,
        },
      })),
    });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({
      message: "Failed to retrieve comments",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Delete a post
export const deletePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { post_id } = req.params;

    await deletePostModel(post_id, userId);

    res.status(200).json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Delete post error:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        message: "Post not found or access denied",
      });
    }

    res.status(500).json({
      message: "Failed to delete post",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
