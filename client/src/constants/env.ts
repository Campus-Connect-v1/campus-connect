/**
 * Typed access to the EXPO_PUBLIC_* variables declared in `.env`.
 *
 * Expo inlines `process.env.EXPO_PUBLIC_X` at build time via a Babel
 * transform, so the reads below must stay as full static member expressions —
 * destructuring `process.env` or indexing it dynamically yields undefined.
 */

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy client/.env.example to client/.env, fill it in, ` +
        `then restart Metro with \`npx expo start -c\`.`
    );
  }
  return value;
}

export const API_URL = required(process.env.EXPO_PUBLIC_API_URL, "EXPO_PUBLIC_API_URL");

export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? API_URL.replace(/\/api\/?$/, "");

export const GOOGLE_CLIENT_IDS = {
  expo: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
  ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
};

export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const ENV = process.env.EXPO_PUBLIC_ENV ?? "development";

/**
 * Temporary: routes straight into the tabs, skipping onboarding and auth.
 * Guarded so it can never be true in a production build, whatever the .env says.
 */
export const BYPASS_AUTH = __DEV__ && process.env.EXPO_PUBLIC_BYPASS_AUTH === "true";
export const ENABLE_GEOFENCING = process.env.EXPO_PUBLIC_ENABLE_GEOFENCING === "true";
