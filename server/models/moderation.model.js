// models/moderation.model.js
import { db } from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

// Mirrors of the enums in db/migrations/003_social_features.sql. Kept here so
// the controller can reject a bad value with a 400 instead of letting MySQL
// raise ER_TRUNCATED_WRONG_VALUE_FOR_FIELD, which surfaces as a 500.
export const REPORT_REASONS = [
  "spam",
  "harassment",
  "hate_speech",
  "misinformation",
  "inappropriate",
  "other",
];

export const REPORT_STATUSES = ["pending", "reviewed", "actioned", "dismissed"];

export const SIGNAL_TYPES = ["media_type", "author", "university", "course"];

// Weight bounds. The column is a plain int, so the clamp lives here rather
// than in the schema.
export const MIN_WEIGHT = -3;
export const MAX_WEIGHT = 3;

// ---------------------------------------------------------------------------
// SQL fragment builders for the feed query
//
// Pure string builders: they take no arguments and embed no user input, so
// they are safe to interpolate into a larger query. The caller binds the
// parameters described on each one.
// ---------------------------------------------------------------------------

// Excludes posts this person has hidden.
//
// The caller must bind exactly ONE parameter for this fragment: the viewer's
// user_id. Expects the outer query to alias the posts table as `p`.
// Drop it into a WHERE clause with AND.
export const hiddenPostFilterSql = () => `
  NOT EXISTS (
    SELECT 1 FROM hidden_posts hp
    WHERE hp.post_id = p.post_id AND hp.user_id = ?
  )`;

// A numeric score adjustment from this person's "see less / see more" signals:
// the sum of every matching signal's weight, or 0 when none match. Negative
// values push a post down, positive pull it up.
//
// The caller must bind exactly ONE parameter for this fragment: the viewer's
// user_id. Expects the outer query to alias posts as `p` and the post author's
// row in users as `u` (joined on p.user_id), because the university and course
// signals are properties of the author, not of the post.
//
// A correlated subquery rather than a JOIN so it cannot multiply feed rows,
// and so it stays usable in both SELECT and ORDER BY.
export const feedPreferenceScoreSql = () => `
  COALESCE((
    SELECT SUM(fp.weight) FROM feed_preferences fp
    WHERE fp.user_id = ?
      AND (
        (fp.signal_type = 'media_type' AND fp.signal_value = p.media_type)
        OR (fp.signal_type = 'author'     AND fp.signal_value = p.user_id)
        OR (fp.signal_type = 'university' AND fp.signal_value = u.university_id)
        OR (fp.signal_type = 'course'     AND fp.signal_value = u.program)
      )
  ), 0)`;

// ---------------------------------------------------------------------------
// Hiding posts
// ---------------------------------------------------------------------------

// Checked before inserting into hidden_posts / post_reports so a bad post_id
// returns 404 rather than an FK error, and so INSERT IGNORE cannot silently
// swallow a missing reference as a warning.
const postExists = async (postId) => {
  const [rows] = await db.execute(
    `SELECT post_id FROM posts WHERE post_id = ? AND is_active = 1`,
    [postId]
  );
  return rows.length > 0;
};

export const hidePostModel = async (postId, userId) => {
  try {
    if (!(await postExists(postId))) {
      throw new Error("Post not found");
    }

    // IGNORE keeps the endpoint idempotent: hiding an already-hidden post is a
    // no-op, not a duplicate-key error. The post is verified above, so the
    // only key IGNORE can mask here is the intended (user_id, post_id) one.
    const [result] = await db.execute(
      `INSERT IGNORE INTO hidden_posts (user_id, post_id) VALUES (?, ?)`,
      [userId, postId]
    );

    return {
      post_id: postId,
      user_id: userId,
      already_hidden: result.affectedRows === 0,
    };
  } catch (error) {
    if (error.message === "Post not found") throw error;
    throw new Error(`Database error in hidePost: ${error.message}`);
  }
};

export const unhidePostModel = async (postId, userId) => {
  try {
    const [result] = await db.execute(
      `DELETE FROM hidden_posts WHERE user_id = ? AND post_id = ?`,
      [userId, postId]
    );

    return { post_id: postId, was_hidden: result.affectedRows > 0 };
  } catch (error) {
    throw new Error(`Database error in unhidePost: ${error.message}`);
  }
};

// Enough of each post to render an "undo" list without a second round trip.
export const getHiddenPostsModel = async (userId, limit = 20, offset = 0) => {
  const safeLimit = Math.min(parseInt(limit, 10) || 20, 100);
  const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);

  try {
    const [rows] = await db.execute(
      `SELECT
         hp.post_id,
         hp.created_at AS hidden_at,
         p.content,
         p.media_url,
         p.media_type,
         p.created_at AS post_created_at,
         p.is_active,
         u.user_id AS author_id,
         u.first_name AS author_first_name,
         u.last_name AS author_last_name,
         u.profile_picture_url AS author_profile_picture_url
       FROM hidden_posts hp
       JOIN posts p ON hp.post_id = p.post_id
       JOIN users u ON p.user_id = u.user_id
       WHERE hp.user_id = ?
       ORDER BY hp.created_at DESC
       LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      [userId]
    );

    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM hidden_posts WHERE user_id = ?`,
      [userId]
    );

    return { rows, total: Number(total), limit: safeLimit, offset: safeOffset };
  } catch (error) {
    throw new Error(`Database error in getHiddenPosts: ${error.message}`);
  }
};

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

export const reportPostModel = async ({
  post_id,
  reporter_id,
  reason,
  details = null,
}) => {
  try {
    if (!(await postExists(post_id))) {
      throw new Error("Post not found");
    }

    const reportId = `report_${uuidv4()}`;

    // The unique (post_id, reporter_id) key means a second report from the
    // same person edits their first rather than erroring. `status`,
    // `reviewed_by` and `reviewed_at` are deliberately left alone: an operator
    // decision is an audit record, and a reporter rewording their reason must
    // not erase who reviewed it.
    await db.execute(
      `INSERT INTO post_reports (report_id, post_id, reporter_id, reason, details)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE reason = ?, details = ?`,
      [reportId, post_id, reporter_id, reason, details, reason, details]
    );

    // Re-read rather than trusting reportId: on the update path the row keeps
    // the id it was first created with.
    const [rows] = await db.execute(
      `SELECT report_id, post_id, reporter_id, reason, details, status, created_at
       FROM post_reports WHERE post_id = ? AND reporter_id = ?`,
      [post_id, reporter_id]
    );

    return rows[0];
  } catch (error) {
    if (error.message === "Post not found") throw error;
    throw new Error(`Database error in reportPost: ${error.message}`);
  }
};

// Operator-facing queue. Joins the post and both people so a reviewer can
// judge a report from the list alone.
export const listReportsModel = async ({
  status = null,
  limit = 50,
  offset = 0,
} = {}) => {
  const safeLimit = Math.min(parseInt(limit, 10) || 50, 200);
  const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);

  try {
    const where = [];
    const params = [];

    if (status) {
      where.push("r.status = ?");
      params.push(status);
    }

    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await db.execute(
      `SELECT
         r.report_id,
         r.post_id,
         r.reason,
         r.details,
         r.status,
         r.reviewed_by,
         r.reviewed_at,
         r.created_at,
         p.content        AS post_content,
         p.media_url      AS post_media_url,
         p.media_type     AS post_media_type,
         p.is_active      AS post_is_active,
         p.created_at     AS post_created_at,
         pa.user_id       AS post_author_id,
         pa.first_name    AS post_author_first_name,
         pa.last_name     AS post_author_last_name,
         rp.user_id       AS reporter_id,
         rp.first_name    AS reporter_first_name,
         rp.last_name     AS reporter_last_name,
         o.first_name     AS reviewer_first_name,
         o.last_name      AS reviewer_last_name
       FROM post_reports r
       JOIN posts p  ON r.post_id = p.post_id
       JOIN users pa ON p.user_id = pa.user_id
       JOIN users rp ON r.reporter_id = rp.user_id
       -- LEFT, and no FK on reviewed_by: the operator may have been deleted
       -- since, but the moderation record has to survive them.
       LEFT JOIN operators o ON r.reviewed_by = o.operator_id
       ${clause}
       ORDER BY r.created_at DESC
       LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      params
    );

    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM post_reports r ${clause}`,
      params
    );

    return { rows, total: Number(total), limit: safeLimit, offset: safeOffset };
  } catch (error) {
    throw new Error(`Database error in listReports: ${error.message}`);
  }
};

export const updateReportStatusModel = async (reportId, status, operatorId) => {
  try {
    const [result] = await db.execute(
      `UPDATE post_reports
       SET status = ?, reviewed_by = ?, reviewed_at = NOW()
       WHERE report_id = ?`,
      [status, operatorId, reportId]
    );

    if (result.affectedRows === 0) {
      throw new Error("Report not found");
    }

    const [rows] = await db.execute(
      `SELECT report_id, post_id, reporter_id, reason, details, status,
              reviewed_by, reviewed_at, created_at
       FROM post_reports WHERE report_id = ?`,
      [reportId]
    );

    return rows[0];
  } catch (error) {
    if (error.message === "Report not found") throw error;
    throw new Error(`Database error in updateReportStatus: ${error.message}`);
  }
};

// Two groupings in one call because the dashboard tile shows both and neither
// is useful without the other.
export const getReportStatsModel = async () => {
  try {
    const [byStatus] = await db.execute(
      `SELECT status, COUNT(*) AS count FROM post_reports GROUP BY status`
    );

    const [byReason] = await db.execute(
      `SELECT reason, COUNT(*) AS count FROM post_reports GROUP BY reason`
    );

    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM post_reports`
    );

    return {
      total: Number(total),
      by_status: byStatus.map((r) => ({
        status: r.status,
        count: Number(r.count),
      })),
      by_reason: byReason.map((r) => ({
        reason: r.reason,
        count: Number(r.count),
      })),
    };
  } catch (error) {
    throw new Error(`Database error in getReportStats: ${error.message}`);
  }
};

// ---------------------------------------------------------------------------
// Feed preferences
// ---------------------------------------------------------------------------

// Clamped before it reaches SQL: the column is a signed int, so without this a
// client could send -2000000 and effectively blacklist a signal forever.
const clampWeight = (weight) => {
  const n = parseInt(weight, 10);
  if (!Number.isInteger(n)) return -1;
  return Math.min(Math.max(n, MIN_WEIGHT), MAX_WEIGHT);
};

export const setFeedPreferenceModel = async ({
  user_id,
  signal_type,
  signal_value,
  weight = -1,
}) => {
  try {
    const safeWeight = clampWeight(weight);

    // Upsert on the composite primary key so tapping "see less" twice adjusts
    // the existing signal instead of failing.
    await db.execute(
      `INSERT INTO feed_preferences (user_id, signal_type, signal_value, weight)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE weight = ?`,
      [user_id, signal_type, signal_value, safeWeight, safeWeight]
    );

    return {
      user_id,
      signal_type,
      signal_value,
      weight: safeWeight,
    };
  } catch (error) {
    throw new Error(`Database error in setFeedPreference: ${error.message}`);
  }
};

export const deleteFeedPreferenceModel = async (
  userId,
  signalType,
  signalValue
) => {
  try {
    const [result] = await db.execute(
      `DELETE FROM feed_preferences
       WHERE user_id = ? AND signal_type = ? AND signal_value = ?`,
      [userId, signalType, signalValue]
    );

    if (result.affectedRows === 0) {
      throw new Error("Preference not found");
    }

    return { success: true };
  } catch (error) {
    if (error.message === "Preference not found") throw error;
    throw new Error(`Database error in deleteFeedPreference: ${error.message}`);
  }
};

export const getFeedPreferencesModel = async (userId) => {
  try {
    const [rows] = await db.execute(
      `SELECT signal_type, signal_value, weight, created_at, updated_at
       FROM feed_preferences
       WHERE user_id = ?
       ORDER BY signal_type, updated_at DESC`,
      [userId]
    );

    return rows;
  } catch (error) {
    throw new Error(`Database error in getFeedPreferences: ${error.message}`);
  }
};

// The "see less of posts like this" menu action. One tap becomes structured
// signals -- the post's media_type and its author -- rather than a magic flag,
// which is why feed_preferences has a signal_type at all.
export const seeLessLikePostModel = async (postId, userId) => {
  try {
    const [posts] = await db.execute(
      `SELECT p.post_id, p.media_type, p.user_id AS author_id
       FROM posts p
       WHERE p.post_id = ? AND p.is_active = 1`,
      [postId]
    );

    if (posts.length === 0) {
      throw new Error("Post not found");
    }

    const post = posts[0];

    const derived = [
      { signal_type: "media_type", signal_value: post.media_type },
      { signal_type: "author", signal_value: post.author_id },
    ];

    const recorded = [];
    for (const signal of derived) {
      // Sequential rather than Promise.all: both rows hit the same composite
      // key space, and a handful of upserts is not worth the contention.
      recorded.push(
        await setFeedPreferenceModel({
          user_id: userId,
          signal_type: signal.signal_type,
          signal_value: signal.signal_value,
          weight: -1,
        })
      );
    }

    return { post_id: postId, signals: recorded };
  } catch (error) {
    if (error.message === "Post not found") throw error;
    throw new Error(`Database error in seeLessLikePost: ${error.message}`);
  }
};
