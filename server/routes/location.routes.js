// routes/locationRoutes.js

import express from "express";
import {
  updateLocation,
  getNearbyProfiles,
  getPrivacySettings,
  updatePrivacySettings,
  toggleLocationSharing,
  getLocationHistory,
  toggleIncognitoMode,
} from "../controllers/location.controller.js";
import authenticate from "../middleware/auth.js";
import { UserLocation } from "../models/location.js";
import { LocationService } from "../utils/locationService.js";

const locationService = new LocationService();
const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   - name: Geofencing
 *     description: Location-based user discovery and privacy management
 *   - name: Debug
 *     description: Debugging endpoints for development
 */

/**
 * @swagger
 * /geofencing/location:
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
 *                 format: float
 *                 example: 37.4275
 *                 description: Latitude coordinate
 *               longitude:
 *                 type: number
 *                 format: float
 *                 example: -122.1697
 *                 description: Longitude coordinate
 *               accuracy:
 *                 type: number
 *                 format: integer
 *                 example: 50
 *                 description: Location accuracy in meters
 *     responses:
 *       200:
 *         description: Location updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Location updated successfully"
 *                 location:
 *                   type: object
 *                   properties:
 *                     coordinates:
 *                       type: array
 *                       items:
 *                         type: number
 *                       example: [-122.1697, 37.4275]
 *                     accuracy:
 *                       type: number
 *                       example: 50
 *                     last_updated:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Missing required fields or invalid data
 *       429:
 *         description: Location update too frequent
 *       500:
 *         description: Internal server error
 */
router.post("/location", updateLocation);

/**
 * @swagger
 * /geofencing/nearby:
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
 *           default: 500
 *           minimum: 10
 *           maximum: 5000
 *         description: Search radius in meters
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of profiles to return
 *     responses:
 *       200:
 *         description: Nearby profiles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Nearby profiles retrieved successfully"
 *                 count:
 *                   type: integer
 *                   example: 16
 *                 radius:
 *                   type: integer
 *                   example: 500
 *                 profiles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: string
 *                         example: "user_2"
 *                       university_id:
 *                         type: string
 *                         example: "uni_12345"
 *                       first_name:
 *                         type: string
 *                         example: "Maria"
 *                       last_name:
 *                         type: string
 *                         example: "Johnson"
 *                       profile_picture_url:
 *                         type: string
 *                         example: "https://example.com/photo.jpg"
 *                       bio:
 *                         type: string
 *                         example: "Computer Science student"
 *                       program:
 *                         type: string
 *                         example: "BSc Computer Science"
 *                       distance:
 *                         type: number
 *                         example: 34.59
 *                       accuracy:
 *                         type: number
 *                         example: 50
 *                       last_seen:
 *                         type: string
 *                         format: date-time
 *                       online:
 *                         type: boolean
 *                         example: true
 *                       location_context:
 *                         type: string
 *                         example: "Main Library"
 *       201:
 *         description: No nearby profiles found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: string
 *                 message:
 *                   type: string
 *                   example: "No nearby profiles found"
 *                 radius:
 *                   type: integer
 *                   example: 500
 *                 suggestion:
 *                   type: string
 *                   example: "Try increasing the search radius"
 *                 profiles:
 *                   type: array
 *                   items: {}
 *       500:
 *         description: Internal server error
 */
router.get("/nearby", getNearbyProfiles);

/**
 * @swagger
 * /geofencing/privacy:
 *   get:
 *     tags: [Geofencing]
 *     summary: Get privacy settings
 *     description: Retrieve user's geofencing and privacy preferences
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Privacy settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Privacy settings retrieved successfully"
 *                 settings:
 *                   type: object
 *                   properties:
 *                     profile_visibility:
 *                       type: string
 *                       enum: [public, geofenced, private, friends_only]
 *                       example: "geofenced"
 *                     visibility_radius:
 *                       type: integer
 *                       example: 100
 *                     custom_radius:
 *                       type: integer
 *                       example: 100
 *                     show_exact_location:
 *                       type: boolean
 *                       example: false
 *                     visible_fields:
 *                       type: string
 *                       example: '{"name":true,"photo":true,"bio":true,"program":true,"courses":false,"contact":false}'
 *       500:
 *         description: Internal server error
 */
router.get("/privacy", getPrivacySettings);

/**
 * @swagger
 * /geofencing/privacy:
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
 *                 description: Profile visibility mode
 *               visibility_radius:
 *                 type: integer
 *                 minimum: 10
 *                 maximum: 5000
 *                 example: 200
 *                 description: Visibility radius in meters
 *               custom_radius:
 *                 type: integer
 *                 minimum: 10
 *                 maximum: 5000
 *                 example: 200
 *                 description: Custom radius in meters (alias for visibility_radius)
 *               show_exact_location:
 *                 type: boolean
 *                 example: false
 *                 description: Whether to show exact building location
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Privacy settings updated successfully"
 *                 settings:
 *                   type: object
 *       400:
 *         description: Invalid settings provided
 *       500:
 *         description: Internal server error
 */
router.put("/privacy", updatePrivacySettings);

/**
 * @swagger
 * /geofencing/location/toggle:
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
 *                 description: Whether to enable location sharing
 *     responses:
 *       200:
 *         description: Location sharing updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Location sharing enabled successfully"
 *                 location_sharing_enabled:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Enabled field must be a boolean
 *       500:
 *         description: Internal server error
 */
router.post("/location/toggle", toggleLocationSharing);

/**
 * @swagger
 * /geofencing/location/history:
 *   get:
 *     tags: [Geofencing]
 *     summary: Get location history
 *     description: Retrieve user's recent location history
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Location history retrieved successfully"
 *                 hours:
 *                   type: integer
 *                   example: 24
 *                 locations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       longitude:
 *                         type: number
 *                         example: -122.1697
 *                       latitude:
 *                         type: number
 *                         example: 37.4275
 *                       accuracy:
 *                         type: number
 *                         example: 50
 *                       last_updated:
 *                         type: string
 *                         format: date-time
 *                       active:
 *                         type: boolean
 *                         example: true
 *       500:
 *         description: Internal server error
 */
router.get("/location/history", getLocationHistory);

/**
 * @swagger
 * /geofencing/incognito:
 *   post:
 *     tags: [Geofencing]
 *     summary: Toggle incognito mode
 *     description: Enable or disable incognito mode (one-touch privacy)
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
 *                 description: Whether to enable incognito mode
 *     responses:
 *       200:
 *         description: Incognito mode updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Incognito mode enabled successfully"
 *                 incognito_mode:
 *                   type: boolean
 *                   example: true
 *                 location_sharing_enabled:
 *                   type: boolean
 *                   example: false
 *       400:
 *         description: Enabled field must be a boolean
 *       500:
 *         description: Internal server error
 */
router.post("/incognito", toggleIncognitoMode);

/**
 * @swagger
 * /geofencing/debug/locations:
 *   get:
 *     tags: [Debug]
 *     summary: Debug location data
 *     description: Debug endpoint to check user location data in cache and database (Development only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Location debug information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: string
 *                   example: "user_1"
 *                 cached_location:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     latitude:
 *                       type: number
 *                     longitude:
 *                       type: number
 *                     last_updated:
 *                       type: string
 *                       format: date-time
 *                     accuracy:
 *                       type: number
 *                 db_location:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     user_id:
 *                       type: string
 *                     location:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                           example: "Point"
 *                         coordinates:
 *                           type: array
 *                           items:
 *                             type: number
 *                     last_updated:
 *                       type: string
 *                       format: date-time
 *                     is_active:
 *                       type: boolean
 *                 total_locations_in_db:
 *                   type: integer
 *                   example: 35
 *                 sample_locations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: string
 *                       coordinates:
 *                         type: array
 *                         items:
 *                           type: number
 *                       last_updated:
 *                         type: string
 *                         format: date-time
 *                       is_active:
 *                         type: boolean
 *       500:
 *         description: Internal server error
 */
router.get("/debug/locations", async (req, res) => {
  try {
    const userId = req.user.id;

    // Check cached location
    const cachedLocation = await locationService.getCachedUserLocation(userId);

    // Check database location
    const dbLocation = await UserLocation.findOne({ user_id: userId });

    // Count total locations in DB
    const totalLocations = await UserLocation.countDocuments();

    // Get a sample of locations
    const sampleLocations = await UserLocation.find().limit(5);

    res.json({
      user_id: userId,
      cached_location: cachedLocation,
      db_location: dbLocation,
      total_locations_in_db: totalLocations,
      sample_locations: sampleLocations.map((loc) => ({
        user_id: loc.user_id,
        coordinates: loc.location.coordinates,
        last_updated: loc.last_updated,
        is_active: loc.is_active,
      })),
    });
  } catch (error) {
    console.error("Debug locations error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /geofencing/debug/set-test-location:
 *   post:
 *     tags: [Debug]
 *     summary: Set test location
 *     description: Set a test location for the current user (Development only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude:
 *                 type: number
 *                 default: 37.4275
 *                 example: 37.4275
 *               longitude:
 *                 type: number
 *                 default: -122.1697
 *                 example: -122.1697
 *     responses:
 *       200:
 *         description: Test location set successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Test location set successfully"
 *                 location:
 *                   type: object
 *       500:
 *         description: Internal server error
 */
router.post("/debug/set-test-location", async (req, res) => {
  try {
    const userId = req.user.id;
    const { latitude = 37.4275, longitude = -122.1697 } = req.body;

    const coordinates = [parseFloat(longitude), parseFloat(latitude)];
    const result = await locationService.updateUserLocation(
      userId,
      coordinates,
      50
    );

    res.json({
      message: "Test location set successfully",
      location: result,
    });
  } catch (error) {
    console.error("Set test location error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
