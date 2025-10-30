// routes/social.routes.js
import express from "express";
import {
  createPost,
  getFeedPosts,
  getPost,
  likePost,
  unlikePost,
  addComment,
  getPostComments,
  deletePost,
  getLikedPosts,
  updatePost,
  getPostLikes,
  getUserPosts,
  deleteComment,
} from "../controllers/social.controller.js";
import authenticate from "../middleware/auth.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   - name: Social
 *     description: Posts, likes, and comments
 */

/**
 * @swagger
 * /social/posts:
 *   post:
 *     tags: [Social]
 *     summary: Create a new post
 */
router.post("/posts", createPost);

/**
 * @swagger
 * /social/posts/feed:
 *   get:
 *     tags: [Social]
 *     summary: Get feed posts from connections
 */
router.get("/posts/feed", getFeedPosts);

/**
 * @swagger
 * /social/posts/{post_id}:
 *   get:
 *     tags: [Social]
 *     summary: Get a single post
 */
router.get("/posts/:post_id", getPost);

/**
 * @swagger
 * /social/posts/{post_id}:
 *   delete:
 *     tags: [Social]
 *     summary: Delete a post
 */
router.delete("/posts/:post_id", deletePost);

/**
 * @swagger
 * /social/posts/{post_id}/like:
 *   post:
 *     tags: [Social]
 *     summary: Like a post
 */
router.post("/posts/:post_id/like", likePost);

/**
 * @swagger
 * /social/posts/{post_id}/like:
 *   delete:
 *     tags: [Social]
 *     summary: Unlike a post
 */
router.delete("/posts/:post_id/like", unlikePost);

/**
 * @swagger
 * /social/posts/{post_id}/comments:
 *   post:
 *     tags: [Social]
 *     summary: Add comment to post
 */
router.post("/posts/:post_id/comments", addComment);

/**
 * @swagger
 * /social/posts/{post_id}/comments:
 *   get:
 *     tags: [Social]
 *     summary: Get post comments
 */
router.get("/posts/:post_id/comments", getPostComments);

// routes/social.routes.js - Additional routes

/**
 * @swagger
 * /social/posts/{post_id}/likes:
 *   get:
 *     tags: [Social]
 *     summary: Get post likes with user details
 */
router.get("/posts/:post_id/likes", getPostLikes);

/**
 * @swagger
 * /social/posts/user/{user_id}:
 *   get:
 *     tags: [Social]
 *     summary: Get user's posts (omit user_id for current user)
 */
router.get("/posts/user/:user_id", getUserPosts);

/**
 * @swagger
 * /social/posts/{post_id}:
 *   put:
 *     tags: [Social]
 *     summary: Update a post
 */
router.put("/posts/:post_id", updatePost);

/**
 * @swagger
 * /social/comments/{comment_id}:
 *   delete:
 *     tags: [Social]
 *     summary: Delete a comment
 */
router.delete("/comments/:comment_id", deleteComment);

/**
 * @swagger
 * /social/posts/liked:
 *   get:
 *     tags: [Social]
 *     summary: Get user's liked posts
 */
router.get("/posts/liked", getLikedPosts);

export default router;
