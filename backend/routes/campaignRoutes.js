import express from "express";
import {
  getCampaigns,
  createCampaign,
  sendCampaign,
  generateEmail,
  deleteCampaign,
} from "../controllers/campaignController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Campaigns
 *   description: Campaign management APIs
 */

/**
 * @swagger
 * /api/campaigns:
 *   get:
 *     summary: Get all campaigns
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of campaigns
 */
router.get("/", verifyToken, getCampaigns);

/**
 * @swagger
 * /api/campaigns:
 *   post:
 *     summary: Create a new campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Summer Sale
 *               content:
 *                 type: string
 *                 example: "Get 50% off all items!"
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["user1@example.com", "user2@example.com"]
 *     responses:
 *       201:
 *         description: Campaign created successfully
 */
router.post("/", verifyToken, createCampaign);

/**
 * @swagger
 * /api/campaigns/send/{id}:
 *   post:
 *     summary: Send a campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign sent successfully
 */
router.post("/send/:id", verifyToken, sendCampaign);

/**
 * @swagger
 * /api/campaigns/generate:
 *   post:
 *     summary: Generate campaign email content
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Email content generated
 */
router.post("/generate", verifyToken, generateEmail);

/**
 * @swagger
 * /api/campaigns/{id}:
 *   delete:
 *     summary: Delete a campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign deleted
 */
router.delete("/:id", verifyToken, deleteCampaign);

export default router;
