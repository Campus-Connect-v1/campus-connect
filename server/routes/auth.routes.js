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

// /**
//  * @swagger
//  * components:
//  *   schemas:
//  *     UserRegistration:
//  *       type: object
//  *       required:
//  *         - name
//  *         - email
//  *         - password
//  *         - university_id
//  *       properties:
//  *         first_name:
//  *           type: string
//  *           example: "John"
//  *         last_name:
//  *           type: string
//  *           example: "Doe"
//  *         email:
//  *           type: string
//  *           format: email
//  *           example: "john.doe@stanford.edu"
//  *         password:
//  *           type: string
//  *           format: password
//  *           example: "SecurePass123!"
//  *         university_id:
//  *           type: string
//  *           example: "uni_1"
//  *     UserLogin:
//  *       type: object
//  *       required:
//  *         - email
//  *         - password
//  *       properties:
//  *         email:
//  *           type: string
//  *           format: email
//  *           example: "john.doe@stanford.edu"
//  *         password:
//  *           type: string
//  *           format: password
//  *           example: "SecurePass123!"
//  *     VerifyOTP:
//  *       type: object
//  *       required:
//  *         - email
//  *         - otp
//  *       properties:
//  *         email:
//  *           type: string
//  *           format: email
//  *           example: "john.doe@stanford.edu"
//  *         otp:
//  *           type: string
//  *           pattern: '^[0-9]{6}$'
//  *           example: "123456"
//  *     ResendOTP:
//  *       type: object
//  *       required:
//  *         - email
//  *       properties:
//  *         email:
//  *           type: string
//  *           format: email
//  *           example: "john.doe@stanford.edu"
//  *     ForgotPassword:
//  *       type: object
//  *       required:
//  *         - email
//  *       properties:
//  *         email:
//  *           type: string
//  *           format: email
//  *           example: "john.doe@stanford.edu"
//  *     ResetPassword:
//  *       type: object
//  *       required:
//  *         - token
//  *         - password
//  *         - confirmPassword
//  *       properties:
//  *         token:
//  *           type: string
//  *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
//  *         password:
//  *           type: string
//  *           format: password
//  *           example: "NewSecurePass123!"
//  *         confirmPassword:
//  *           type: string
//  *           format: password
//  *           example: "NewSecurePass123!"
//  */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new student with university email verification
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegistration'
 *     responses:
 *       201:
 *         description: User registered successfully. OTP sent to email.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User registered successfully. Please verify your email."
 *                 userId:
 *                   type: string
 *                   example: "user_550e8400-e29b-41d4-a716-446655440000"
 *                 emailSent:
 *                   type: boolean
 *                   example: true
 *                 emailVerified:
 *                   type: boolean
 *                   example: false
 *       400:
 *         description: Validation failed or invalid input
 *       409:
 *         description: Email already registered
 *       500:
 *         description: Internal server error
 */
router.post("/register", authLimiter, register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user and receive JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXJfNTUwZTg0MDAtZTI5Yi00MWQ0LWE3MTYtNDQ2NjU1NDQwMDAwIiwiZW1haWwiOiJqb2huLmRvZUBzdGFuZm9yZC5lZHUiLCJ1bml2ZXJzaXR5X2lkIjoidW5pXzEiLCJpYXQiOjE2OTc4NDAwMDAsImV4cCI6MTY5ODQ0NDgwMH0"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "user_550e8400-e29b-41d4-a716-446655440000"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       example: "john.doe@stanford.edu"
 *                     university_id:
 *                       type: string
 *                       example: "uni_1"
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Invalid email or password
 *       403:
 *         description: Email not verified
 *       500:
 *         description: Internal server error
 */
router.post("/login", authLimiter, login);

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify email address using OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyOTP'
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Email verified successfully"
 *                 emailVerified:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid or expired OTP
 *       500:
 *         description: Internal server error
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
 *             $ref: '#/components/schemas/ResendOTP'
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "OTP sent successfully"
 *                 emailSent:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Email not found
 *       429:
 *         description: Too many OTP requests
 *       500:
 *         description: Internal server error
 */
router.post("/resend-otp", otpLimiter, resendOTP);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset link
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPassword'
 *     responses:
 *       200:
 *         description: Password reset email sent if account exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "If the email exists, a password reset link has been sent"
 *                 emailSent:
 *                   type: boolean
 *                   example: true
 *       500:
 *         description: Internal server error
 */
router.post("/forgot-password", authLimiter, forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using token from email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPassword'
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password reset successfully"
 *                 passwordUpdated:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid or expired token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post("/reset-password", authLimiter, resetPassword);

export default router;
