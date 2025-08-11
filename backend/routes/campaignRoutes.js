import express from 'express';
import { getCampaigns, createCampaign, sendCampaign, generateEmail, deleteCampaign } from '../controllers/campaignController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();


router.get('/', verifyToken, getCampaigns);
router.post('/', verifyToken,createCampaign);
router.post('/send/:id',verifyToken, sendCampaign);
router.post('/generate',verifyToken, generateEmail);
router.delete('/:id' , verifyToken,deleteCampaign )

export default router;
