// Permanent deletion of accounts that were deleted more than 30 days ago.
//
//   purgeExpiredAccounts({ dryRun })   -> summary; dryRun changes nothing
//   startAccountPurge()                -> timer
//
// Deleting an account is two-stage, and this is the second stage.
//
//   1. deleteProfileModel deactivates the account (is_active = 0), blanks the
//      profile and keeps a full copy in user_archive. Read queries filter on
//      users.is_active, so the person and everything they posted disappear
//      from the app at once -- without touching the content rows, which is
//      what lets recoverProfileModel restore it all within 30 days.
//   2. After 30 days, this removes it for good: MySQL rows, MongoDB documents
//      and uploaded media.
//
// Selection needs BOTH is_active = 0 and an archive row older than 30 days.
// An account deactivated some other way -- a moderation suspension, say -- has
// no archive row and is never purged by this.
//
// MySQL: almost every table references users.user_id with ON DELETE CASCADE,
// so deleting the users row removes posts (and through them comments, likes,
// polls, mentions, reports and saves of those posts), comments, likes,
// stories, story views, connections, follows, events the user created (and
// their RSVPs), study groups the user created (and their members), group
// memberships, RSVPs, notifications sent to or caused by the user, push
// tokens, sessions, interests, courses, availability, privacy settings and
// password-reset codes. The tables WITHOUT a foreign key to users are cleaned
// explicitly, before the users row:
//   audit_logs      user_id, no FK; holds IP addresses and coordinates
//   otps            keyed by email, not user id; matched on the archived email
//   push_receipts   keyed by push token; matched through user_push_tokens
//   user_archive    the archived copy itself
//
// Order per account: media, then MongoDB, then one MySQL transaction. MongoDB
// and Cloudinary cannot join the transaction, so they go first. If the MySQL
// step then fails, the account is still selected next run and the earlier
// steps simply find nothing left to delete. The other order would leave
// orphaned chats and files that nothing would ever select again.

import mongoose from "mongoose";
import { db } from "../config/db.js";
import { deleteByPrefix } from "../config/cloudinary.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { UserLocation } from "../models/location.js";

export const RETENTION_DAYS = 30;

// Once a day is plenty for a 30-day window. It also runs shortly after boot,
// because a free Render instance restarts on every deploy and can go weeks
// without ever living a full 24 hours -- a daily-only timer might never fire.
const PURGE_INTERVAL_MS = 24 * 60 * 60 * 1000;
const FIRST_RUN_DELAY_MS = 5 * 60 * 1000;

// Matches the kinds accepted by controllers/upload.controller.js.
const MEDIA_KINDS = ["posts", "avatars", "events"];

const findExpiredAccounts = async () => {
  const [rows] = await db.execute(
    `SELECT u.user_id, a.email AS archived_email, a.archived_at
       FROM users u
       JOIN user_archive a ON a.user_id = u.user_id
      WHERE u.is_active = 0
        AND a.archived_at < NOW() - INTERVAL ${RETENTION_DAYS} DAY
      ORDER BY a.archived_at`
  );
  return rows;
};

// What a purge would take with it, for the dry run. Only the larger tables:
// enough to sanity-check a run, not an inventory.
const countLinkedRows = async (userId) => {
  const [[row]] = await db.execute(
    `SELECT
       (SELECT COUNT(*) FROM posts WHERE user_id = ?)                                   AS posts,
       (SELECT COUNT(*) FROM post_comments WHERE user_id = ?)                           AS comments,
       (SELECT COUNT(*) FROM stories WHERE user_id = ?)                                 AS stories,
       (SELECT COUNT(*) FROM events WHERE created_by = ?)                               AS events_created,
       (SELECT COUNT(*) FROM study_groups WHERE created_by = ?)                         AS groups_created,
       (SELECT COUNT(*) FROM connections WHERE requester_id = ? OR receiver_id = ?)     AS connections,
       (SELECT COUNT(*) FROM audit_logs WHERE user_id = ?)                              AS audit_logs`,
    Array(8).fill(userId)
  );
  return row;
};

const purgeMedia = async (userId) => {
  let deleted = 0;
  for (const kind of MEDIA_KINDS) {
    deleted += await deleteByPrefix(`campus-connect/${kind}/${userId}/`);
  }
  return deleted;
};

const purgeMongo = async (userId) => {
  const [messages, conversations, locations] = await Promise.all([
    Message.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] }),
    Conversation.deleteMany({ "participants.userId": userId }),
    UserLocation.deleteMany({ user_id: userId }),
  ]);
  return {
    messages: messages.deletedCount,
    conversations: conversations.deletedCount,
    locations: locations.deletedCount,
  };
};

const purgeMysql = async (userId, archivedEmail) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Before the users row, while user_push_tokens still has their tokens.
    await conn.execute(
      `DELETE FROM push_receipts
        WHERE expo_push_token IN (
          SELECT expo_push_token FROM user_push_tokens WHERE user_id = ?
        )`,
      [userId]
    );
    await conn.execute(`DELETE FROM audit_logs WHERE user_id = ?`, [userId]);
    if (archivedEmail) {
      await conn.execute(`DELETE FROM otps WHERE email = ?`, [archivedEmail]);
    }

    // The is_active guard re-checks inside the transaction, so an account
    // recovered between selection and here is left alone.
    const [result] = await conn.execute(
      `DELETE FROM users WHERE user_id = ? AND is_active = 0`,
      [userId]
    );
    if (result.affectedRows === 0) {
      await conn.rollback();
      return false;
    }
    await conn.execute(`DELETE FROM user_archive WHERE user_id = ?`, [userId]);

    await conn.commit();
    return true;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

export const purgeExpiredAccounts = async ({ dryRun = true } = {}) => {
  const accounts = await findExpiredAccounts();
  const summary = {
    dryRun,
    candidates: accounts.length,
    purged: 0,
    failed: 0,
    media: 0,
    mediaFailed: 0,
    messages: 0,
    conversations: 0,
    locations: 0,
    accounts: [],
  };

  for (const { user_id: userId, archived_email: email, archived_at: archivedAt } of accounts) {
    if (dryRun) {
      summary.accounts.push({ userId, archivedAt, ...(await countLinkedRows(userId)) });
      continue;
    }

    try {
      try {
        summary.media += await purgeMedia(userId);
      } catch (error) {
        // Best-effort by design: a Cloudinary outage must not keep personal
        // data in the database past the date the policy promises.
        summary.mediaFailed += 1;
        console.error(JSON.stringify({
          level: "error", scope: "account.purge.media", userId, message: error.message,
        }));
      }

      if (mongoose.connection.readyState === 1) {
        const mongo = await purgeMongo(userId);
        summary.messages += mongo.messages;
        summary.conversations += mongo.conversations;
        summary.locations += mongo.locations;
      } else {
        // Without Mongo the chats would be orphaned once the users row is
        // gone, so skip the account and let the next run take it.
        throw new Error("MongoDB is not connected");
      }

      if (await purgeMysql(userId, email)) {
        summary.purged += 1;
        summary.accounts.push({ userId, archivedAt });
      }
    } catch (error) {
      summary.failed += 1;
      console.error(JSON.stringify({
        level: "error", scope: "account.purge", userId, message: error.message,
      }));
    }
  }

  return summary;
};

// One run at a time. A purge that is still going when the next tick fires --
// a slow Cloudinary, a large backlog -- would otherwise race itself over the
// same accounts.
let running = false;

const runScheduled = async () => {
  if (running) return;
  running = true;
  try {
    const { accounts, ...summary } = await purgeExpiredAccounts({ dryRun: false });
    if (summary.candidates) {
      console.log(JSON.stringify({ level: "info", scope: "account.purge", ...summary }));
    }
  } catch (error) {
    console.error(JSON.stringify({ level: "error", scope: "account.purge", message: error.message }));
  } finally {
    running = false;
  }
};

export const startAccountPurge = () => {
  const first = setTimeout(runScheduled, FIRST_RUN_DELAY_MS);
  const timer = setInterval(runScheduled, PURGE_INTERVAL_MS);
  first.unref();
  timer.unref();
  return timer;
};
