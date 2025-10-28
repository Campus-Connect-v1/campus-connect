// routes/conversationRoutes.js
import express from "express";
import {
  getConversations,
  getConversation,
  createConversation,
  deleteConversation,
  getConversationByParticipant,
} from "../controllers/conversation.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Conversation:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Conversation ID
 *         participants:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               lastReadAt:
 *                 type: string
 *                 format: date-time
 *         lastMessage:
 *           type: object
 *           properties:
 *             content:
 *               type: string
 *             senderId:
 *               type: string
 *             timestamp:
 *               type: string
 *               format: date-time
 *         unreadCount:
 *           type: object
 *           additionalProperties:
 *             type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ConversationResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           $ref: '#/components/schemas/Conversation'
 *     ConversationsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Conversation'
 *         pagination:
 *           type: object
 *           properties:
 *             current:
 *               type: number
 *             pages:
 *               type: number
 *             total:
 *               type: number
 *             hasNext:
 *               type: boolean
 *             hasPrev:
 *               type: boolean
 */

/**
 * @swagger
 * /api/conversations:
 *   get:
 *     summary: Get all conversations for authenticated user
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of conversations per page
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConversationsResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/", authenticate, getConversations);

/**
 * @swagger
 * /api/conversations/{conversationId}:
 *   get:
 *     summary: Get single conversation by ID
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Conversation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConversationResponse'
 *       404:
 *         description: Conversation not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/:conversationId", authenticate, getConversation);

/**
 * @swagger
 * /api/conversations:
 *   post:
 *     summary: Create a new conversation or get existing one
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participantId
 *             properties:
 *               participantId:
 *                 type: string
 *                 description: The user ID of the other participant
 *     responses:
 *       201:
 *         description: Conversation created or retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConversationResponse'
 *       400:
 *         description: Invalid input or cannot create conversation with yourself
 *       404:
 *         description: Participant user not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/", authenticate, createConversation);

/**
 * @swagger
 * /api/conversations/{conversationId}:
 *   delete:
 *     summary: Delete a conversation
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Conversation deleted successfully
 *       404:
 *         description: Conversation not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete("/:conversationId", authenticate, deleteConversation);

/**
 * @swagger
 * /api/conversations/participant/{participantId}:
 *   get:
 *     summary: Get conversation by participant ID
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: participantId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID of the other participant
 *     responses:
 *       200:
 *         description: Conversation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConversationResponse'
 *       404:
 *         description: Conversation not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/participant/:participantId",
  authenticate,
  getConversationByParticipant
);

export default router;
