// Shared CORS policy for the HTTP app and the Socket.IO server, so the two
// cannot drift apart.
//
// CLIENT_URL may hold several origins, comma separated, e.g.
//   CLIENT_URL='https://campus.example.com,https://staging.campus.example.com'

import { COLORS } from "../helper/logger.js";

export const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, "")) // tolerate a trailing slash
  .filter(Boolean);

// Native iOS and Android builds send no Origin header at all, and neither do
// curl or server-to-server calls. Rejecting those would break the Expo app on
// every platform except web, so a missing Origin is always allowed -- CORS is
// a browser mechanism and gives us nothing there anyway.
export function isOriginAllowed(origin) {
  if (!origin) return true;
  if (allowedOrigins.length === 0) return true; // see warning below
  return allowedOrigins.includes(origin.replace(/\/$/, ""));
}

if (allowedOrigins.length === 0) {
  console.warn(
    COLORS[process.env.WARNING],
    "CLIENT_URL is not set → CORS is allowing every origin. Set it before " +
      "taking real traffic."
  );
} else {
  console.log(
    COLORS[process.env.SUCCESS],
    `CORS restricted to: ${allowedOrigins.join(", ")}`
  );
}

export const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) return callback(null, true);
    callback(new Error(`Blocked by CORS: ${origin}`));
  },
  credentials: true,
};
