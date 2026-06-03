import {
  createStatusModel,
  getLatestStatusesModel,
  getUserStatusesModel,
} from "../models/status.model.js";

const mapStatus = (status) => ({
  status_id: status.status_id,
  user_id: status.user_id,
  content: status.content,
  media_url: status.media_url,
  media_type: status.media_type,
  created_at: status.created_at,
  expires_at: status.expires_at,
  author: {
    user_id: status.user_id,
    first_name: status.first_name,
    last_name: status.last_name,
    profile_picture_url: status.profile_picture_url,
  },
});

export const createStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      content,
      media_url,
      media_type = "text",
    } = req.body;

    const trimmedContent = content?.trim() || null;
    if (!trimmedContent && !media_url) {
      return res.status(400).json({
        message: "Either content or media_url is required",
      });
    }

    const status = await createStatusModel({
      user_id: userId,
      content: trimmedContent,
      media_url: media_url || null,
      media_type: media_type || "text",
    });

    res.status(201).json({
      message: "Status created successfully",
      status,
    });
  } catch (error) {
    console.error("Create status error:", error);
    res.status(500).json({
      message: "Failed to create status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const getLatestStatuses = async (req, res) => {
  try {
    const { limit = 30 } = req.query;
    const statuses = await getLatestStatusesModel(limit);
    res.status(200).json({
      message: "Statuses retrieved successfully",
      count: statuses.length,
      statuses: statuses.map(mapStatus),
    });
  } catch (error) {
    console.error("Get statuses error:", error);
    res.status(500).json({
      message: "Failed to retrieve statuses",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const getUserStatuses = async (req, res) => {
  try {
    const { user_id } = req.params;
    const statuses = await getUserStatusesModel(user_id);
    res.status(200).json({
      message: "User statuses retrieved successfully",
      count: statuses.length,
      statuses: statuses.map(mapStatus),
    });
  } catch (error) {
    console.error("Get user statuses error:", error);
    res.status(500).json({
      message: "Failed to retrieve user statuses",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
