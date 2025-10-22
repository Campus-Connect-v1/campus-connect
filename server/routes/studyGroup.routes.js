import express from "express";
import { studyGroupController } from "../controllers/studyGroup.controller.js";
import authenticate from "../middleware/auth.js";

const router = express.Router();
router.use(authenticate);
/**
 * @swagger
 * tags:
 *   name: StudyGroups
 *   description: Study group management endpoints
 */

/**
 * @swagger
 *   /study-groups:
 *   get:
 *     summary: Get all study groups with filtering
 *     tags: [StudyGroups]
 *     parameters:
 *       - in: query
 *         name: university_id
 *         schema:
 *           type: string
 *         description: Filter by university ID
 *       - in: query
 *         name: course_code
 *         schema:
 *           type: string
 *         description: Filter by course code
 *       - in: query
 *         name: group_type
 *         schema:
 *           type: string
 *           enum: [public, private, invite_only]
 *         description: Filter by group type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of study groups
 */
router.get("/", studyGroupController.getAllStudyGroups);

/**
 * @swagger
 *   /study-groups/user:
 *   get:
 *     summary: Get user's study groups
 *     tags: [StudyGroups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's study groups
 */
router.get("/user", studyGroupController.getUserStudyGroups);

/**
 * @swagger
 *   /study-groups:
 *   post:
 *     summary: Create a new study group
 *     tags: [StudyGroups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - university_id
 *               - group_name
 *             properties:
 *               university_id:
 *                 type: string
 *               group_name:
 *                 type: string
 *               description:
 *                 type: string
 *               course_code:
 *                 type: string
 *               course_name:
 *                 type: string
 *               group_type:
 *                 type: string
 *                 enum: [public, private, invite_only]
 *                 default: public
 *               max_members:
 *                 type: integer
 *                 default: 20
 *     responses:
 *       201:
 *         description: Study group created successfully
 */
router.post("/", studyGroupController.createStudyGroup);

/**
 * @swagger
 *   /study-groups/{groupId}:
 *   get:
 *     summary: Get study group by ID
 *     tags: [StudyGroups]
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Study group details
 *       404:
 *         description: Study group not found
 */
router.get("/:groupId", studyGroupController.getStudyGroupById);

/**
 * @swagger
 *   /study-groups/{groupId}:
 *   put:
 *     summary: Update study group
 *     tags: [StudyGroups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               group_name:
 *                 type: string
 *               description:
 *                 type: string
 *               max_members:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Study group updated successfully
 *       403:
 *         description: Not authorized to update this group
 */
router.put("/:groupId", studyGroupController.updateStudyGroup);

/**
 * @swagger
 *   /study-groups/{groupId}/join:
 *   post:
 *     summary: Join a study group
 *     tags: [StudyGroups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Joined study group successfully
 *       400:
 *         description: Cannot join group (already member, full, etc.)
 */
router.post("/:groupId/join", studyGroupController.joinStudyGroup);

/**
 * @swagger
 *   /study-groups/{groupId}/leave:
 *   post:
 *     summary: Leave a study group
 *     tags: [StudyGroups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Left study group successfully
 */
router.post("/:groupId/leave", studyGroupController.leaveStudyGroup);

/**
 * @swagger
 *   /study-groups/{groupId}/members:
 *   get:
 *     summary: Get study group members
 *     tags: [StudyGroups]
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of study group members
 */
router.get("/:groupId/members", studyGroupController.getGroupMembers);

export default router;
