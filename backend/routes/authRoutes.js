

import express from "express";
import { loginUser, registerUser } from "../controllers/authcontroller.js";
import googleAuthRoutes from "./googleAuth.js";

const router = express.Router();
router.post("/", loginUser);

router.post("/register", registerUser);
router.use("/google", googleAuthRoutes);


export default router;
