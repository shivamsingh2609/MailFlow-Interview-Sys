

import express from "express";
import { loginUser, registerUser } from "../controllers/authcontroller.js";

const router = express.Router();
router.post("/", loginUser);

router.post("/register", registerUser);


export default router;
