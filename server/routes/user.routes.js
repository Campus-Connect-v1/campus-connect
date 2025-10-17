import express from "express";
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
 *   name: Users
 *   description: User profile, interests, and discovery management
 */

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get the authenticated user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched user profile
 *       401:
 *         description: Unauthorized or invalid token
 */
router.get("/profile", getProfile);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update the authenticated user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: Leslie
 *               last_name:
 *                 type: string
 *                 example: Paul
 *               bio:
 *                 type: string
 *                 example: Software engineer at Campus Connect
 *               phone_number:
 *                 type: string
 *                 example: "+233541234567"
 *               program:
 *                 type: string
 *                 example: Computer Science
 *               profile_picture_url:
 *                 type: string
 *                 example: "https://example.com/profile.jpg"
 *               graduation_year:
 *                 type: integer
 *                 example: 2025
 *               profile_headline:
 *                 type: string
 *                 example: "Full Stack Developer"
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 example: "2000-01-15"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 */
router.put("/profile", updateProfileValidation, updateUserProfile);

/**
 * @swagger
 * /users/stats:
 *   get:
 *     summary: Get user statistics (connections, groups, events, etc.)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched user stats
 */
router.get("/stats", getUserStats);

/**
 * @swagger
 * /users/search:
 *   get:
 *     summary: Search for users by name, program, or university
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search term (name, program, etc.)
 *         example: "Computer Science"
 *       - in: query
 *         name: university_id
 *         schema:
 *           type: string
 *         description: Filter by university ID
 *         example: "uni_1"
 *       - in: query
 *         name: program
 *         schema:
 *           type: string
 *         description: Filter by program
 *         example: "Computer Science"
 *       - in: query
 *         name: graduation_year
 *         schema:
 *           type: integer
 *         description: Filter by graduation year
 *         example: 2025
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of results to return (1-100)
 *         example: 20
 *     responses:
 *       200:
 *         description: List of users matching search criteria
 *       400:
 *         description: Invalid query parameters
 */
router.get("/search", searchValidation, searchUsers);

/**
 * @swagger
 * /users/recommendations:
 *   get:
 *     summary: Get recommended connections for the user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of recommendations to return (1-50)
 *         example: 10
 *     responses:
 *       200:
 *         description: Recommended users retrieved successfully
 *       400:
 *         description: Invalid limit parameter
 */
router.get(
  "/recommendations",
  recommendationsValidation,
  getConnectionRecommendations
);

/**
 * @swagger
 * /users/interests:
 *   post:
 *     summary: Add an interest to the user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - interest_type
 *               - interest_name
 *             properties:
 *               interest_type:
 *                 type: string
 *                 enum: [academic, hobby, career, sports, arts]
 *                 example: academic
 *               interest_name:
 *                 type: string
 *                 example: Artificial Intelligence
 *               skill_level:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced, expert]
 *                 example: intermediate
 *     responses:
 *       201:
 *         description: Interest added successfully
 *       400:
 *         description: Invalid input
 */
router.post("/interests", interestValidation, addInterest);

/**
 * @swagger
 * /users/interests/{interestId}:
 *   delete:
 *     summary: Remove an interest from the user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: interestId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the interest to remove
 *         example: "int_550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Interest removed successfully
 *       404:
 *         description: Interest not found
 */
router.delete("/interests/:interestId", interestValidation, removeInterest);

/**
 * @swagger
 * /users/courses:
 *   post:
 *     summary: Add a course to the user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - course_code
 *               - course_name
 *             properties:
 *               course_code:
 *                 type: string
 *                 example: CS101
 *               course_name:
 *                 type: string
 *                 example: Introduction to Computer Science
 *               department_id:
 *                 type: string
 *                 example: "dept_cs"
 *               semester:
 *                 type: string
 *                 example: "Fall 2024"
 *               academic_year:
 *                 type: integer
 *                 example: 2024
 *               is_current:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Course added successfully
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Course already exists
 */
router.post("/courses", courseValidation, addCourse);

/**
 * @swagger
 * /users/courses/{courseId}:
 *   delete:
 *     summary: Remove a course from the user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the course to remove
 *         example: "uc_550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Course removed successfully
 *       404:
 *         description: Course not found
 */
router.delete("/courses/:courseId", courseValidation, removeCourse);

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     summary: Get a public user profile by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the user to fetch
 *         example: "user_550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Public user profile retrieved successfully
 *       404:
 *         description: User not found
 */
router.get(
  "/:userId",
  // userIdParamValidation,
  getUserById
);

/**
 * @swagger
 * /api/user/connections/request:
 *   post:
 *     summary: Send a connection request to another user
 *     description: Send a connection request from the authenticated user to another user
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiver_id
 *             properties:
 *               receiver_id:
 *                 type: integer
 *                 description: ID of the user to send connection request to
 *                 example: 123
 *               message:
 *                 type: string
 *                 description: Optional message to include with the connection request
 *                 example: "Hi, I'd like to connect with you!"
 *     responses:
 *       200:
 *         description: Connection request sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Connection request sent successfully"
 *                 request_id:
 *                   type: integer
 *                   example: 456
 *       400:
 *         description: Bad request - missing or invalid parameters
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Receiver user not found
 *       409:
 *         description: Connection request already exists or users are already connected
 *       500:
 *         description: Internal server error
 */
router.post("/connections/request", sendConnectionRequest);

/**
 * @swagger
 * /api/user/connections:
 *   get:
 *     summary: Get user connections with optional status filter
 *     description: Retrieve connections for the authenticated user, filtered by status (accepted, pending, etc.)
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [accepted, pending, rejected, blocked]
 *           default: accepted
 *         description: Filter connections by status
 *         example: accepted
 *     responses:
 *       200:
 *         description: Connections retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Connections retrieved successfully"
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 connections:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       connection_id:
 *                         type: integer
 *                         example: 123
 *                       status:
 *                         type: string
 *                         example: "accepted"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2023-10-05T14:30:00.000Z"
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 456
 *                           first_name:
 *                             type: string
 *                             example: "John"
 *                           last_name:
 *                             type: string
 *                             example: "Doe"
 *                           profile_picture_url:
 *                             type: string
 *                             example: "https://example.com/profile.jpg"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get("/connections/:status", getConnections);

export default router;
