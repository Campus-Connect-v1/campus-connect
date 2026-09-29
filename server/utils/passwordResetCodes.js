import bcrypt from "bcrypt";
import crypto from "node:crypto";

import { db } from "../config/db.js";

/** Long enough to be safe with the attempt cap below, short enough to retype. */
const CODE_LENGTH = 6;

/**
 * Fifteen minutes.
 *
 * A reset code is read off a screen and typed into the app in the next minute
 * or two. An hour of validity buys the user nothing and leaves a working key
 * sitting in an inbox.
 */
const TTL_MINUTES = 15;

/**
 * Wrong guesses before the code dies.
 *
 * This is the real protection. Six digits is a million possibilities, which a
 * script exhausts quickly; hashing only matters if the database leaks. Five
 * attempts makes guessing useless while still forgiving a typo or two.
 */
const MAX_ATTEMPTS = 5;

/** crypto.randomInt, not Math.random: this value guards an account. */
const generateCode = () =>
  String(crypto.randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, "0");

/**
 * Issues a fresh code and returns the plaintext, for the email only.
 *
 * The plaintext is never stored and never logged outside development.
 */
export const issueResetCode = async (userId) => {
  const code = generateCode();
  const hash = await bcrypt.hash(code, 10);

  await db.execute(
    `INSERT INTO password_reset_codes (user_id, code_hash, expires_at, attempts)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), 0)
     ON DUPLICATE KEY UPDATE
       code_hash = VALUES(code_hash),
       expires_at = VALUES(expires_at),
       attempts = 0,
       created_at = NOW()`,
    [userId, hash, TTL_MINUTES]
  );

  return code;
};

/**
 * Checks a code and consumes it on success.
 *
 * Returns a reason rather than a boolean so the caller can decide what to
 * reveal -- which here is nothing specific, because distinguishing "wrong
 * code" from "no code for that address" tells an attacker which emails have
 * accounts.
 */
export const verifyResetCode = async (userId, code) => {
  const [[row]] = await db.execute(
    `SELECT code_hash, attempts, expires_at < NOW() AS expired
       FROM password_reset_codes
      WHERE user_id = ?`,
    [userId]
  );

  if (!row) return { ok: false, reason: "missing" };

  // Expired and exhausted codes are deleted rather than left to be guessed at
  // again after the clock rolls over.
  if (row.expired || row.attempts >= MAX_ATTEMPTS) {
    await clearResetCode(userId);
    return { ok: false, reason: row.expired ? "expired" : "locked" };
  }

  const matches = await bcrypt.compare(String(code), row.code_hash);
  if (!matches) {
    await db.execute(
      `UPDATE password_reset_codes SET attempts = attempts + 1 WHERE user_id = ?`,
      [userId]
    );
    return { ok: false, reason: "mismatch" };
  }

  // Single use: consumed the moment it works, so a code cannot reset a
  // password twice.
  await clearResetCode(userId);
  return { ok: true };
};

export const clearResetCode = (userId) =>
  db.execute(`DELETE FROM password_reset_codes WHERE user_id = ?`, [userId]);
