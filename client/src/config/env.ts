/**
 * Central runtime config. Values come from Expo public env vars
 * (prefixed EXPO_PUBLIC_ so they're inlined into the client bundle).
 *
 * Set these in a `.env` file at the client root (see `.env.example`).
 * On a physical device, localhost won't resolve — point API_URL at your
 * machine's LAN IP, e.g. http://192.168.1.10:8000/api
 */
const DEFAULT_API_URL = "http://localhost:8000/api";

export const env = {
  /** Base URL for the REST API, including the `/api` prefix. */
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL,
  /** Base URL for the Socket.io server (no `/api` prefix). */
  socketUrl:
    process.env.EXPO_PUBLIC_SOCKET_URL ??
    (process.env.EXPO_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ??
      "http://localhost:8000"),
  /** Web client id for Google sign-in (optional until wired). */
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "",
  /** Cloudinary unsigned upload — enables image uploads when both are set. */
  cloudinaryCloud: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "",
  cloudinaryPreset: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "",
} as const;

/** True when image uploads are configured. */
export const uploadsEnabled = () =>
  !!env.cloudinaryCloud && !!env.cloudinaryPreset;

export default env;
