// routes/locationRoutes.js
import express from "express";
import {
  updateLocation,
  getNearbyProfiles,
  getPrivacySettings,
  updatePrivacySettings,
  toggleLocationSharing,
  getLocationHistory,
} from "../controllers/location.controller.js";
import authenticate from "../middleware/auth.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   - name: Geofencing
 *     description: Location-based user discovery and privacy management
 */

/**
 * @swagger
 * /api/geofencing/location:
 *   post:
 *     tags: [Geofencing]
 *     summary: Update user location
 *     description: Update current user location with rate limiting (30 second cooldown)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: 37.4275
 *               longitude:
 *                 type: number
 *                 example: -122.1697
 *               accuracy:
 *                 type: number
 *                 example: 50
 *     responses:
 *       200:
 *         description: Location updated successfully
 *       400:
 *         description: Missing required fields
 *       429:
 *         description: Location update too frequent
 *       500:
 *         description: Internal server error
 */
router.post("/location", updateLocation);

/**
 * @swagger
 * /api/geofencing/nearby:
 *   get:
 *     tags: [Geofencing]
 *     summary: Get nearby profiles
 *     description: Discover users nearby based on privacy settings and geofencing radius
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: radius
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Search radius in meters (10-5000)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of profiles to return
 *     responses:
 *       200:
 *         description: Nearby profiles retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get("/nearby", getNearbyProfiles);

/**
 * @swagger
 * /api/geofencing/privacy:
 *   get:
 *     tags: [Geofencing]
 *     summary: Get privacy settings
 *     description: Retrieve user's geofencing and privacy preferences
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Privacy settings retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get("/privacy", getPrivacySettings);

/**
 * @swagger
 * /api/geofencing/privacy:
 *   put:
 *     tags: [Geofencing]
 *     summary: Update privacy settings
 *     description: Update geofencing and privacy preferences
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profile_visibility:
 *                 type: string
 *                 enum: [public, geofenced, private, friends_only]
 *                 example: geofenced
 *               custom_radius:
 *                 type: integer
 *                 minimum: 10
 *                 maximum: 5000
 *                 example: 200
 *               show_exact_location:
 *                 type: boolean
 *                 example: false
 *               visible_fields:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: boolean
 *                     example: true
 *                   photo:
 *                     type: boolean
 *                     example: true
 *                   bio:
 *                     type: boolean
 *                     example: true
 *                   program:
 *                     type: boolean
 *                     example: true
 *                   courses:
 *                     type: boolean
 *                     example: false
 *                   contact:
 *                     type: boolean
 *                     example: false
 *     responses:
 *       200:
 *         description: Privacy settings updated successfully
 *       400:
 *         description: Invalid settings provided
 *       500:
 *         description: Internal server error
 */
router.put("/privacy", updatePrivacySettings);

/**
 * @swagger
 * /api/geofencing/location/toggle:
 *   post:
 *     tags: [Geofencing]
 *     summary: Toggle location sharing
 *     description: Enable or disable location sharing entirely
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enabled
 *             properties:
 *               enabled:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Location sharing updated successfully
 *       500:
 *         description: Internal server error
 */
router.post("/location/toggle", toggleLocationSharing);

/**
 * @swagger
 * /api/geofencing/location/history:
 *   get:
 *     tags: [Geofencing]
 *     summary: Get location history
 *     description: Retrieve user's recent location history (last 24 hours)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: hours
 *         schema:
 *           type: integer
 *           default: 24
 *           maximum: 168
 *         description: Hours of history to retrieve (max 1 week)
 *     responses:
 *       200:
 *         description: Location history retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get("/location/history", getLocationHistory);

export default router;
