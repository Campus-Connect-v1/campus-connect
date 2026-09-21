import express from "express";
import authenticate from "../middleware/auth.js";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearNotifications,
  registerPushToken,
  unregisterPushToken,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/notifications/push-tokens:
 *   post:
 *     summary: Register or reactivate an Expo push token for this user
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *   delete:
 *     summary: Deactivate an Expo push token for this user
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 */
router.post("/push-tokens", registerPushToken);
router.delete("/push-tokens", unregisterPushToken);

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: List the caller's notifications, newest first
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: unread_only
 *         schema: { type: boolean }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, maximum: 50 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Notifications with actor details }
 */
router.get("/", getNotifications);

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     summary: Unread count for the badge
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "{ count: N }" }
 */
router.get("/unread-count", getUnreadCount);

// Declared before /:notification_id/read, or the wildcard swallows it.
/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: Mark every unread notification as read
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: How many were changed }
 */
router.patch("/read-all", markAllNotificationsRead);

/**
 * @swagger
 * /notifications/{notification_id}/read:
 *   patch:
 *     summary: Mark one notification as read
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: notification_id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Marked read }
 *       404: { description: Not found, or not the caller's }
 */
router.patch("/:notification_id/read", markNotificationRead);

// Same ordering hazard as above: the collection delete precedes the item one.
/**
 * @swagger
 * /notifications:
 *   delete:
 *     summary: Clear all of the caller's notifications
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: How many were removed }
 */
router.delete("/", clearNotifications);

/**
 * @swagger
 * /notifications/{notification_id}:
 *   delete:
 *     summary: Delete one notification
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: notification_id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *       404: { description: Not found, or not the caller's }
 */
router.delete("/:notification_id", deleteNotification);

export default router;
