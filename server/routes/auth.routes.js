import express from "express";
import {
  register,
  login,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";
import { otpLimiter, authLimiter } from "../utils/rateLimiter.js";
const router = express.Router();

// Public routes with rate limiting
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/verify-otp", authLimiter, verifyOTP);
router.post("/resend-otp", otpLimiter, resendOTP);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

export default router;
