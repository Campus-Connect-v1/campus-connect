import express from "express";
import { getUniversityDomains } from "../controllers/university.controller.js";

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

export default router;
