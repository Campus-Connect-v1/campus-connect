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
  getPostLikesModel,
  getLikedPostsModel,
  getUserPostsModel,
  deleteCommentModel,
} from "../models/social.model.js";

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
export const likePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { post_id } = req.params;

    const like = await likePostModel(post_id, userId);

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
// controllers/social.controller.js - Fix getPostComments
export const getPostComments = async (req, res) => {
  try {
    const { post_id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    console.log("getPostComments params:", { post_id, limit, offset });

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

// Get post likes with user details
export const getPostLikes = async (req, res) => {
  try {
    const { post_id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const likes = await getPostLikesModel(
      post_id,
      parseInt(limit),
      parseInt(offset)
    );

    res.status(200).json({
      message: "Likes retrieved successfully",
      count: likes.length,
      likes: likes.map((like) => ({
        like_id: like.like_id,
        created_at: like.created_at,
        user: {
          user_id: like.user_id,
          first_name: like.first_name,
          last_name: like.last_name,
          profile_picture_url: like.profile_picture_url,
          profile_headline: like.profile_headline,
        },
      })),
    });
  } catch (error) {
    console.error("Get likes error:", error);
    res.status(500).json({
      message: "Failed to retrieve likes",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get user's posts
export const getUserPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { user_id } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // Users can only view their own posts or posts from their connections
    const targetUserId = user_id || userId;

    const posts = await getUserPostsModel(
      targetUserId,
      userId,
      parseInt(limit),
      parseInt(offset)
    );

    res.status(200).json({
      message: "User posts retrieved successfully",
      count: posts.length,
      posts: posts.map((post) => ({
        post_id: post.post_id,
        content: post.content,
        media_url: post.media_url,
        media_type: post.media_type,
        visibility: post.visibility,
        created_at: post.created_at,
        expires_at: post.expires_at,
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
    console.error("Get user posts error:", error);
    res.status(500).json({
      message: "Failed to retrieve user posts",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Update post
export const updatePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { post_id } = req.params;
    const { content, media_url, media_type, visibility, expires_at } = req.body;

    if (!content && !media_url) {
      return res.status(400).json({
        message: "Either content or media_url is required",
      });
    }

    const updateData = {
      content,
      media_url,
      media_type,
      visibility,
      expires_at,
    };

    const post = await updatePostModel(post_id, userId, updateData);

    res.status(200).json({
      message: "Post updated successfully",
      post: {
        post_id: post.post_id,
        content: post.content,
        media_url: post.media_url,
        media_type: post.media_type,
        visibility: post.visibility,
        expires_at: post.expires_at,
        updated_at: post.updated_at,
      },
    });
  } catch (error) {
    console.error("Update post error:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        message: "Post not found or access denied",
      });
    }

    res.status(500).json({
      message: "Failed to update post",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Delete comment
export const deleteComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { comment_id } = req.params;

    await deleteCommentModel(comment_id, userId);

    res.status(200).json({
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Delete comment error:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        message: "Comment not found or access denied",
      });
    }

    res.status(500).json({
      message: "Failed to delete comment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get user's liked posts
export const getLikedPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const posts = await getLikedPostsModel(
      userId,
      parseInt(limit),
      parseInt(offset)
    );
    console.log(`🎯 Controller - Posts returned from model:`, posts.length);

    res.status(200).json({
      message: "Liked posts retrieved successfully",
      count: posts.length,
      posts: posts.map((post) => ({
        post_id: post.post_id,
        content: post.content,
        media_url: post.media_url,
        media_type: post.media_type,
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
        liked_at: post.liked_at,
      })),
    });
  } catch (error) {
    console.error("Get liked posts error:", error);
    res.status(500).json({
      message: "Failed to retrieve liked posts",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
