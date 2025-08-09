// routes/googleAuth.js
import express from "express";
import { connectGoogle, googleCallback } from "../controllers/googleController.js";

const router = express.Router();

router.get("/connect/:userId", connectGoogle);
router.get("/callback", googleCallback);

export default router;
