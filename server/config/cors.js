// Shared CORS policy for the HTTP app and the Socket.IO server, so the two
// cannot drift apart.
//
// CLIENT_URL may hold several origins, comma separated, e.g.
//   CLIENT_URL='https://campus.example.com,https://staging.campus.example.com'
//
// Set it to '*' to allow every origin deliberately. That is the current
// production setting: the client is not deployed yet, so there is no origin
// to name. Replace '*' with the real URL before taking real traffic.

import { COLORS } from "../helper/logger.js";

export const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, "")) // tolerate a trailing slash
  .filter(Boolean);

// Native iOS and Android builds send no Origin header at all, and neither do
// curl or server-to-server calls. Rejecting those would break the Expo app on
// every platform except web, so a missing Origin is always allowed -- CORS is
// a browser mechanism and gives us nothing there anyway.
export const allowAllOrigins =
  allowedOrigins.length === 0 || allowedOrigins.includes("*");

export function isOriginAllowed(origin) {
  if (!origin) return true;
  if (allowAllOrigins) return true;
  return allowedOrigins.includes(origin.replace(/\/$/, ""));
}

if (allowAllOrigins) {
  console.warn(
    COLORS[process.env.WARNING],
    allowedOrigins.includes("*")
      ? "CORS is allowing every origin (CLIENT_URL='*')"
      : "CLIENT_URL is not set → CORS is allowing every origin"
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
