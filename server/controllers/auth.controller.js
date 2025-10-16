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
  markEmailAsVerified, // Make sure this is imported
} from "../models/user.model.js";
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
