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

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and account management
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user with university email verification
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - first_name
 *               - last_name
 *             properties:
 *               email:
 *                 type: string
 *                 example: john.doe@university.edu
 *               password:
 *                 type: string
 *                 example: MyStrongP@ss123
 *               first_name:
 *                 type: string
 *                 example: John
 *               last_name:
 *                 type: string
 *                 example: Doe
 *     responses:
 *       201:
 *         description: Registration successful, OTP sent to email
 *       400:
 *         description: Invalid input or user already exists
 */
router.post("/register", authLimiter, register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: john.doe@university.edu
 *               password:
 *                 type: string
 *                 example: MyStrongP@ss123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials or unverified email
 */
router.post("/login", authLimiter, login);

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify email using the OTP sent during registration
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 example: john.doe@university.edu
 *               otp:
 *                 type: string
 *                 example: 482913
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired OTP
 */
router.post("/verify-otp", authLimiter, verifyOTP);

/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     summary: Resend OTP for email verification
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: john.doe@university.edu
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       429:
 *         description: Too many requests (rate limit exceeded)
 */
router.post("/resend-otp", otpLimiter, resendOTP);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Send password reset link or OTP to email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: john.doe@university.edu
 *     responses:
 *       200:
 *         description: Password reset link or OTP sent
 *       404:
 *         description: Email not found
 */
router.post("/forgot-password", authLimiter, forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using OTP or token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - new_password
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 example: john.doe@university.edu
 *               new_password:
 *                 type: string
 *                 example: NewP@ssword456
 *               otp:
 *                 type: string
 *                 example: 923041
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token/OTP
 */
router.post("/reset-password", authLimiter, resetPassword);

export default router;
