import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "cc.auth.token";
const USER_KEY = "cc.auth.user";
const SETUP_COMPLETE_PREFIX = "cc.setup.complete.";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  university_id: string;
}

/**
 * The JWT the API issues on login, held in memory and mirrored to AsyncStorage.
 *
 * The in-memory copy exists so the axios interceptor can attach the header
 * synchronously; reading AsyncStorage per request would make every call await
 * a disk read, and an interceptor that returns a promise reorders requests.
 */
let token: string | null = null;
let user: SessionUser | null = null;

/** Called once on boot, before any authenticated request is made. */
export async function restoreSession() {
  const [storedToken, storedUser] = await Promise.all([
    AsyncStorage.getItem(TOKEN_KEY),
    AsyncStorage.getItem(USER_KEY),
  ]);
  token = storedToken;
  user = storedUser ? (JSON.parse(storedUser) as SessionUser) : null;
  return { token, user };
}

export async function saveSession(nextToken: string, nextUser: SessionUser) {
  token = nextToken;
  user = nextUser;
  await Promise.all([
    AsyncStorage.setItem(TOKEN_KEY, nextToken),
    AsyncStorage.setItem(USER_KEY, JSON.stringify(nextUser)),
  ]);
}

export async function clearSession() {
  token = null;
  user = null;
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

export function getToken() {
  return token;
}

export function getUser() {
  return user;
}

/** Profile setup is also remembered on-device so an older deployed API cannot
 * trap someone in onboarding just because it does not accept the completion
 * flag yet. The user id keeps accounts on the same device independent. */
export async function getSetupCompleted(userId = user?.id) {
  if (!userId) return false;
  return (await AsyncStorage.getItem(`${SETUP_COMPLETE_PREFIX}${userId}`)) === "true";
}

export async function saveSetupCompleted(userId = user?.id) {
  if (!userId) return;
  await AsyncStorage.setItem(`${SETUP_COMPLETE_PREFIX}${userId}`, "true");
}

/**
 * Notified when the API rejects the stored token, so the app can send the user
 * back to sign-in from wherever they happen to be.
 */
type ExpiryListener = () => void;
let onExpired: ExpiryListener | null = null;

export function setOnSessionExpired(listener: ExpiryListener | null) {
  onExpired = listener;
}

export function notifySessionExpired() {
  clearSession();
  onExpired?.();
}
