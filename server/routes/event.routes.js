import express from "express";
import { eventController } from "../controllers/event.controller.js";
import authenticate from "../middleware/auth.js";

const router = express.Router();
router.use(authenticate);
/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management endpoints
 */

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Get all events with filtering
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: university_id
 *         schema:
 *           type: string
 *         description: Filter by university ID
 *       - in: query
 *         name: event_type
 *         schema:
 *           type: string
 *           enum: [academic, social, sports, career, club, workshop]
 *         description: Filter by event type
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter events starting after this date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter events ending before this date
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
 *         description: List of events
 */
router.get("/", eventController.getAllEvents);

/**
 * @swagger
 * /api/events/user:
 *   get:
 *     summary: Get user's events (created and attending)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's events
 */
router.get("/user", eventController.getUserEvents);

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
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
 *               - event_title
 *               - start_time
 *               - end_time
 *             properties:
 *               university_id:
 *                 type: string
 *               event_title:
 *                 type: string
 *               event_description:
 *                 type: string
 *               event_type:
 *                 type: string
 *                 enum: [academic, social, sports, career, club, workshop]
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *               location_type:
 *                 type: string
 *                 enum: [physical, virtual, hybrid]
 *                 default: physical
 *               physical_location:
 *                 type: string
 *               virtual_link:
 *                 type: string
 *     responses:
 *       201:
 *         description: Event created successfully
 */
router.post("/", eventController.createEvent);

/**
 * @swagger
 * /api/events/{eventId}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event details
 *       404:
 *         description: Event not found
 */
router.get("/:eventId", eventController.getEventById);

/**
 * @swagger
 * /api/events/{eventId}:
 *   put:
 *     summary: Update event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
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
 *               event_title:
 *                 type: string
 *               event_description:
 *                 type: string
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       403:
 *         description: Not authorized to update this event
 */
router.put("/:eventId", eventController.updateEvent);

/**
 * @swagger
 * /api/events/{eventId}:
 *   delete:
 *     summary: Delete event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       403:
 *         description: Not authorized to delete this event
 */
router.delete("/:eventId", eventController.deleteEvent);

/**
 * @swagger
 * /api/events/{eventId}/rsvp:
 *   post:
 *     summary: RSVP to event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rsvp_status
 *             properties:
 *               rsvp_status:
 *                 type: string
 *                 enum: [going, interested, not_going]
 *     responses:
 *       200:
 *         description: RSVP status updated
 */
router.post("/:eventId/rsvp", eventController.rsvpToEvent);

/**
 * @swagger
 * /api/events/{eventId}/attendees:
 *   get:
 *     summary: Get event attendees
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of event attendees
 */
router.get("/:eventId/attendees", eventController.getEventAttendees);

export default router;
