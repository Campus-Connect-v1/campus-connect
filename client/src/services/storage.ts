import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Thin, typed wrapper around AsyncStorage. All persistence flows through
 * here so storage keys live in one place and JSON (de)serialization is
 * consistent across the app.
 */

export const StorageKeys = {
  token: "auth.token",
  user: "auth.user",
  hasSeenOnboarding: "hasSeenOnboarding",
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

/** Read and JSON-parse a value. Returns null on miss or parse error. */
export async function getItem<T>(key: StorageKey): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** JSON-stringify and persist a value. */
export async function setItem<T>(key: StorageKey, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

/** Remove a single key. */
export async function removeItem(key: StorageKey): Promise<void> {
  await AsyncStorage.removeItem(key);
}

/** Read a raw string without JSON parsing (used for the JWT). */
export async function getString(key: StorageKey): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Persist a raw string without JSON wrapping (used for the JWT). */
export async function setString(key: StorageKey, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value);
}

// ---- Auth-specific helpers ------------------------------------------------

export const getToken = () => getString(StorageKeys.token);
export const setToken = (token: string) => setString(StorageKeys.token, token);
export const clearToken = () => removeItem(StorageKeys.token);

/** Wipe all auth-related keys (token + cached user). */
export async function clearAuth(): Promise<void> {
  await Promise.all([
    removeItem(StorageKeys.token),
    removeItem(StorageKeys.user),
  ]);
}
