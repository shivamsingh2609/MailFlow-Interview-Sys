import express from 'express';
import { getCampaigns, createCampaign, sendCampaign } from '../controllers/campaignController.js';

const router = express.Router();


router.get('/', getCampaigns);
router.post('/', createCampaign);
router.post('/send/:id', sendCampaign);


export default router;
