import { db } from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

export const createUser = async (userData) => {
  const {
    first_name,
    last_name,
    email,
    password,
    university_id,
    auth_provider = "email",
    provider_id = null,
    profile_picture_url = null,
    is_email_verified = false,
    is_edu_verified = false,
    is_active = true,
    gender = "not specified",
  } = userData;

  const user_id = `user_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  if (auth_provider === "email" && !password) {
    throw new Error("Password is required for email authentication");
  }

  const [result] = await db.execute(
    `INSERT INTO users (
      user_id, university_id, email, password_hash, first_name, last_name, 
      auth_provider, provider_id, profile_picture_url, is_email_verified, 
      is_edu_verified, is_active, gender
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user_id,
      university_id,
      email,
      password, // This can be null for OAuth users
      first_name,
      last_name,
      auth_provider,
      provider_id,
      profile_picture_url,
      is_email_verified,
      is_edu_verified,
      is_active,
      gender,
    ]
  );

  return user_id;
};

export const findUserByEmail = async (email) => {
  const [rows] = await db.execute(
    `SELECT user_id, university_id, email, password_hash, first_name, last_name, 
            is_active, is_email_verified, created_at, graduation_year, program
     FROM users WHERE email = ? AND is_active = TRUE`,
    [email]
  );
  return rows[0];
};

export const updateUserPassword = async (email, newPasswordHash) => {
  const [result] = await db.execute(
    "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?",
    [newPasswordHash, email]
  );

  return result.affectedRows > 0;
};

export const markEmailAsVerified = async (email) => {
  const [result] = await db.execute(
    "UPDATE users SET is_email_verified = TRUE, updated_at = CURRENT_TIMESTAMP WHERE email = ?",
    [email]
  );

  return result.affectedRows > 0;
};

export const createOTP = async (email, otp) => {
  // Delete any existing OTP for this email first
  await db.execute("DELETE FROM otps WHERE email = ?", [email]);

  // Set expiration to 10 minutes from now
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const [result] = await db.execute(
    "INSERT INTO otps (email, otp_code, expires_at) VALUES (?, ?, ?)",
    [email, otp, expiresAt]
  );

  return result.insertId;
};

export const verifyOTP = async (email, otp) => {
  const [rows] = await db.execute(
    "SELECT * FROM otps WHERE email = ? AND otp_code = ? AND expires_at > NOW()",
    [email, otp]
  );

  if (rows.length > 0) {
    // Mark email as verified
    await markEmailAsVerified(email);
    // Delete the used OTP
    await deleteOTP(email);
    return true;
  }

  return false;
};

export const deleteOTP = async (email) => {
  const [result] = await db.execute("DELETE FROM otps WHERE email = ?", [
    email,
  ]);
  return result.affectedRows > 0;
};

export const findUserById = async (userId) => {
  const [rows] = await db.execute(
    `SELECT user_id, university_id, email, first_name, last_name, 
            is_active, is_email_verified, created_at, graduation_year, program
     FROM users WHERE user_id = ? AND is_active = TRUE`,
    [userId]
  );
  return rows[0];
};

export const updateUserProfile = async (userId, updateData) => {
  const allowedFields = [
    "first_name",
    "last_name",
    "program",
    "graduation_year",
  ];
  const updates = [];
  const values = [];

  Object.keys(updateData).forEach((key) => {
    if (allowedFields.includes(key) && updateData[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(updateData[key]);
    }
  });

  if (updates.length === 0) {
    throw new Error("No valid fields to update");
  }

  updates.push("updated_at = CURRENT_TIMESTAMP");
  values.push(userId);

  const [result] = await db.execute(
    `UPDATE users SET ${updates.join(", ")} WHERE user_id = ?`,
    values
  );

  return result.affectedRows > 0;
};

export const deactivateUser = async (userId) => {
  const [result] = await db.execute(
    "UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
    [userId]
  );

  return result.affectedRows > 0;
};

// Clean up expired OTPs (can be run as a cron job)
export const cleanupExpiredOTPs = async () => {
  const [result] = await db.execute(
    "DELETE FROM otps WHERE expires_at <= NOW()"
  );
  return result.affectedRows;
};

export const findUserByProvider = async (provider, providerId) => {
  if (!provider || !providerId) {
    console.error("Invalid parameters for findUserByProvider");
    return null;
  }
  const [rows] = await db.execute(
    `SELECT user_id, university_id, email, first_name, last_name, 
              is_active, is_email_verified, created_at, graduation_year, program,
              auth_provider, provider_id, profile_picture_url, last_login
       FROM users WHERE auth_provider = ? AND provider_id = ? AND is_active = TRUE`,
    [provider, providerId]
  );
  return rows[0];
};

export const findUniversityByDomain = async (domain) => {
  const [rows] = await db.execute(
    "SELECT university_id, name, domain FROM universities WHERE domain = ? AND is_verified = TRUE",
    [domain]
  );
  return rows[0];
};

export const updateUserLastLogin = async (userId) => {
  const [result] = await db.execute(
    "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?",
    [userId]
  );
  return result.affectedRows > 0;
};
