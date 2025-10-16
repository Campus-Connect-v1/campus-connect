import { db } from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

export const createUser = async (userData) => {
  const { first_name, last_name, email, password, university_id } = userData;
  const user_id = uuidv4();

  const [result] = await db.execute(
    `INSERT INTO users (user_id, university_id, email, password_hash, first_name, last_name, is_email_verified) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      user_id,
      university_id,
      email,
      password,
      first_name,
      last_name,
      false, // Email not verified initially
    ]
  );

  return user_id; // Return the user_id
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
