// controllers/notification.controller.js
import {
  getNotificationsModel,
  getUnreadCountModel,
  markNotificationReadModel,
  markAllNotificationsReadModel,
  deleteNotificationModel,
  clearNotificationsModel,
} from "../models/notification.model.js";

// Shape a row for the client. The actor is nested rather than left as flat
// actor_* columns so it matches the `author` block the social endpoints return,
// and is null for system notifications, which have no actor.
const formatNotification = (notification) => ({
  notification_id: notification.notification_id,
  type: notification.type,
  resource_type: notification.resource_type,
  resource_id: notification.resource_id,
  title: notification.title,
  body: notification.body,
  is_read: Boolean(notification.is_read),
  read_at: notification.read_at,
  created_at: notification.created_at,
  actor: notification.actor_id
    ? {
        user_id: notification.actor_id,
        first_name: notification.actor_first_name,
        last_name: notification.actor_last_name,
        profile_picture_url: notification.actor_profile_picture_url,
      }
    : null,
});

// Get the caller's notifications, newest first
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { unread_only, limit = 20, offset = 0 } = req.query;

    // Query strings are always strings, so compare against the literal rather
    // than relying on truthiness -- "false" is truthy.
    const unreadOnly = unread_only === "true" || unread_only === "1";

    const notifications = await getNotificationsModel(userId, {
      unreadOnly,
      limit,
      offset,
    });

    res.status(200).json({
      message: "Notifications retrieved successfully",
      count: notifications.length,
      notifications: notifications.map(formatNotification),
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      message: "Failed to retrieve notifications",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Unread count for the badge
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await getUnreadCountModel(userId);

    res.status(200).json({ count });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      message: "Failed to retrieve unread count",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Mark a single notification read
export const markNotificationRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notification_id } = req.params;

    const updated = await markNotificationReadModel(notification_id, userId);

    // The model scopes the update to the caller, so a miss means either "no
    // such notification" or "not yours". Both answer 404: distinguishing them
    // would confirm the existence of other people's notification ids.
    if (!updated) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({
      message: "Failed to mark notification as read",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Mark all of the caller's unread notifications read
export const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const updated = await markAllNotificationsReadModel(userId);

    res.status(200).json({
      message: "Notifications marked as read",
      updated,
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    res.status(500).json({
      message: "Failed to mark notifications as read",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Delete a single notification
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notification_id } = req.params;

    const deleted = await deleteNotificationModel(notification_id, userId);

    if (!deleted) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({
      message: "Failed to delete notification",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Clear all of the caller's notifications
export const clearNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const deleted = await clearNotificationsModel(userId);

    res.status(200).json({
      message: "Notifications cleared successfully",
      deleted,
    });
  } catch (error) {
    console.error("Clear notifications error:", error);
    res.status(500).json({
      message: "Failed to clear notifications",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
