// controllers/moderation.controller.js
import {
  hidePostModel,
  unhidePostModel,
  getHiddenPostsModel,
  reportPostModel,
  listReportsModel,
  updateReportStatusModel,
  getReportStatsModel,
  setFeedPreferenceModel,
  deleteFeedPreferenceModel,
  getFeedPreferencesModel,
  seeLessLikePostModel,
  REPORT_REASONS,
  REPORT_STATUSES,
  SIGNAL_TYPES,
} from "../models/moderation.model.js";

const devError = (error) =>
  process.env.NODE_ENV === "development" ? error.message : undefined;

// ---------------------------------------------------------------------------
// Student-facing: hiding
// ---------------------------------------------------------------------------

// Hide a post for this viewer only. Idempotent, so the client can fire it
// without tracking whether it already did.
export const hidePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { post_id } = req.params;

    const result = await hidePostModel(post_id, userId);

    res.status(200).json({
      message: result.already_hidden
        ? "Post was already hidden"
        : "Post hidden successfully",
      hidden: {
        post_id: result.post_id,
        already_hidden: result.already_hidden,
      },
    });
  } catch (error) {
    console.error("Hide post error:", error);

    if (error.message.includes("Post not found")) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(500).json({
      message: "Failed to hide post",
      error: devError(error),
    });
  }
};

export const unhidePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { post_id } = req.params;

    const result = await unhidePostModel(post_id, userId);

    // Unhiding something that was not hidden leaves the caller in the state
    // they asked for, so it is a 200 rather than a 404.
    res.status(200).json({
      message: result.was_hidden
        ? "Post unhidden successfully"
        : "Post was not hidden",
      post_id: result.post_id,
    });
  } catch (error) {
    console.error("Unhide post error:", error);
    res.status(500).json({
      message: "Failed to unhide post",
      error: devError(error),
    });
  }
};

export const getHiddenPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const result = await getHiddenPostsModel(userId, limit, offset);

    res.status(200).json({
      message: "Hidden posts retrieved successfully",
      count: result.rows.length,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hidden_posts: result.rows.map((row) => ({
        post_id: row.post_id,
        hidden_at: row.hidden_at,
        content: row.content,
        media_url: row.media_url,
        media_type: row.media_type,
        created_at: row.post_created_at,
        is_active: Boolean(row.is_active),
        author: {
          user_id: row.author_id,
          first_name: row.author_first_name,
          last_name: row.author_last_name,
          profile_picture_url: row.author_profile_picture_url,
        },
      })),
    });
  } catch (error) {
    console.error("Get hidden posts error:", error);
    res.status(500).json({
      message: "Failed to retrieve hidden posts",
      error: devError(error),
    });
  }
};

// ---------------------------------------------------------------------------
// Student-facing: reporting
// ---------------------------------------------------------------------------

export const reportPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { post_id } = req.params;
    const { reason, details = null } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "reason is required" });
    }

    if (!REPORT_REASONS.includes(reason)) {
      return res.status(400).json({
        message: `reason must be one of: ${REPORT_REASONS.join(", ")}`,
      });
    }

    // The column is varchar(500); truncating client-side text is friendlier
    // than a 500 from a data-too-long error.
    if (details && String(details).length > 500) {
      return res
        .status(400)
        .json({ message: "details must be 500 characters or fewer" });
    }

    const report = await reportPostModel({
      post_id,
      reporter_id: userId,
      reason,
      details: details ? String(details).trim() : null,
    });

    res.status(201).json({
      message: "Report submitted successfully",
      report: {
        report_id: report.report_id,
        post_id: report.post_id,
        reason: report.reason,
        details: report.details,
        status: report.status,
        created_at: report.created_at,
      },
    });
  } catch (error) {
    console.error("Report post error:", error);

    if (error.message.includes("Post not found")) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(500).json({
      message: "Failed to submit report",
      error: devError(error),
    });
  }
};

// ---------------------------------------------------------------------------
// Student-facing: feed preferences
// ---------------------------------------------------------------------------

export const setPreference = async (req, res) => {
  try {
    const userId = req.user.id;
    const { signal_type, signal_value, weight = -1 } = req.body;

    if (!signal_type || !signal_value) {
      return res
        .status(400)
        .json({ message: "signal_type and signal_value are required" });
    }

    if (!SIGNAL_TYPES.includes(signal_type)) {
      return res.status(400).json({
        message: `signal_type must be one of: ${SIGNAL_TYPES.join(", ")}`,
      });
    }

    if (String(signal_value).length > 100) {
      return res
        .status(400)
        .json({ message: "signal_value must be 100 characters or fewer" });
    }

    const preference = await setFeedPreferenceModel({
      user_id: userId,
      signal_type,
      signal_value: String(signal_value),
      weight,
    });

    res.status(200).json({
      message: "Preference saved successfully",
      preference,
    });
  } catch (error) {
    console.error("Set preference error:", error);
    res.status(500).json({
      message: "Failed to save preference",
      error: devError(error),
    });
  }
};

export const deletePreference = async (req, res) => {
  try {
    const userId = req.user.id;

    // Accepted from either place: DELETE bodies are awkward for some clients,
    // and the query string is the usual fallback.
    const signalType = req.body?.signal_type ?? req.query.signal_type;
    const signalValue = req.body?.signal_value ?? req.query.signal_value;

    if (!signalType || !signalValue) {
      return res
        .status(400)
        .json({ message: "signal_type and signal_value are required" });
    }

    await deleteFeedPreferenceModel(userId, signalType, String(signalValue));

    res.status(200).json({ message: "Preference removed successfully" });
  } catch (error) {
    console.error("Delete preference error:", error);

    if (error.message.includes("Preference not found")) {
      return res.status(404).json({ message: "Preference not found" });
    }

    res.status(500).json({
      message: "Failed to remove preference",
      error: devError(error),
    });
  }
};

export const getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    const preferences = await getFeedPreferencesModel(userId);

    res.status(200).json({
      message: "Preferences retrieved successfully",
      count: preferences.length,
      preferences: preferences.map((p) => ({
        signal_type: p.signal_type,
        signal_value: p.signal_value,
        weight: Number(p.weight),
        created_at: p.created_at,
        updated_at: p.updated_at,
      })),
    });
  } catch (error) {
    console.error("Get preferences error:", error);
    res.status(500).json({
      message: "Failed to retrieve preferences",
      error: devError(error),
    });
  }
};

// "See less of posts like this": the client sends one tap and the server
// works out which signals that implies, so the menu action never has to know
// the shape of feed_preferences.
export const seeLessLikePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { post_id } = req.params;

    const result = await seeLessLikePostModel(post_id, userId);

    res.status(200).json({
      message: "Preferences recorded successfully",
      post_id: result.post_id,
      signals: result.signals.map((s) => ({
        signal_type: s.signal_type,
        signal_value: s.signal_value,
        weight: s.weight,
      })),
    });
  } catch (error) {
    console.error("See less like post error:", error);

    if (error.message.includes("Post not found")) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(500).json({
      message: "Failed to record preferences",
      error: devError(error),
    });
  }
};

// ---------------------------------------------------------------------------
// Operator-facing: the report queue (admin console, not students)
// ---------------------------------------------------------------------------

export const listReports = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    if (status && !REPORT_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `status must be one of: ${REPORT_STATUSES.join(", ")}`,
      });
    }

    const result = await listReportsModel({
      status: status || null,
      limit,
      offset,
    });

    res.json({
      rows: result.rows.map((row) => ({
        report_id: row.report_id,
        reason: row.reason,
        details: row.details,
        status: row.status,
        created_at: row.created_at,
        reviewed_at: row.reviewed_at,
        reviewed_by: row.reviewed_by,
        reviewer_name: row.reviewer_first_name
          ? `${row.reviewer_first_name} ${row.reviewer_last_name}`
          : null,
        post: {
          post_id: row.post_id,
          content: row.post_content,
          media_url: row.post_media_url,
          media_type: row.post_media_type,
          is_active: Boolean(row.post_is_active),
          created_at: row.post_created_at,
          author_id: row.post_author_id,
          author_name: `${row.post_author_first_name} ${row.post_author_last_name}`,
        },
        reporter: {
          user_id: row.reporter_id,
          name: `${row.reporter_first_name} ${row.reporter_last_name}`,
        },
      })),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    });
  } catch (error) {
    console.error("Admin list reports failed:", error);
    res.status(500).json({ message: "Failed to list reports" });
  }
};

export const updateReportStatus = async (req, res) => {
  try {
    const { report_id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "status is required" });
    }

    if (!REPORT_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `status must be one of: ${REPORT_STATUSES.join(", ")}`,
      });
    }

    const report = await updateReportStatusModel(
      report_id,
      status,
      req.operator.operator_id
    );

    res.json({ row: report });
  } catch (error) {
    console.error("Admin update report failed:", error);

    if (error.message.includes("Report not found")) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.status(500).json({ message: "Failed to update report" });
  }
};

export const getReportStats = async (req, res) => {
  try {
    const stats = await getReportStatsModel();
    res.json(stats);
  } catch (error) {
    console.error("Admin report stats failed:", error);
    res.status(500).json({ message: "Failed to load report stats" });
  }
};
