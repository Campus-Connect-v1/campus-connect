// routes/story.routes.js
import express from "express";
import {
  createStory,
  getStoryFeed,
  getUserStories,
  getStory,
  viewStory,
  getStoryViewers,
  deleteStory,
} from "../controllers/story.controller.js";
import authenticate from "../middleware/auth.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   - name: Stories
 *     description: Ephemeral stories, the story tray, and story views
 */

/**
 * @swagger
 * /stories:
 *   post:
 *     tags: [Stories]
 *     summary: Create a story (image, video, text, or repost)
 */
router.post("/", createStory);

/**
 * @swagger
 * /stories/feed:
 *   get:
 *     tags: [Stories]
 *     summary: Get the story tray, grouped by author and unseen first
 */
router.get("/feed", getStoryFeed);

/**
 * @swagger
 * /stories/user/{user_id}:
 *   get:
 *     tags: [Stories]
 *     summary: Get one author's active stories
 */
router.get("/user/:user_id", getUserStories);

// Declared after /feed and /user/:user_id so those literal segments are not
// swallowed by the :story_id wildcard.

/**
 * @swagger
 * /stories/{story_id}:
 *   get:
 *     tags: [Stories]
 *     summary: Get a single story
 */
router.get("/:story_id", getStory);

/**
 * @swagger
 * /stories/{story_id}/view:
 *   post:
 *     tags: [Stories]
 *     summary: Record a view of a story
 */
router.post("/:story_id/view", viewStory);

/**
 * @swagger
 * /stories/{story_id}/viewers:
 *   get:
 *     tags: [Stories]
 *     summary: List who viewed a story (author only)
 */
router.get("/:story_id/viewers", getStoryViewers);

/**
 * @swagger
 * /stories/{story_id}:
 *   delete:
 *     tags: [Stories]
 *     summary: Delete a story (author only)
 */
router.delete("/:story_id", deleteStory);

export default router;
