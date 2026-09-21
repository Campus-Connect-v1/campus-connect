// models/notification.model.js
import { v4 as uuidv4 } from "uuid";
import { db } from "../config/db.js";

// How long two identical unread notifications are treated as the same event.
// Sized for double-taps and retried requests, not for genuine repeat activity.
const DEDUPE_WINDOW_SECONDS = 60;

// One statement per fan-out chunk keeps the packet well under max_allowed_packet
// while still being a single round trip for any realistic group or event size.
const FAN_OUT_CHUNK_SIZE = 500;

// Columns are varchar(255)/varchar(500). Truncating here means an over-long
// title costs the user a clipped string rather than the whole notification:
// notify() swallows its errors, so a rejected INSERT would vanish silently.
const TITLE_MAX = 255;
const BODY_MAX = 500;

const clamp = (value, max) =>
  typeof value === "string" && value.length > max ? value.slice(0, max) : value;

// Push/email delivery is NOT implemented yet.
//
// This is the hook point: when a transport (FCM/APNs, or a mailer for
// notification_email) is added, it goes here, and it must honour the
// recipient's preference flag before sending anything. The notifications row
// is inserted regardless of the flag, because the in-app list and the badge
// are not "delivery" -- turning push off should silence the device, not hide
// the notification inside the app.
//
// Deliberately never throws and never awaits anything slow: notify() runs
// inside request handlers on hot paths.
const deliverPush = (notification, pushEnabled) => {
  if (!pushEnabled) return;
  // TODO: enqueue for the push transport (do not send inline -- a request
  // handler must not wait on a third-party network call).
};

/**
 * Create a single notification.
 *
 * Contract, because this is called from inside like/comment/connection/RSVP
 * handlers: it NEVER throws and NEVER rejects. A notification that cannot be
 * written must not turn someone's successful like into a 500. Every failure
 * path logs and returns null.
 *
 * Returns the created notification, or null when nothing was inserted
 * (self-action, suppressed duplicate, unknown recipient, or an error).
 */
export const notify = async ({
  userId,
  actorId = null,
  type,
  resourceType = null,
  resourceId = null,
  title,
  body = null,
}) => {
  try {
    if (!userId || !type || !title) {
      console.error("notify: missing required field", { userId, type, title });
      return null;
    }

    // Nobody wants to be told about their own action.
    if (actorId && String(userId) === String(actorId)) return null;

    const notificationId = `notif_${uuidv4()}`;
    const safeTitle = clamp(title, TITLE_MAX);
    const safeBody = clamp(body, BODY_MAX);

    // Single statement so the duplicate check and the insert cannot interleave
    // with a concurrent request -- reading first and then inserting would let
    // two rapid likes both see "no duplicate" and both insert.
    //
    // SELECT ... FROM users also makes the recipient's existence part of the
    // same atomic decision, so a stale user id yields zero rows instead of a
    // foreign key error.
    //
    // <=> (null-safe equality) matters: actor_id and resource_id are nullable,
    // and plain = never matches NULL, which would defeat de-duplication for
    // system notices and for types that carry no resource.
    const insertSql = `
      INSERT INTO notifications
        (notification_id, user_id, actor_id, type, resource_type, resource_id, title, body)
      SELECT ?, ?, ?, ?, ?, ?, ?, ?
      FROM users u
      WHERE u.user_id = ?
        AND NOT EXISTS (
          SELECT 1
          FROM notifications n
          WHERE n.user_id = ?
            AND n.is_read = 0
            AND n.type = ?
            AND n.actor_id <=> ?
            AND n.resource_id <=> ?
            AND n.created_at > NOW() - INTERVAL ${DEDUPE_WINDOW_SECONDS} SECOND
        )
    `;

    const [result] = await db.execute(insertSql, [
      notificationId,
      userId,
      actorId,
      type,
      resourceType,
      resourceId,
      safeTitle,
      safeBody,
      userId,
      userId,
      type,
      actorId,
      resourceId,
    ]);

    // Zero rows means the guard fired: a duplicate inside the window, or no
    // such recipient. Neither is an error worth surfacing to the caller.
    if (result.affectedRows === 0) return null;

    const notification = {
      notification_id: notificationId,
      user_id: userId,
      actor_id: actorId,
      type,
      resource_type: resourceType,
      resource_id: resourceId,
      title: safeTitle,
      body: safeBody,
      is_read: 0,
    };

    // Only read the preference once a row actually exists -- suppressed
    // duplicates skip this entirely, so the common hot-path repeat costs one
    // query, and this is a primary key lookup.
    try {
      const [prefs] = await db.execute(
        `SELECT notification_push FROM users WHERE user_id = ?`,
        [userId]
      );
      deliverPush(notification, prefs[0]?.notification_push !== 0);
    } catch (prefError) {
      // The row is already saved; failing to check a preference must not
      // undo that or bubble out.
      console.error(
        "notify: could not read notification_push preference:",
        prefError.message
      );
    }

    return notification;
  } catch (error) {
    // The whole point of this function: absorb everything.
    console.error("notify failed (action unaffected):", error.message);
    return null;
  }
};

/**
 * Fan one payload out to many recipients (group and event announcements).
 *
 * Same no-throw contract as notify(). Uses one multi-row INSERT per chunk
 * rather than a loop of single inserts, so a 300-member group is one round
 * trip instead of 300.
 *
 * Returns the number of rows inserted (0 on failure).
 */
export const notifyMany = async (
  recipientIds,
  {
    actorId = null,
    type,
    resourceType = null,
    resourceId = null,
    title,
    body = null,
  } = {}
) => {
  try {
    if (!Array.isArray(recipientIds) || recipientIds.length === 0) return 0;
    if (!type || !title) {
      console.error("notifyMany: missing required field", { type, title });
      return 0;
    }

    // Dedupe the list (a user can appear twice via two memberships) and drop
    // the actor, so the person posting an announcement is not notified of it.
    const recipients = [...new Set(recipientIds.filter(Boolean).map(String))].filter(
      (id) => !actorId || id !== String(actorId)
    );
    if (recipients.length === 0) return 0;

    const safeTitle = clamp(title, TITLE_MAX);
    const safeBody = clamp(body, BODY_MAX);
    let inserted = 0;

    for (let i = 0; i < recipients.length; i += FAN_OUT_CHUNK_SIZE) {
      const chunk = recipients.slice(i, i + FAN_OUT_CHUNK_SIZE);
      const placeholders = chunk.map(() => "(?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
      const params = chunk.flatMap((recipientId) => [
        `notif_${uuidv4()}`,
        recipientId,
        actorId,
        type,
        resourceType,
        resourceId,
        safeTitle,
        safeBody,
      ]);

      // IGNORE so one stale member id (already deleted, failing the foreign
      // key) skips its own row instead of discarding the whole announcement.
      const sql = `
        INSERT IGNORE INTO notifications
          (notification_id, user_id, actor_id, type, resource_type, resource_id, title, body)
        VALUES ${placeholders}
      `;

      try {
        const [result] = await db.execute(sql, params);
        inserted += result.affectedRows || 0;
      } catch (chunkError) {
        // Keep going: a bad chunk should not cost the remaining recipients
        // their notification.
        console.error("notifyMany: chunk failed:", chunkError.message);
      }
    }

    return inserted;
  } catch (error) {
    console.error("notifyMany failed (action unaffected):", error.message);
    return 0;
  }
};

// Paginated list for one user, newest first.
// The actor is joined in so the client can render "Ada liked your post" without
// a follow-up request per notification. LEFT JOIN because actor_id is NULL for
// system notices.
export const getNotificationsModel = async (
  userId,
  { unreadOnly = false, limit = 20, offset = 0 } = {}
) => {
  // LIMIT/OFFSET cannot be bound as parameters in a prepared statement here,
  // so they are parsed and capped before interpolation.
  const safeLimit = Math.min(parseInt(limit, 10) || 20, 50);
  const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);

  try {
    const query = `
      SELECT
        n.notification_id,
        n.type,
        n.resource_type,
        n.resource_id,
        n.title,
        n.body,
        n.is_read,
        n.read_at,
        n.created_at,
        n.actor_id,
        a.first_name AS actor_first_name,
        a.last_name AS actor_last_name,
        a.profile_picture_url AS actor_profile_picture_url
      FROM notifications n
      LEFT JOIN users a ON n.actor_id = a.user_id
      WHERE n.user_id = ?
        ${unreadOnly ? "AND n.is_read = 0" : ""}
      ORDER BY n.created_at DESC, n.notification_id DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}
    `;

    const [rows] = await db.execute(query, [userId]);
    return rows;
  } catch (error) {
    throw new Error(`Database error in getNotifications: ${error.message}`);
  }
};

// Badge count. Deliberately no joins and no other columns: this is requested on
// nearly every screen and is served entirely by idx_user_unread
// (user_id, is_read, created_at).
export const getUnreadCountModel = async (userId) => {
  try {
    const query = `
      SELECT COUNT(*) AS count
      FROM notifications
      WHERE user_id = ? AND is_read = 0
    `;

    const [rows] = await db.execute(query, [userId]);
    return parseInt(rows[0]?.count, 10) || 0;
  } catch (error) {
    throw new Error(`Database error in getUnreadCount: ${error.message}`);
  }
};

// Mark one notification read.
// Ownership lives in the WHERE clause, not in a fetch-then-compare: checking
// first would leave a window in which the row could change owner or be deleted.
// Returns true if it is the caller's notification, false if it does not exist
// (or belongs to someone else -- indistinguishable on purpose, so this cannot
// be used to probe for other people's notification ids).
export const markNotificationReadModel = async (notificationId, userId) => {
  try {
    // COALESCE preserves the original read_at, so re-reading an already-read
    // notification does not rewrite when it was first seen.
    const query = `
      UPDATE notifications
      SET is_read = 1,
          read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
      WHERE notification_id = ? AND user_id = ?
    `;

    const [result] = await db.execute(query, [notificationId, userId]);
    if (result.affectedRows > 0) return true;

    // Drivers disagree on whether affectedRows counts matched-but-unchanged
    // rows, so a zero here is ambiguous: already read, or absent. Only this
    // rare branch pays for the extra lookup, and it keeps an already-read
    // notification from being reported as a 404.
    const [rows] = await db.execute(
      `SELECT notification_id FROM notifications WHERE notification_id = ? AND user_id = ?`,
      [notificationId, userId]
    );
    return rows.length > 0;
  } catch (error) {
    throw new Error(
      `Database error in markNotificationRead: ${error.message}`
    );
  }
};

// Mark every unread notification for this user read. Returns the number changed.
// Restricted to is_read = 0 so already-read rows keep their original read_at.
export const markAllNotificationsReadModel = async (userId) => {
  try {
    const query = `
      UPDATE notifications
      SET is_read = 1,
          read_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND is_read = 0
    `;

    const [result] = await db.execute(query, [userId]);
    return result.affectedRows || 0;
  } catch (error) {
    throw new Error(
      `Database error in markAllNotificationsRead: ${error.message}`
    );
  }
};

// Delete one notification. Ownership enforced in the WHERE clause.
// Returns false when there was nothing of the caller's to delete, so the
// controller can answer 404 rather than 500.
export const deleteNotificationModel = async (notificationId, userId) => {
  try {
    const query = `
      DELETE FROM notifications
      WHERE notification_id = ? AND user_id = ?
    `;

    const [result] = await db.execute(query, [notificationId, userId]);
    return result.affectedRows > 0;
  } catch (error) {
    throw new Error(`Database error in deleteNotification: ${error.message}`);
  }
};

// Clear the caller's whole notification list. Returns the number removed.
export const clearNotificationsModel = async (userId) => {
  try {
    const query = `
      DELETE FROM notifications
      WHERE user_id = ?
    `;

    const [result] = await db.execute(query, [userId]);
    return result.affectedRows || 0;
  } catch (error) {
    throw new Error(`Database error in clearNotifications: ${error.message}`);
  }
};
