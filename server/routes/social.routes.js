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

export default router;
