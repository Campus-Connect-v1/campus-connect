// services/push/index.js
//
// Mobile push notifications, as a self-contained service.
//
// This module owns everything about getting a message onto a phone: the
// device registry (user_push_tokens), delivery through Expo, and cleanup of
// dead tokens from delivery receipts (push_receipts). It knows nothing about
// in-app notifications, likes, bundling or quiet hours -- callers decide
// WHETHER to push; this decides HOW.
//
// Its only dependency on the rest of the API is the MySQL pool, plus reading
// users.notification_push (the user's push opt-out). Nothing else in the
// server should query user_push_tokens or push_receipts or call Expo
// directly; go through the exports below. That boundary is what lets this be
// moved into its own deployed service later without touching its callers'
// logic -- only this file's imports would change.
//
// Public API:
//   registerDevice(userId, { token, platform, deviceId })
//   unregisterDevice(userId, token)
//   sendToUsers(userIds, { title, body, data })  -> { accepted }
//   processReceipts()                             -> { checked, deactivated, errors }
//   startReceiptPolling()                         -> timer
//   isExpoPushToken(token)

import { v4 as uuidv4 } from "uuid";
import { db } from "../../config/db.js";
import {
  isExpoPushToken,
  sendBatch,
  getReceipts,
  SEND_CHUNK_SIZE,
  RECEIPT_CHUNK_SIZE,
} from "./expo.js";

export { isExpoPushToken };

// One token lookup per this many users keeps the IN (...) list well under
// max_allowed_packet for any realistic group or event size.
const USER_CHUNK_SIZE = 500;

// Expo answers a send with a ticket and the real outcome with a receipt
// fetched later, so a token that died is only discoverable on a second pass.
// Fifteen minutes is well inside Expo's ~24h retention and costs one request
// per interval when there is nothing to collect.
const RECEIPT_POLL_MS = 15 * 60 * 1000;

// ---------------------------------------------------------------------------
// Device registry
// ---------------------------------------------------------------------------

export const registerDevice = async (
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

export const unregisterDevice = async (userId, token) => {
  const [result] = await db.execute(
    `UPDATE user_push_tokens
     SET is_active = 0, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ? AND expo_push_token = ?`,
    [userId, token]
  );
  return result.affectedRows > 0;
};

const deactivateTokens = async (tokens) => {
  if (!tokens.length) return 0;
  const placeholders = tokens.map(() => "?").join(",");
  const [result] = await db.execute(
    `UPDATE user_push_tokens
     SET is_active = 0, updated_at = CURRENT_TIMESTAMP
     WHERE expo_push_token IN (${placeholders}) AND is_active = 1`,
    tokens
  );
  return result.affectedRows || 0;
};

// Active devices for these users, excluding anyone who turned push off.
const tokensForUsers = async (userIds) => {
  const placeholders = userIds.map(() => "?").join(",");
  const [rows] = await db.execute(
    `SELECT pt.expo_push_token
     FROM user_push_tokens pt
     JOIN users u ON u.user_id = pt.user_id
     WHERE pt.is_active = 1
       AND u.notification_push = 1
       AND pt.user_id IN (${placeholders})`,
    userIds
  );
  return rows.map((row) => row.expo_push_token).filter(isExpoPushToken);
};

// ---------------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------------

/** Remember accepted tickets so their receipts can be collected later. */
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
    console.error("push: recordTickets failed:", error.message);
  }
};

/**
 * Push one message to every active device of each user.
 *
 * Throws only if Expo itself cannot be reached; per-device failures are
 * handled here. Returns how many devices Expo accepted the message for, so a
 * caller can tell "sent" from "this user has no devices".
 */
export const sendToUsers = async (userIds, { title, body = null, data = {} }) => {
  const recipients = [...new Set((userIds || []).filter(Boolean).map(String))];
  let accepted = 0;

  for (let i = 0; i < recipients.length; i += USER_CHUNK_SIZE) {
    const tokens = await tokensForUsers(recipients.slice(i, i + USER_CHUNK_SIZE));

    for (let offset = 0; offset < tokens.length; offset += SEND_CHUNK_SIZE) {
      const messages = tokens.slice(offset, offset + SEND_CHUNK_SIZE).map((to) => ({
        to,
        sound: "default",
        title,
        body: body || undefined,
        data,
      }));

      const tickets = await sendBatch(messages);

      // Accepted messages get a ticket id; the receipt for it is collected
      // later, which is where DeviceNotRegistered normally shows up.
      void recordTickets(tickets, messages);

      const invalidTokens = [];
      tickets.forEach((ticket, index) => {
        if (ticket.status === "ok") {
          accepted++;
          return;
        }
        console.error("Expo push ticket error:", ticket.message, ticket.details || "");
        if (ticket.details?.error === "DeviceNotRegistered" && messages[index]?.to) {
          invalidTokens.push(messages[index].to);
        }
      });

      await deactivateTokens(invalidTokens);
    }
  }

  return { accepted };
};

// ---------------------------------------------------------------------------
// Delivery receipts
//
// Expo's push API is two-phase. POST /send returns a ticket per message, which
// only says the message was accepted for delivery. Whether the device actually
// received it is answered later by the receipts endpoint, keyed by ticket id.
//
// This matters for one reason: DeviceNotRegistered -- the app was uninstalled
// or the token rotated -- almost always surfaces in the RECEIPT, not the
// ticket. Inspecting only tickets prunes a small minority of dead tokens and
// leaves the rest active forever, so every future fan-out keeps paying to send
// to phones that will never receive anything.
// ---------------------------------------------------------------------------

/**
 * Collect outstanding receipts and deactivate the tokens that failed.
 *
 * Safe to call on a timer. Expo keeps receipts for roughly 24 hours, so
 * anything older is abandoned rather than retried forever.
 *
 * Returns a small summary, which is what makes it testable without a device.
 */
export const processReceipts = async () => {
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
    const receipts = await getReceipts([...byTicket.keys()]);
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

    summary.deactivated = await deactivateTokens(dead);

    if (resolved.length) {
      const placeholders = resolved.map(() => "?").join(",");
      await db.execute(
        `UPDATE push_receipts SET checked_at = NOW() WHERE ticket_id IN (${placeholders})`,
        resolved
      );
    }

    return summary;
  } catch (error) {
    console.error("processReceipts failed:", error.message);
    return summary;
  }
};

/**
 * Poll receipts on an interval for the life of the process.
 *
 * unref() so this timer never holds the process open on shutdown.
 */
export const startReceiptPolling = () => {
  const timer = setInterval(() => {
    void processReceipts().then((summary) => {
      if (summary.checked || summary.deactivated) {
        console.log(JSON.stringify({ level: "info", scope: "push.receipts", ...summary }));
      }
    });
  }, RECEIPT_POLL_MS);
  timer.unref();
  return timer;
};
