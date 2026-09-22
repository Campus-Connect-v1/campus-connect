// models/follow.model.js
import { v4 as uuidv4 } from "uuid";
import { db } from "../config/db.js";

/**
 * The follow graph.
 *
 * Asymmetric and unapproved, unlike `connections`: following someone is a
 * statement about what you want to read, not a relationship they have to agree
 * to. The two graphs do different jobs and both are load-bearing — connections
 * still gate 'connections'-visibility posts and messaging, follows decide
 * whose public posts reach your timeline.
 */

/**
 * Follow someone.
 *
 * Idempotent: the button is a toggle and a retry after a dropped response must
 * not be an error, so a duplicate returns the existing edge rather than
 * raising. Returns whether the row was actually new, so the caller can decide
 * not to send a second "started following you" notification.
 */
export const followUserModel = async (followerId, followingId) => {
  if (String(followerId) === String(followingId)) {
    throw new Error("Cannot follow yourself");
  }

  try {
    const [[target]] = await db.execute(
      `SELECT user_id, privacy_profile FROM users WHERE user_id = ? AND is_active = 1`,
      [followingId]
    );
    if (!target) throw new Error("User not found");

    // A private account is an explicit opt-out of being read by strangers.
    // There is already a mechanism for reaching one — send a connection
    // request — so this refuses rather than inventing a second approval queue.
    if (target.privacy_profile === "private") {
      throw new Error("This account is private");
    }

    const followId = `follow_${uuidv4()}`;
    const [result] = await db.execute(
      `INSERT IGNORE INTO follows (follow_id, follower_id, following_id) VALUES (?, ?, ?)`,
      [followId, followerId, followingId]
    );

    return { follow_id: followId, created: result.affectedRows > 0 };
  } catch (error) {
    if (
      error.message.includes("not found") ||
      error.message.includes("private") ||
      error.message.includes("yourself")
    ) {
      throw error;
    }
    throw new Error(`Database error in followUser: ${error.message}`);
  }
};

/** Unfollow. Also idempotent — removing an edge that is already gone is fine. */
export const unfollowUserModel = async (followerId, followingId) => {
  try {
    await db.execute(
      `DELETE FROM follows WHERE follower_id = ? AND following_id = ?`,
      [followerId, followingId]
    );
    return { success: true };
  } catch (error) {
    throw new Error(`Database error in unfollowUser: ${error.message}`);
  }
};

/**
 * Follower and following totals for a profile, plus this viewer's relationship
 * to it, in one round trip.
 *
 * `follows_you` matters more than it looks: it is what lets the UI say "Follows
 * you" on a profile, which is the single strongest prompt to follow back.
 */
export const getFollowStatsModel = async (userId, viewerId = null) => {
  try {
    const [[row]] = await db.execute(
      `SELECT
         (SELECT COUNT(*) FROM follows WHERE following_id = ?) AS follower_count,
         (SELECT COUNT(*) FROM follows WHERE follower_id  = ?) AS following_count,
         (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = ?) AS viewer_follows,
         (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = ?) AS follows_viewer`,
      [userId, userId, viewerId ?? "", userId, userId, viewerId ?? ""]
    );

    return {
      follower_count: Number(row?.follower_count ?? 0),
      following_count: Number(row?.following_count ?? 0),
      is_following: Number(row?.viewer_follows ?? 0) > 0,
      follows_you: Number(row?.follows_viewer ?? 0) > 0,
    };
  } catch (error) {
    throw new Error(`Database error in getFollowStats: ${error.message}`);
  }
};

const listQuery = (direction) => `
  SELECT
    u.user_id, u.first_name, u.last_name, u.profile_picture_url,
    u.profile_headline, u.program, u.university_id,
    f.created_at AS followed_at,
    (SELECT COUNT(*) FROM follows me
      WHERE me.follower_id = ? AND me.following_id = u.user_id) AS viewer_follows
  FROM follows f
  JOIN users u ON u.user_id = f.${direction === "followers" ? "follower_id" : "following_id"}
   AND u.is_active = 1
  WHERE f.${direction === "followers" ? "following_id" : "follower_id"} = ?
  ORDER BY f.created_at DESC
  LIMIT ? OFFSET ?
`;

const shape = (rows) =>
  rows.map((row) => ({
    user_id: row.user_id,
    first_name: row.first_name,
    last_name: row.last_name,
    profile_picture_url: row.profile_picture_url,
    profile_headline: row.profile_headline,
    program: row.program,
    university_id: row.university_id,
    followed_at: row.followed_at,
    // Lets a follower list double as a follow-back list without a second call.
    is_following: Number(row.viewer_follows) > 0,
  }));

export const getFollowersModel = async (userId, viewerId, limit = 50, offset = 0) => {
  try {
    const [rows] = await db.execute(listQuery("followers"), [
      viewerId ?? "",
      userId,
      limit,
      offset,
    ]);
    return shape(rows);
  } catch (error) {
    throw new Error(`Database error in getFollowers: ${error.message}`);
  }
};

export const getFollowingModel = async (userId, viewerId, limit = 50, offset = 0) => {
  try {
    const [rows] = await db.execute(listQuery("following"), [
      viewerId ?? "",
      userId,
      limit,
      offset,
    ]);
    return shape(rows);
  } catch (error) {
    throw new Error(`Database error in getFollowing: ${error.message}`);
  }
};

/**
 * How many people this viewer follows.
 *
 * The feed asks this before choosing a strategy: an account following nobody
 * would get an empty timeline from a graph query, which is the worst possible
 * first impression, so it falls back to campus-wide discovery instead.
 */
export const getFollowingCountModel = async (userId) => {
  try {
    const [[row]] = await db.execute(
      `SELECT COUNT(*) AS n FROM follows WHERE follower_id = ?`,
      [userId]
    );
    return Number(row?.n ?? 0);
  } catch (error) {
    console.error("getFollowingCount failed:", error.message);
    return 0;
  }
};
