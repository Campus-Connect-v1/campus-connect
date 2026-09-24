// models/notification.model.js
import { v4 as uuidv4 } from "uuid";
import { db } from "../config/db.js";
import { emitToUser } from "../realtime.js";

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
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_PUSH_CHUNK_SIZE = 100;

// How long a notification stays open to being bundled into. Six hours because
// a like on a morning post and a like that afternoon are the same event to the
// reader; a day later is genuinely new.
const BUNDLE_WINDOW_SECONDS = 6 * 60 * 60;

// A bundle may push again only after this. The first like pushes immediately;
// the second through tenth inside half an hour update the row silently and
// arrive as one "and N others" push when the cooldown expires.
const BUNDLE_PUSH_COOLDOWN_MS = 30 * 60 * 1000;

// Ceiling on pushes per recipient per hour. A post that takes off can generate
// dozens of distinct notifications; past this the in-app rows still arrive and
// the badge still moves, but the phone stops buzzing.
const MAX_PUSHES_PER_HOUR = 12;

const clamp = (value, max) =>
  typeof value === "string" && value.length > max ? value.slice(0, max) : value;

const isExpoPushToken = (token) =>
  typeof token === "string" &&
  /^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/.test(token);

const sendExpoPushBatch = async (messages) => {
  if (!messages.length) return;
  const headers = {
    Accept: "application/json",
    "Accept-Encoding": "gzip, deflate",
    "Content-Type": "application/json",
  };
  if (process.env.EXPO_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
  }

  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    throw new Error(`Expo push answered ${response.status}`);
  }

  const payload = await response.json();
  const tickets = Array.isArray(payload.data) ? payload.data : [];

  // Accepted messages get a ticket id; the receipt for it is collected later,
  // which is where DeviceNotRegistered normally shows up.
  void recordTickets(tickets, messages);

  const invalidTokens = [];
  tickets.forEach((ticket, index) => {
    if (ticket.status === "error") {
      console.error(
        "Expo push ticket error:",
        ticket.message,
        ticket.details || ""
      );
      if (ticket.details?.error === "DeviceNotRegistered" && messages[index]?.to) {
        invalidTokens.push(messages[index].to);
      }
    }
  });

  if (invalidTokens.length) {
    const placeholders = invalidTokens.map(() => "?").join(",");
    await db.execute(
      `UPDATE user_push_tokens
       SET is_active = 0, updated_at = CURRENT_TIMESTAMP
       WHERE expo_push_token IN (${placeholders})`,
      invalidTokens
    );
  }
};

/**
 * "HH:MM:SS" in the given IANA zone, or null if the zone is unrecognised.
 *
 * Formatted rather than arithmetic on offsets, so DST is handled by the
 * runtime's own tz database instead of by assuming a fixed offset.
 */
const localClock = (timeZone) => {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date());
  } catch {
    return null;
  }
};

/**
 * Whether a push may be sent to this user right now.
 *
 * Two gates, both about the phone rather than the app: quiet hours, and an
 * hourly ceiling. Neither suppresses the in-app notification -- the row is
 * already written and the realtime event has already fired, so nothing is
 * lost; the reader simply finds it when they next look instead of being woken.
 *
 * Failing open is deliberate. If this check itself errors, the notification
 * goes out: a missed notification is a worse failure than one that arrives
 * during someone's quiet hours.
 */
const pushAllowed = async (userId) => {
  try {
    const [[row]] = await db.execute(
      `SELECT
         u.quiet_hours_start,
         u.quiet_hours_end,
         COALESCE(NULLIF(u.timezone, ''), 'UTC') AS timezone,
         (SELECT COUNT(*) FROM notifications n
           WHERE n.user_id = u.user_id
             AND n.last_pushed_at > NOW() - INTERVAL 1 HOUR) AS pushes_last_hour
       FROM users u
       WHERE u.user_id = ?`,
      [userId]
    );

    if (!row) return false;

    if (Number(row.pushes_last_hour) >= MAX_PUSHES_PER_HOUR) return false;

    const { quiet_hours_start: start, quiet_hours_end: end } = row;
    if (!start || !end) return true;

    // The local clock is computed here rather than by CONVERT_TZ, which needs
    // the IANA timezone tables loaded in the server -- they are not on this
    // database, so CONVERT_TZ(NOW(),'UTC','Africa/Accra') returns NULL and
    // every quiet-hours window would silently never match. Intl is part of the
    // Node runtime and needs nothing installed.
    const now = localClock(row.timezone);
    if (!now) return true;

    // A window that wraps midnight (22:00-07:00) is outside-or, not between.
    return start <= end
      ? !(now >= start && now < end)
      : !(now >= start || now < end);
  } catch (error) {
    console.error("pushAllowed check failed, allowing push:", error.message);
    return true;
  }
};

const deliverPush = async (notification) => {
  if (!(await pushAllowed(notification.user_id))) return;

  const [rows] = await db.execute(
    `SELECT pt.expo_push_token
     FROM user_push_tokens pt
     JOIN users u ON u.user_id = pt.user_id
     WHERE pt.user_id = ? AND pt.is_active = 1 AND u.notification_push = 1`,
    [notification.user_id]
  );
  const tokens = rows.map((row) => row.expo_push_token).filter(isExpoPushToken);

  for (let i = 0; i < tokens.length; i += EXPO_PUSH_CHUNK_SIZE) {
    const messages = tokens.slice(i, i + EXPO_PUSH_CHUNK_SIZE).map((to) => ({
      to,
      sound: "default",
      title: notification.title,
      body: notification.body || undefined,
      data: {
        notification_id: notification.notification_id,
        type: notification.type,
        resource_type: notification.resource_type,
        resource_id: notification.resource_id,
      },
    }));
    await sendExpoPushBatch(messages);

    // Stamped after a successful send, so a failed push does not consume the
    // hourly allowance or start the bundle cooldown.
    if (notification.notification_id) {
      await db.execute(
        `UPDATE notifications SET last_pushed_at = NOW() WHERE notification_id = ?`,
        [notification.notification_id]
      );
    }
  }
};

const deliverPushMany = async (userIds, notification) => {
  for (let i = 0; i < userIds.length; i += FAN_OUT_CHUNK_SIZE) {
    const chunk = userIds.slice(i, i + FAN_OUT_CHUNK_SIZE);
    const placeholders = chunk.map(() => "?").join(",");
    const [rows] = await db.execute(
      `SELECT pt.expo_push_token
       FROM user_push_tokens pt
       JOIN users u ON u.user_id = pt.user_id
       WHERE pt.is_active = 1
         AND u.notification_push = 1
         AND pt.user_id IN (${placeholders})`,
      chunk
    );
    const tokens = rows.map((row) => row.expo_push_token).filter(isExpoPushToken);

    for (let offset = 0; offset < tokens.length; offset += EXPO_PUSH_CHUNK_SIZE) {
      await sendExpoPushBatch(
        tokens.slice(offset, offset + EXPO_PUSH_CHUNK_SIZE).map((to) => ({
          to,
          sound: "default",
          title: notification.title,
          body: notification.body || undefined,
          data: {
            type: notification.type,
            resource_type: notification.resourceType,
            resource_id: notification.resourceId,
          },
        }))
      );
    }
  }
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
  /**
   * Supplying actorName + action opts this notification into bundling, and
   * the title is composed from them instead of being taken verbatim:
   *
   *   1 actor  -> "Ada liked your post"
   *   n actors -> "Ada and 4 others liked your post"
   *
   * Call sites that pass only `title` behave exactly as before. Bundling has
   * to be opt-in per type, because collapsing is right for likes and wrong for
   * a direct message.
   */
  actorName = null,
  action = null,
}) => {
  try {
    if (!userId || !type || (!title && !action)) {
      console.error("notify: missing required field", { userId, type, title });
      return null;
    }

    // Nobody wants to be told about their own action.
    if (actorId && String(userId) === String(actorId)) return null;

    const bundles = Boolean(actorName && action);
    const composeTitle = (count) => {
      if (!bundles) return title;
      return count > 1
        ? `${actorName} and ${count - 1} ${count === 2 ? "other" : "others"} ${action}`
        : `${actorName} ${action}`;
    };

    const safeBody = clamp(body, BODY_MAX);

    // ---- Bundle into an existing unread notification, if there is one -----
    //
    // Scoped to the same recipient, type and resource, still unread, inside
    // the window. Read notifications are never bundled into: once someone has
    // seen "Ada liked your post", a later like is genuinely new information
    // and silently mutating the row they already read would be dishonest.
    if (bundles) {
      const [existing] = await db.execute(
        `SELECT notification_id, actor_count, last_pushed_at
         FROM notifications
         WHERE user_id = ?
           AND type = ?
           AND resource_id <=> ?
           AND is_read = 0
           AND created_at > NOW() - INTERVAL ${BUNDLE_WINDOW_SECONDS} SECOND
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId, type, resourceId]
      );

      if (existing.length > 0) {
        const row = existing[0];
        const nextCount = Number(row.actor_count) + 1;
        const bundledTitle = clamp(composeTitle(nextCount), TITLE_MAX);

        await db.execute(
          `UPDATE notifications
           SET actor_count = ?, actor_id = ?, title = ?, body = ?, created_at = NOW()
           WHERE notification_id = ?`,
          [nextCount, actorId, bundledTitle, safeBody, row.notification_id]
        );

        const notification = {
          notification_id: row.notification_id,
          user_id: userId,
          actor_id: actorId,
          actor_count: nextCount,
          type,
          resource_type: resourceType,
          resource_id: resourceId,
          title: bundledTitle,
          body: safeBody,
          is_read: 0,
        };

        // The in-app list is live either way -- the row changed, so the client
        // should re-read it.
        emitToUser(userId, "notification:new", notification);

        // Push again only once the cooldown has passed. Without this, the
        // fifth like of a minute pushes for the fifth time, which is the exact
        // behaviour bundling exists to prevent.
        const lastPushed = row.last_pushed_at ? new Date(row.last_pushed_at).getTime() : 0;
        if (Date.now() - lastPushed > BUNDLE_PUSH_COOLDOWN_MS) {
          void deliverPush(notification).catch((pushError) =>
            console.error("notify: push delivery failed:", pushError.message)
          );
        }

        return notification;
      }
    }

    // ---- Otherwise insert a new one --------------------------------------
    const notificationId = `notif_${uuidv4()}`;
    const safeTitle = clamp(composeTitle(1), TITLE_MAX);

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
      actor_count: 1,
      type,
      resource_type: resourceType,
      resource_id: resourceId,
      title: safeTitle,
      body: safeBody,
      is_read: 0,
    };

    // In-app realtime. Emitting here rather than at each call site means every
    // notification type -- likes, comments, connections, RSVPs, announcements --
    // becomes live at once, and any type added later is live for free.
    // emitToUser never throws and no-ops when no socket server is running.
    emitToUser(userId, "notification:new", notification);

    // Delivery is deliberately detached from the request path. The in-app row
    // is authoritative; a third-party transport failure must never turn the
    // user's successful action into a 500.
    void deliverPush(notification).catch((pushError) =>
      console.error("notify: push delivery failed:", pushError.message)
    );

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

    if (inserted > 0) {
      // One frame per recipient. Row ids are not read back -- the client
      // refetches the list on receipt -- so the payload stays a bare signal.
      for (const recipientId of recipients) {
        emitToUser(recipientId, "notification:new", {
          user_id: recipientId,
          actor_id: actorId,
          type,
          resource_type: resourceType,
          resource_id: resourceId,
          title: safeTitle,
          body: safeBody,
          is_read: 0,
        });
      }

      void deliverPushMany(recipients, {
        type,
        resourceType,
        resourceId,
        title: safeTitle,
        body: safeBody,
      }).catch((pushError) =>
        console.error("notifyMany: push delivery failed:", pushError.message)
      );
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

export const registerPushTokenModel = async (
  userId,
  { token, platform = "unknown", deviceId = null }
) => {
  if (!isExpoPushToken(token)) throw new Error("Invalid Expo push token");
  const tokenId = `push_${uuidv4()}`;
  await db.execute(
    `INSERT INTO user_push_tokens
       (token_id, user_id, expo_push_token, platform, device_id, is_active)
     VALUES (?, ?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE
       user_id = VALUES(user_id),
       platform = VALUES(platform),
       device_id = VALUES(device_id),
       is_active = 1,
       updated_at = CURRENT_TIMESTAMP`,
    [tokenId, userId, token, platform, deviceId]
  );
  return { token, platform, device_id: deviceId };
};

export const unregisterPushTokenModel = async (userId, token) => {
  const [result] = await db.execute(
    `UPDATE user_push_tokens
     SET is_active = 0, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ? AND expo_push_token = ?`,
    [userId, token]
  );
  return result.affectedRows > 0;
};

// ---------------------------------------------------------------------------
// Delivery receipts
//
// Expo's push API is two-phase. POST /send returns a ticket per message, which
// only says the message was accepted for delivery. Whether the device actually
// received it is answered later by GET /getPushNotificationReceipts, keyed by
// ticket id.
//
// This matters for one reason: DeviceNotRegistered -- the app was uninstalled
// or the token rotated -- almost always surfaces in the RECEIPT, not the
// ticket. Inspecting only tickets, as this file did, prunes a small minority
// of dead tokens and leaves the rest active forever, so every future fan-out
// keeps paying to send to phones that will never receive anything.
// ---------------------------------------------------------------------------

// getReceipts, not getPushNotificationReceipts -- the latter 404s. Probed
// against the live API rather than trusted from memory.
const EXPO_RECEIPTS_URL = "https://exp.host/--/api/v2/push/getReceipts";
const RECEIPT_CHUNK_SIZE = 300;

/** Remember a ticket so its receipt can be collected later. */
const recordTickets = async (tickets, messages) => {
  const rows = [];
  tickets.forEach((ticket, index) => {
    const to = messages[index]?.to;
    if (ticket?.status === "ok" && ticket.id && to) rows.push([ticket.id, to]);
  });

  if (!rows.length) return;

  try {
    const placeholders = rows.map(() => "(?, ?)").join(", ");
    await db.execute(
      `INSERT IGNORE INTO push_receipts (ticket_id, expo_push_token) VALUES ${placeholders}`,
      rows.flat()
    );
  } catch (error) {
    // Losing a receipt row costs us one token cleanup, not a notification.
    console.error("recordTickets failed:", error.message);
  }
};

/**
 * Collect outstanding receipts and deactivate the tokens that failed.
 *
 * Safe to call on a timer. Expo keeps receipts for roughly 24 hours, so
 * anything older is abandoned rather than retried forever.
 *
 * Returns a small summary, which is what makes it testable without a device.
 */
export const processPushReceipts = async () => {
  const summary = { checked: 0, deactivated: 0, errors: 0 };

  try {
    const [pending] = await db.execute(
      `SELECT ticket_id, expo_push_token
       FROM push_receipts
       WHERE checked_at IS NULL
         AND created_at > NOW() - INTERVAL 24 HOUR
       ORDER BY created_at ASC
       LIMIT ${RECEIPT_CHUNK_SIZE}`
    );

    if (pending.length === 0) {
      // Opportunistically drop rows too old to ever resolve, so the table does
      // not grow without bound on a quiet instance.
      await db.execute(
        `DELETE FROM push_receipts WHERE created_at < NOW() - INTERVAL 48 HOUR`
      );
      return summary;
    }

    const byTicket = new Map(pending.map((r) => [r.ticket_id, r.expo_push_token]));

    const headers = { Accept: "application/json", "Content-Type": "application/json" };
    if (process.env.EXPO_ACCESS_TOKEN) {
      headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
    }

    const response = await fetch(EXPO_RECEIPTS_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ ids: [...byTicket.keys()] }),
    });

    if (!response.ok) throw new Error(`Expo receipts answered ${response.status}`);

    const payload = await response.json();
    const receipts = payload?.data ?? {};
    const dead = [];
    const resolved = [];

    for (const [ticketId, receipt] of Object.entries(receipts)) {
      resolved.push(ticketId);
      summary.checked++;
      if (receipt?.status !== "error") continue;

      summary.errors++;
      const reason = receipt.details?.error;
      if (reason === "DeviceNotRegistered") {
        const token = byTicket.get(ticketId);
        if (token) dead.push(token);
      } else {
        // MessageTooBig, MessageRateExceeded, InvalidCredentials -- ours to
        // fix, not the device's, so the token stays active.
        console.error("push receipt error:", reason, receipt.message ?? "");
      }
    }

    if (dead.length) {
      const placeholders = dead.map(() => "?").join(",");
      const [result] = await db.execute(
        `UPDATE user_push_tokens
         SET is_active = 0, updated_at = CURRENT_TIMESTAMP
         WHERE expo_push_token IN (${placeholders}) AND is_active = 1`,
        dead
      );
      summary.deactivated = result.affectedRows;
    }

    if (resolved.length) {
      const placeholders = resolved.map(() => "?").join(",");
      await db.execute(
        `UPDATE push_receipts SET checked_at = NOW() WHERE ticket_id IN (${placeholders})`,
        resolved
      );
    }

    return summary;
  } catch (error) {
    console.error("processPushReceipts failed:", error.message);
    return summary;
  }
};
