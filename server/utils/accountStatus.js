import { db } from "../config/db.js";

/**
 * Whether an account may still use its token.
 *
 * A JWT outlives the account it was issued to: deleting an account clears the
 * token on the device that deleted it, but any other copy kept working until
 * it expired seven days later. Every authenticated request now checks the
 * account is still active.
 *
 * The answer is cached briefly so this is not a database round trip on every
 * request. Deletion and recovery call `forgetAccountStatus`, so on this
 * instance the change takes effect at once rather than after the TTL.
 */
const TTL_MS = 60_000;
const cache = new Map();

export const isAccountActive = async (userId) => {
  if (!userId) return false;

  const hit = cache.get(userId);
  if (hit && hit.expires > Date.now()) return hit.active;

  const [rows] = await db.execute(`SELECT is_active FROM users WHERE user_id = ?`, [userId]);
  const active = rows.length > 0 && Boolean(rows[0].is_active);

  // Bounded: drop the oldest entry rather than letting a long-running process
  // accumulate one per user ever seen.
  if (cache.size >= 10_000) cache.delete(cache.keys().next().value);
  cache.set(userId, { active, expires: Date.now() + TTL_MS });
  return active;
};

export const forgetAccountStatus = (userId) => cache.delete(userId);
