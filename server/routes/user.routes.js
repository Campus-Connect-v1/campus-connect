import express from "express";
import { socialGraphLimiter } from "../utils/rateLimiter.js";
import {
  followUser,
  unfollowUser,
  getFollowStats,
  getFollowers,
  getFollowing,
} from "../controllers/follow.controller.js";
import {
  getProfile,
  updateUserProfile,
  getUserStats,
  searchUsers,
  getConnectionRecommendations,
  addInterest,
  removeInterest,
  addCourse,
  removeCourse,
  getUserById,
  sendConnectionRequest,
  getConnections,
  getAllConnections,
  updateInterest,
  deleteProfile,
  cancelConnectionRequest,
  respondToConnection,
  getInterests,
  getCourses,
} from "../controllers/user.controller.js";
import authenticate from "../middleware/auth.js";
import {
  updateProfileValidation,
  interestValidation,
  courseValidation,
  searchValidation,
  recommendationsValidation,
  userIdParamValidation,
  interestIdParamValidation,
  courseIdParamValidation,
} from "../middleware/validations.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   - name: Profile
 *     description: User profile management
 *   - name: Connections
 *     description: User connections and networking
 *   - name: Interests
 *     description: User interests management
 *   - name: Courses
 *     description: User courses management
 *   - name: Discovery
 *     description: User discovery and search
 */

// ==================== PROFILE ENDPOINTS ====================

/**
 * @swagger
 * /user/profile:
 *   get:
 *     tags: [Profile]
 *     summary: Get user profile
 */
router.get("/profile", getProfile);

/**
 * @swagger
 * /user/profile:
 *   put:
 *     tags: [Profile]
 *     summary: Update user profile
 */
router.put("/profile", updateProfileValidation, updateUserProfile);

/**
 * @swagger
 * /user/profile:
 *   delete:
 *     tags: [Profile]
 *     summary: Delete user profile (soft delete)
 */
router.delete("/profile", deleteProfile);

/**
 * @swagger
 * /user/stats:
 *   get:
 *     tags: [Profile]
 *     summary: Get user statistics
 */
router.get("/stats", getUserStats);

// ==================== CONNECTIONS ENDPOINTS ====================

/**
 * @swagger
 * /user/connections:
 *   get:
 *     tags: [Connections]
 *     summary: Get all user connections
 */
router.get("/connections", getAllConnections);

/**
 * @swagger
 * /user/connections/{status}:
 *   get:
 *     tags: [Connections]
 *     summary: Get connections by status
 */
router.get("/connections/:status", getConnections);

/**
 * @swagger
 * /user/connections/request:
 *   post:
 *     tags: [Connections]
 *     summary: Send connection request
 */
router.post("/connections/request", socialGraphLimiter, sendConnectionRequest);

/** Respond to a request received by the signed-in user. */
router.post("/connections/respond", respondToConnection);

/**
 * @swagger
 * /user/connections/request/{connection_id}:
 *   delete:
 *     tags: [Connections]
 *     summary: Cancel connection request
 */
router.delete("/connections/request/:connection_id", cancelConnectionRequest);

// ==================== INTERESTS ENDPOINTS ====================

/**
 * @swagger
 * /user/interests:
 *   post:
 *     tags: [Interests]
 *     summary: Add interest
 */
router.post("/interests", interestValidation, addInterest);

/**
 * @swagger
 * /user/interests:
 *   get:
 *     tags: [Interests]
 *     summary: List the signed-in user's interests
 */
router.get("/interests", getInterests);

/**
 * @swagger
 * /user/interests/{interest_id}:
 *   put:
 *     tags: [Interests]
 *     summary: Update interest
 */
router.put("/interests/:interest_id", updateInterest);

/**
 * @swagger
 * /user/interests/{interestId}:
 *   delete:
 *     tags: [Interests]
 *     summary: Remove interest
 */
router.delete("/interests/:interestId", interestIdParamValidation, removeInterest);

// ==================== COURSES ENDPOINTS ====================

/**
 * @swagger
 * /user/courses:
 *   post:
 *     tags: [Courses]
 *     summary: Add course
 */
router.post("/courses", courseValidation, addCourse);

/**
 * @swagger
 * /user/courses:
 *   get:
 *     tags: [Courses]
 *     summary: List the signed-in user's courses
 */
router.get("/courses", getCourses);

/**
 * @swagger
 * /user/courses/{courseId}:
 *   delete:
 *     tags: [Courses]
 *     summary: Remove course
 */
router.delete("/courses/:courseId", courseIdParamValidation, removeCourse);

// ==================== DISCOVERY ENDPOINTS ====================

/**
 * @swagger
 * /user/search:
 *   get:
 *     tags: [Discovery]
 *     summary: Search user
 */
/**
 * @swagger
 * /user/{user_id}/follow:
 *   post:
 *     tags: [User]
 *     summary: Follow a user
 */
router.post("/:user_id/follow", socialGraphLimiter, followUser);

/**
 * @swagger
 * /user/{user_id}/follow:
 *   delete:
 *     tags: [User]
 *     summary: Unfollow a user
 */
router.delete("/:user_id/follow", socialGraphLimiter, unfollowUser);

/**
 * @swagger
 * /user/{user_id}/follow-stats:
 *   get:
 *     tags: [User]
 *     summary: Follower/following counts and this viewer's relationship
 */
router.get("/:user_id/follow-stats", getFollowStats);

/**
 * @swagger
 * /user/{user_id}/followers:
 *   get:
 *     tags: [User]
 *     summary: Who follows this user
 */
router.get("/:user_id/followers", getFollowers);

/**
 * @swagger
 * /user/{user_id}/following:
 *   get:
 *     tags: [User]
 *     summary: Who this user follows
 */
router.get("/:user_id/following", getFollowing);

router.get("/search", searchValidation, searchUsers);

/**
 * @swagger
 * /user/recommendations:
 *   get:
 *     tags: [Discovery]
 *     summary: Get connection recommendations
 */
router.get(
  "/recommendations",
  recommendationsValidation,
  getConnectionRecommendations
);

/**
 * @swagger
 * /user/{userId}:
 *   get:
 *     tags: [Discovery]
 *     summary: Get user by ID
 */
router.get("/:userId", getUserById);

export default router;
