// controllers/follow.controller.js
import {
  followUserModel,
  unfollowUserModel,
  getFollowStatsModel,
  getFollowersModel,
  getFollowingModel,
} from "../models/follow.model.js";
import { notify } from "../models/notification.model.js";
import { db } from "../config/db.js";
import { logHandled } from "../middleware/observability.js";

const actorName = async (userId) => {
  try {
    const [[row]] = await db.execute(
      `SELECT first_name, last_name FROM users WHERE user_id = ?`,
      [userId]
    );
    return [row?.first_name, row?.last_name].filter(Boolean).join(" ") || "Someone";
  } catch {
    return "Someone";
  }
};

export const followUser = async (req, res) => {
  try {
    const followerId = req.user.id;
    const { user_id } = req.params;

    const result = await followUserModel(followerId, user_id);
    const stats = await getFollowStatsModel(user_id, followerId);

    // Only on a genuinely new edge. Unfollow-and-refollow would otherwise let
    // someone ping a person repeatedly, which is harassment with extra steps.
    if (result.created) {
      notify({
        userId: user_id,
        actorId: followerId,
        type: "new_follower",
        resourceType: "user",
        resourceId: followerId,
        title: `${await actorName(followerId)} started following you`,
      });
    }

    res.status(201).json({ message: "Following", ...stats });
  } catch (error) {
    logHandled(req, "followUser", error);

    if (error.message.includes("yourself")) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }
    if (error.message.includes("private")) {
      return res.status(403).json({
        message: "This account is private. Send a connection request instead.",
      });
    }
    if (error.message.includes("not found")) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(500).json({ message: "Failed to follow user" });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const followerId = req.user.id;
    const { user_id } = req.params;

    await unfollowUserModel(followerId, user_id);
    const stats = await getFollowStatsModel(user_id, followerId);

    res.status(200).json({ message: "Unfollowed", ...stats });
  } catch (error) {
    logHandled(req, "unfollowUser", error);
    res.status(500).json({ message: "Failed to unfollow user" });
  }
};

export const getFollowStats = async (req, res) => {
  try {
    const stats = await getFollowStatsModel(req.params.user_id, req.user.id);
    res.status(200).json(stats);
  } catch (error) {
    logHandled(req, "getFollowStats", error);
    res.status(500).json({ message: "Failed to load follow stats" });
  }
};

const page = (req) => ({
  limit: Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100),
  offset: Math.max(parseInt(req.query.offset) || 0, 0),
});

export const getFollowers = async (req, res) => {
  try {
    const { limit, offset } = page(req);
    const users = await getFollowersModel(req.params.user_id, req.user.id, limit, offset);
    res.status(200).json({ count: users.length, users });
  } catch (error) {
    logHandled(req, "getFollowers", error);
    res.status(500).json({ message: "Failed to load followers" });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const { limit, offset } = page(req);
    const users = await getFollowingModel(req.params.user_id, req.user.id, limit, offset);
    res.status(200).json({ count: users.length, users });
  } catch (error) {
    logHandled(req, "getFollowing", error);
    res.status(500).json({ message: "Failed to load following" });
  }
};
