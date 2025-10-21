import express from "express";
import { getUniversityDomains } from "../controllers/university.controller.js";
import { campusController } from "../controllers/university.controller.js";
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Universities
 *     description: University data and domains
 */

/**
 * @swagger
 * /university/domains:
 *   get:
 *     tags: [Universities]
 *     summary: Get university domains for dropdown
 *     description: Retrieve verified universities with domains, colors, and location data
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search universities by name, domain, or city
 *     responses:
 *       200:
 *         description: Universities retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get("/domains", getUniversityDomains);

/**
 * @swagger
 * tags:
 *   name: Campus
 *   description: Campus buildings and facilities endpoints
 */

/**
 * @swagger
 * /api/campus/{university_id}/buildings:
 *   get:
 *     summary: Get all buildings for a university
 *     tags: [Campus]
 *     parameters:
 *       - in: path
 *         name: university_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: building_type
 *         schema:
 *           type: string
 *           enum: [academic, administrative, residential, recreational, dining, library, sports]
 *         description: Filter by building type
 *     responses:
 *       200:
 *         description: List of campus buildings
 */
router.get("/:university_id/buildings", campusController.getBuildings);

/**
 * @swagger
 * /api/campus/{university_id}/buildings/search:
 *   get:
 *     summary: Search buildings
 *     tags: [Campus]
 *     parameters:
 *       - in: path
 *         name: university_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: Search results for buildings
 */
router.get(
  "/:university_id/buildings/search",
  campusController.searchBuildings
);

/**
 * @swagger
 * /api/campus/buildings/{buildingId}:
 *   get:
 *     summary: Get building by ID
 *     tags: [Campus]
 *     parameters:
 *       - in: path
 *         name: buildingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Building details
 *       404:
 *         description: Building not found
 */
router.get("/buildings/:buildingId", campusController.getBuildingById);

/**
 * @swagger
 * /api/campus/buildings/{buildingId}/facilities:
 *   get:
 *     summary: Get facilities by building
 *     tags: [Campus]
 *     parameters:
 *       - in: path
 *         name: buildingId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: facility_type
 *         schema:
 *           type: string
 *           enum: [classroom, lab, study_room, office, cafe, lounge, library, gym, other]
 *         description: Filter by facility type
 *     responses:
 *       200:
 *         description: List of facilities in building
 */
router.get(
  "/buildings/:buildingId/facilities",
  campusController.getFacilitiesByBuilding
);

/**
 * @swagger
 * /api/campus/facilities/{facilityId}:
 *   get:
 *     summary: Get facility by ID
 *     tags: [Campus]
 *     parameters:
 *       - in: path
 *         name: facilityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Facility details
 *       404:
 *         description: Facility not found
 */
router.get("/facilities/:facilityId", campusController.getFacilityById);

/**
 * @swagger
 * /api/campus/{university_id}/facilities/search:
 *   get:
 *     summary: Search facilities
 *     tags: [Campus]
 *     parameters:
 *       - in: path
 *         name: university_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: Search results for facilities
 */
router.get(
  "/:university_id/facilities/search",
  campusController.searchFacilities
);

/**
 * @swagger
 * /api/campus/{university_id}/facilities/type:
 *   get:
 *     summary: Get facilities by type
 *     tags: [Campus]
 *     parameters:
 *       - in: path
 *         name: university_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: facility_type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [classroom, lab, study_room, office, cafe, lounge, library, gym, other]
 *         description: Facility type to filter by
 *     responses:
 *       200:
 *         description: List of facilities by type
 */
router.get(
  "/:university_id/facilities/type",
  campusController.getFacilitiesByType
);

/**
 * @swagger
 * /api/campus/{university_id}/facilities/reservable:
 *   get:
 *     summary: Get reservable facilities
 *     tags: [Campus]
 *     parameters:
 *       - in: path
 *         name: university_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of reservable facilities
 */
router.get(
  "/:university_id/facilities/reservable",
  campusController.getReservableFacilities
);
export default router;
