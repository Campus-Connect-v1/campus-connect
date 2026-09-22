import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 15 minutes // todo: reduce back to 15mins
  max: 20, // TODO: Limit each IP to 5 requests per windowMs
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 OTP requests per windowMs
  message: {
    error: "Too many OTP requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ---------------------------------------------------------------------------
// Write-path limits
//
// The auth limiters above protect sign-in. Everything a signed-in account can
// do -- post, comment, like, message, request an upload signature -- was
// unthrottled, which is the surface that actually gets abused on a social
// network: one script can fill a campus feed in a minute.
//
// These key on the USER id, falling back to IP for anything unauthenticated.
// Keying on IP alone is wrong in both directions here: a university NAT puts
// thousands of legitimate students behind one address, while one determined
// account roams between wifi and mobile data for free.
//
// Note the store is in-process. That is correct for a single Render instance
// and silently wrong the moment there are two, because each would keep its own
// counters -- switch to rate-limit-redis alongside any horizontal scaling.
// ---------------------------------------------------------------------------

import { ipKeyGenerator } from "express-rate-limit";

const byUser = (req, res) =>
  req.user?.id ? `u:${req.user.id}` : ipKeyGenerator(req, res);

const limiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    keyGenerator: byUser,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
    // A rejected write must not also cost a database round trip.
    skipFailedRequests: false,
  });

/**
 * Creating content. Deliberately the tightest of the write limits: a post or a
 * story is the thing that lands in other people's feeds, so it is the thing
 * worth rationing. Twenty an hour is far above human use and far below a bot's.
 */
export const createContentLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: "You are posting too quickly. Try again in a little while.",
});

/**
 * Comments and messages. Higher than posting because a real conversation is
 * genuinely bursty -- a thread with a friend can be thirty messages in ten
 * minutes and that is not abuse.
 */
export const conversationLimiter = limiter({
  windowMs: 10 * 60 * 1000,
  max: 120,
  message: "You are sending messages too quickly. Slow down a moment.",
});

/**
 * Likes, saves, votes, views. Cheap individually, and a double tap is normal,
 * so this exists to stop enumeration and vote-stuffing rather than to police
 * ordinary use.
 */
export const reactionLimiter = limiter({
  windowMs: 5 * 60 * 1000,
  max: 300,
  message: "Too many actions. Give it a second.",
});

/**
 * Upload signatures. Each one authorises a direct-to-Cloudinary upload, so an
 * unthrottled endpoint is an unthrottled bill as much as an abuse vector.
 */
export const uploadLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  max: 60,
  message: "Too many uploads. Try again later.",
});

/**
 * Connection and follow requests. The classic spam vector on any social
 * product: blast requests at everyone and harvest whoever accepts.
 */
export const socialGraphLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: "Too many requests sent. Try again later.",
});
