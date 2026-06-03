import * as Location from "expo-location";
import { api, request, type ApiResult } from "./api";

/**
 * Location / geofencing client. Routes are mounted at `/api/geofencing`
 * (auth required). Source: server/controllers/location.controller.js.
 * Device positioning uses expo-location.
 */

export interface NearbyProfile {
  user_id: string;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string | null;
  profile_headline?: string | null;
  program?: string | null;
  distance: number; // metres
  accuracy?: number;
  last_seen?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface PrivacySettings {
  location_sharing?: boolean;
  incognito?: boolean;
  [key: string]: unknown;
}

// ---- Device position (expo-location) ----

/** Ask for foreground location permission and return the current coords. */
export async function getCurrentPosition(): Promise<
  { latitude: number; longitude: number; accuracy: number } | null
> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return null;
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    accuracy: pos.coords.accuracy ?? 50,
  };
}

// ---- REST ----

export function updateMyLocation(
  latitude: number,
  longitude: number,
  accuracy = 50,
): Promise<ApiResult<unknown>> {
  return request(() =>
    api.post("/geofencing/location", { latitude, longitude, accuracy }),
  );
}

export function getNearbyProfiles(
  radius = 500,
): Promise<ApiResult<NearbyProfile[]>> {
  return request(async () => {
    const { data } = await api.get<{ profiles?: NearbyProfile[] }>(
      "/geofencing/nearby",
      { params: { radius } },
    );
    return { data: data.profiles ?? [] };
  });
}

export function toggleLocationSharing(
  enabled: boolean,
): Promise<ApiResult<unknown>> {
  return request(() =>
    api.post("/geofencing/location/toggle", { enabled }),
  );
}

export function toggleIncognito(enabled: boolean): Promise<ApiResult<unknown>> {
  return request(() => api.post("/geofencing/incognito", { enabled }));
}

export function getPrivacySettings(): Promise<ApiResult<PrivacySettings>> {
  return request(async () => {
    const { data } = await api.get<PrivacySettings>("/geofencing/privacy");
    return { data };
  });
}

/**
 * Convenience: get the device position and push it to the server. Returns
 * false if permission was denied or the update failed.
 */
export async function syncMyLocation(): Promise<boolean> {
  const pos = await getCurrentPosition();
  if (!pos) return false;
  const res = await updateMyLocation(pos.latitude, pos.longitude, pos.accuracy);
  return res.success;
}

/** Human-friendly distance, e.g. "120 m" or "1.4 km". */
export function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}
