

import express from "express";
import { loginUser, registerUser } from "../controllers/authcontroller.js";
import { verifyToken } from "../middleware/authMiddleware.js";


const router = express.Router();
router.post("/", loginUser);

router.post("/register", registerUser);

router.get("/validate-token", verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Token is valid",
    user: req.user, 
  });
});


export default router;
