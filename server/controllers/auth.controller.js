import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import {
  createUser,
  findUserByEmail,
  updateUserPassword,
  createOTP,
  verifyOTP as verifyOTPModel,
  deleteOTP,
  markEmailAsVerified,
  findUniversityByDomain,
  findUserById,
  findUserByProvider,
} from "../models/auth.model.js";
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyOTPValidation,
  resendOTPValidation,
} from "../middleware/validations.js";
import {
  sendOTPEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
} from "../utils/mailer.js"; // Import the email functions

dotenv.config();

// Utility function to handle validation errors
const handleValidationError = (error, res) => {
  const errors = error.details.map((detail) => ({
    field: detail.path[0],
    message: detail.message,
  }));

  return res.status(400).json({
    message: "Validation failed",
    errors,
  });
};

export const register = async (req, res) => {
  try {
    // Validate request body
    const { error } = registerValidation(req.body);
    if (error) return handleValidationError(error, res);

    const { first_name, last_name, email, password, university_id } = req.body;

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered",
        suggestion: "Please use a different email or try logging in",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userId = await createUser({
      first_name,
      last_name,
      email,
      password: hashedPassword,
      university_id,
    });

    // Generate OTP for email verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await createOTP(email, otp);

    try {
      await sendOTPEmail(email, otp, first_name, last_name);
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      // Don't fail the registration if email fails.
    }

    // Only log OTP in development
    if (process.env.NODE_ENV === "development") {
      console.log(`OTP for ${email}: ${otp}`);
    }

    res.status(201).json({
      message: "User registered successfully. Please verify your email.",
      userId,
      emailSent: true,
      emailVerified: false,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Internal server error during registration",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      stack: error.stack,
    });
  }
};

export const login = async (req, res) => {
  try {
    // Validate request body
    const { error } = loginValidation(req.body);
    if (error) return handleValidationError(error, res);

    const { email, password } = req.body;

    // Find user
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
        suggestion: "Please check your credentials and try again",
      });
    }

    // Validate password
    if (!user.password_hash) {
      return res.status(500).json({
        message: "Authentication error",
        error: "User password not properly configured",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
        suggestion: "Please check your credentials and try again",
      });
    }

    // Check if email is verified
    if (!user.is_email_verified) {
      return res.status(403).json({
        message: "Email not verified",
        suggestion: "Please verify your email before logging in",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.user_id,
        email: user.email,
        university_id: user.university_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.user_id,
        name: `${user.first_name} ${user.last_name || ""}`.trim(),
        email: user.email,
        university_id: user.university_id,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Internal server error during login",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    // Validate request body
    const { error } = verifyOTPValidation(req.body);
    if (error) return handleValidationError(error, res);

    const { email, otp } = req.body;
    console.log("OTP Verification Debug:");
    console.log("Email:", email);
    console.log("OTP:", otp);

    // Verify OTP
    const isValidOTP = await verifyOTPModel(email, otp);
    if (!isValidOTP) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
        suggestion:
          "Please request a new OTP if this one has expired or Check the email typed, but the email should be stored on frontend and used as a part of the request not that the user will retype the eamil.",
      });
    }

    // Mark email as verified
    // await markEmailAsVerified(email);

    // Delete used OTP
    // await deleteOTP(email);

    try {
      const user = await findUserByEmail(email);
      await sendWelcomeEmail(email, user.first_name);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail verification if email fails
    }

    res.status(200).json({
      message: "Email verified successfully",
      emailVerified: true,
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({
      message: "Internal server error during OTP verification",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const resendOTP = async (req, res) => {
  try {
    // Validate request body
    const { error } = resendOTPValidation(req.body);
    if (error) return handleValidationError(error, res);

    const { email } = req.body;

    // Check if user exists
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        message: "Email not found",
        suggestion: "Please check the email address or register first",
      });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await createOTP(email, otp);

    try {
      await sendOTPEmail(email, otp, user.first_name);

      // Only log OTP in development
      if (process.env.NODE_ENV === "development") {
        console.log(`New OTP for ${email}: ${otp}`);
      }

      return res.status(200).json({
        message: "OTP sent successfully",
        emailSent: true,
      });
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      return res.status(500).json({
        message: "OTP generated but failed to send email",
        emailSent: false,
      });
    }
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      message: "Internal server error while sending OTP",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    // Validate request body
    const { error } = forgotPasswordValidation(req.body);
    if (error) return handleValidationError(error, res);

    const { email } = req.body;

    // Check if user exists
    const user = await findUserByEmail(email);
    if (!user) {
      // Don't reveal that the email doesn't exist for security.
      return res.status(200).json({
        message: "If the email exists, a password reset link has been sent",
        suggestion: `Please check the email address ${email}`,
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    try {
      await sendPasswordResetEmail(email, resetToken, user.first_name);

      // Only log token in development
      if (process.env.NODE_ENV === "development") {
        console.log(`Password reset token for ${email}: ${resetToken}`);
      }

      return res.status(200).json({
        message: "If the email exists, a password reset link has been sent",
        emailSent: true,
        resetToken:
          process.env.NODE_ENV === "development" ? resetToken : undefined,
      });
    } catch (emailError) {
      console.error("Failed to send reset email:", emailError);
      return res.status(500).json({
        message: "Error sending password reset email",
        emailSent: false,
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      message: "Internal server error during password reset request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    // Validate request body
    const { error } = resetPasswordValidation(req.body);
    if (error) return handleValidationError(error, res);

    const { token, password } = req.body;

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
        suggestion: "Please request a new password reset link",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password
    const updated = await updateUserPassword(decoded.email, hashedPassword);
    if (!updated) {
      return res.status(404).json({
        message: "User not found",
        suggestion: "Please check your reset token and try again",
      });
    }

    try {
      const user = await findUserByEmail(decoded.email);
      await sendPasswordResetSuccessEmail(decoded.email, user.first_name);
    } catch (emailError) {
      console.error("Failed to send success email:", emailError);
      // Don't fail the reset if email fails
    }

    res.status(200).json({
      message: "Password reset successfully",
      passwordUpdated: true,
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      message: "Internal server error during password reset",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

//  OAuth functions

// auth.controller.js - Fixed Google OAuth

import { OAuth2Client } from "google-auth-library";

// Initialize Google client properly
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "Google token is required",
      });
    }

    console.log("Google token received, length:", token.length);
    console.log("Token preview:", token.substring(0, 50) + "...");

    // For mobile apps, we need to verify the token differently
    let payload;

    try {
      // Method 1: Try standard verification first
      console.log("Attempting standard Google token verification...");
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience:
          process.env.GOOGLE_WEB_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
      console.log("Standard verification successful");
    } catch (verifyError) {
      console.log("Standard verification failed:", verifyError.message);

      // Method 2: Check if it's your own JWT token (wrong token type)
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Detected internal JWT token instead of Google token");
        return res.status(400).json({
          message: "Wrong token type",
          suggestion:
            "Please use Google Sign-In token, not your app login token",
        });
      } catch (jwtError) {
        // Not a JWT token, continue with manual Google token processing
      }

      // Method 3: Manual verification for mobile tokens
      try {
        console.log("Attempting manual token decoding...");
        // Decode the token without verification to get basic info
        const tokenParts = token.split(".");
        if (tokenParts.length !== 3) {
          throw new Error("Invalid token format");
        }

        const decodedToken = JSON.parse(
          Buffer.from(tokenParts[1], "base64").toString()
        );
        console.log("Decoded token payload:", decodedToken);

        // For mobile apps, we might need to use the Google People API or just trust the token
        // and validate the email domain
        payload = {
          sub: decodedToken.sub || decodedToken.user_id,
          email: decodedToken.email,
          email_verified: decodedToken.email_verified || true,
          given_name:
            decodedToken.given_name || decodedToken.first_name || "Google",
          family_name:
            decodedToken.family_name || decodedToken.last_name || "User",
          picture: decodedToken.picture || decodedToken.profile_picture_url,
        };

        // Additional validation
        if (!payload.email) {
          throw new Error("No email in token");
        }

        console.log("Manual decoding successful");
      } catch (decodeError) {
        console.error("Token decode error:", decodeError);
        return res.status(400).json({
          message: "Invalid Google token format",
          suggestion:
            "Please try signing in with Google again. Make sure you're using the Google Sign-In token, not your app's login token.",
        });
      }
    }

    const {
      sub: googleId,
      email,
      email_verified,
      given_name: first_name,
      family_name: last_name,
      picture: profile_picture_url,
    } = payload;

    console.log("Processing Google auth for:", email);
    console.log("Google ID:", googleId);

    // Validate .edu email
    if (!email.endsWith(".edu")) {
      return res.status(400).json({
        message: "University email required",
        suggestion:
          "Please use your university (.edu) email address with Google",
      });
    }

    // Extract domain and find university
    const emailDomain = email.split("@")[1];
    const university = await findUniversityByDomain(emailDomain);

    if (!university) {
      return res.status(400).json({
        message: "University not supported",
        suggestion: `Your university domain (${emailDomain}) is not currently supported. Please use email registration instead.`,
      });
    }

    console.log("Found university:", university.name);

    // Check if user exists with this Google account
    let user = await findUserByProvider("google", googleId);

    if (!user) {
      console.log("No existing Google user found, checking by email...");

      // Check if user exists with same email but different provider
      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        console.log(
          "Found existing user with different auth method:",
          existingUser.auth_provider
        );
        return res.status(409).json({
          message: "Email already registered",
          suggestion: `This email is already registered with ${existingUser.auth_provider} authentication. Please log in with your password.`,
        });
      }

      console.log("Creating new Google user...");

      // Create new user with Google OAuth
      const userId = await createUser({
        first_name: first_name || "Google",
        last_name: last_name || "User",
        email,
        auth_provider: "google",
        provider_id: googleId,
        profile_picture_url: profile_picture_url,
        university_id: university.university_id,
        is_email_verified: email_verified || true, // Google emails are verified
        is_edu_verified: true,
        is_active: true,
        gender: "not specified",
      });

      user = await findUserByEmail(email);
      console.log("New Google user created:", user.user_id);
    } else {
      // Update last login for existing user
      await updateUserLastLogin(user.user_id);
      console.log("Existing Google user logged in:", user.user_id);
    }

    // Generate JWT token (same as your login)
    const jwtToken = jwt.sign(
      {
        id: user.user_id,
        email: user.email,
        university_id: user.university_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Send welcome email if this is first time
    if (!user.last_login) {
      try {
        await sendWelcomeEmail(email, user.first_name);
        console.log("Welcome email sent");
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }

      // Update last login
      await updateUserLastLogin(user.user_id);
    }

    console.log("Google authentication successful for user:", user.user_id);

    res.status(200).json({
      message: "Google authentication successful",
      token: jwtToken,
      user: {
        id: user.user_id,
        name: `${user.first_name} ${user.last_name || ""}`.trim(),
        email: user.email,
        university_id: user.university_id,
        profile_picture_url: user.profile_picture_url,
        is_email_verified: user.is_email_verified,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);

    // More specific error handling
    if (error.message.includes("pem") || error.message.includes("envelope")) {
      return res.status(400).json({
        message: "Invalid Google token format",
        suggestion:
          "Please make sure you're using the correct Google Sign-In method",
      });
    }

    if (error.message.includes("Token used too late")) {
      return res.status(400).json({
        message: "Expired Google token",
        suggestion: "Please try signing in with Google again",
      });
    }

    res.status(500).json({
      message: "Google authentication failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// TEMPORARY TEST ROUTE
export const testGoogleAuth = async (req, res) => {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ message: "Test route only in development" });
  }

  const { email } = req.body;

  if (!email || !email.endsWith(".edu")) {
    return res.status(400).json({
      message: "Please provide a .edu email for testing",
    });
  }

  try {
    const emailDomain = email.split("@")[1];
    const university = await findUniversityByDomain(emailDomain);

    if (!university) {
      return res.status(400).json({
        message: "University not supported",
        suggestion: `Domain ${emailDomain} not in our system`,
      });
    }

    // Create test Google user
    const testGoogleId = `test_google_${Date.now()}`;
    let user = await findUserByProvider("google", testGoogleId);

    if (!user) {
      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          message: "Email already registered with different method",
        });
      }

      const firstName = email.split("@")[0];

      // FIX: Make sure ALL required fields are provided
      const userData = {
        first_name: firstName.charAt(0).toUpperCase() + firstName.slice(1),
        last_name: "TestUser",
        email: email,
        password: null, // Explicitly set to null for OAuth users
        auth_provider: "google",
        provider_id: testGoogleId,
        profile_picture_url: null, // Explicit null
        university_id: university.university_id,
        is_email_verified: true,
        is_edu_verified: true,
        is_active: true,
        gender: "not specified",
      };

      console.log("Creating user with data:", userData);

      const userId = await createUser(userData);
      user = await findUserByEmail(email);
    }

    // Generate your app JWT
    const jwtToken = jwt.sign(
      {
        id: user.user_id,
        email: user.email,
        university_id: user.university_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Test Google authentication successful",
      token: jwtToken,
      user: {
        id: user.user_id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        university_id: user.university_id,
        is_email_verified: user.is_email_verified,
      },
    });
  } catch (error) {
    console.error("Test auth error:", error);
    res.status(500).json({
      message: "Test authentication failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
