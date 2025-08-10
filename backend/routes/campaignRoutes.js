import express from 'express';
import { getCampaigns, createCampaign, sendCampaign, generateEmail } from '../controllers/campaignController.js';

const router = express.Router();


router.get('/', getCampaigns);
router.post('/', createCampaign);
router.post('/send/:id', sendCampaign);
router.post('/generate', generateEmail);

export default router;
