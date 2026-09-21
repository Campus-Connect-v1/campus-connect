// routes/poll.routes.js
import express from "express";
import {
  createPoll,
  getPoll,
  getPollResults,
  votePoll,
  retractVote,
  deletePoll,
} from "../controllers/poll.controller.js";
import authenticate from "../middleware/auth.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   - name: Polls
 *     description: Polls, votes, and results
 */

/**
 * @swagger
 * /polls:
 *   post:
 *     tags: [Polls]
 *     summary: Create a poll
 */
router.post("/", createPoll);

/**
 * @swagger
 * /polls/{poll_id}:
 *   get:
 *     tags: [Polls]
 *     summary: Get a poll with its options and the caller's selections
 */
router.get("/:poll_id", getPoll);

/**
 * @swagger
 * /polls/{poll_id}:
 *   delete:
 *     tags: [Polls]
 *     summary: Delete a poll and its post
 */
router.delete("/:poll_id", deletePoll);

/**
 * @swagger
 * /polls/{poll_id}/vote:
 *   post:
 *     tags: [Polls]
 *     summary: Cast or change a vote
 */
router.post("/:poll_id/vote", votePoll);

/**
 * @swagger
 * /polls/{poll_id}/vote:
 *   delete:
 *     tags: [Polls]
 *     summary: Retract a vote
 */
router.delete("/:poll_id/vote", retractVote);

/**
 * @swagger
 * /polls/{poll_id}/results:
 *   get:
 *     tags: [Polls]
 *     summary: Get poll results with per-option percentages
 */
router.get("/:poll_id/results", getPollResults);

export default router;
