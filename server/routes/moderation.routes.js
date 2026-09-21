// routes/moderation.routes.js
import express from "express";
import {
  hidePost,
  unhidePost,
  getHiddenPosts,
  reportPost,
  setPreference,
  deletePreference,
  getPreferences,
  seeLessLikePost,
  listReports,
  updateReportStatus,
  getReportStats,
} from "../controllers/moderation.controller.js";
import authenticate from "../middleware/auth.js";
import { requireOperator, requirePermission } from "../middleware/adminAuth.js";

const router = express.Router();

// This file mixes two audiences: students holding a user token, and operators
// holding an operator token for the admin console. So there is deliberately no
// `router.use(...)` here -- a blanket student `authenticate` would reject every
// operator token, and a blanket `requireOperator` would reject every student.
// Each route names its own guard.

/**
 * @swagger
 * tags:
 *   - name: Moderation
 *     description: Hiding posts, reporting, and feed preferences
 *   - name: Moderation (Admin)
 *     description: Operator-facing report queue
 */

// ---- student-facing: hiding ----------------------------------------------

/**
 * @swagger
 * /moderation/posts/{post_id}/hide:
 *   post:
 *     tags: [Moderation]
 *     summary: Hide a post from your own feed (idempotent)
 */
router.post("/posts/:post_id/hide", authenticate, hidePost);

/**
 * @swagger
 * /moderation/posts/{post_id}/hide:
 *   delete:
 *     tags: [Moderation]
 *     summary: Unhide a previously hidden post
 */
router.delete("/posts/:post_id/hide", authenticate, unhidePost);

/**
 * @swagger
 * /moderation/hidden:
 *   get:
 *     tags: [Moderation]
 *     summary: List the posts you have hidden
 */
router.get("/hidden", authenticate, getHiddenPosts);

// ---- student-facing: reporting -------------------------------------------

/**
 * @swagger
 * /moderation/posts/{post_id}/report:
 *   post:
 *     tags: [Moderation]
 *     summary: Report a post
 */
router.post("/posts/:post_id/report", authenticate, reportPost);

// ---- student-facing: feed preferences ------------------------------------

/**
 * @swagger
 * /moderation/posts/{post_id}/see-less:
 *   post:
 *     tags: [Moderation]
 *     summary: See less of posts like this one
 */
router.post("/posts/:post_id/see-less", authenticate, seeLessLikePost);

/**
 * @swagger
 * /moderation/preferences:
 *   post:
 *     tags: [Moderation]
 *     summary: Set a feed preference signal
 */
router.post("/preferences", authenticate, setPreference);

/**
 * @swagger
 * /moderation/preferences:
 *   get:
 *     tags: [Moderation]
 *     summary: List your feed preference signals
 */
router.get("/preferences", authenticate, getPreferences);

/**
 * @swagger
 * /moderation/preferences:
 *   delete:
 *     tags: [Moderation]
 *     summary: Remove a feed preference signal
 */
router.delete("/preferences", authenticate, deletePreference);

// ---- operator-facing: the report queue -----------------------------------
// requireOperator must run before requirePermission, which reads req.operator.

/**
 * @swagger
 * /moderation/reports/stats:
 *   get:
 *     tags: [Moderation (Admin)]
 *     summary: Report counts by status and by reason
 */
// Declared before the /reports/:report_id routes so the literal path is never
// read as a report id.
router.get(
  "/reports/stats",
  requireOperator,
  requirePermission("read"),
  getReportStats
);

/**
 * @swagger
 * /moderation/reports:
 *   get:
 *     tags: [Moderation (Admin)]
 *     summary: List reports for review
 */
router.get("/reports", requireOperator, requirePermission("read"), listReports);

/**
 * @swagger
 * /moderation/reports/{report_id}:
 *   patch:
 *     tags: [Moderation (Admin)]
 *     summary: Set a report's review status
 */
router.patch(
  "/reports/:report_id",
  requireOperator,
  requirePermission("write"),
  updateReportStatus
);

export default router;
