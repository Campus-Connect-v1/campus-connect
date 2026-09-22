import * as Location from "expo-location";

import { api, request } from "./api";

/**
 * What the Nearby UI renders.
 *
 * Deliberately NOT the server's shape: /geofencing/nearby returns a
 * privacy-filtered object whose keys differ (`profile_picture_url`, `online`,
 * `location_context`) and whose identity fields are DROPPED entirely when the
 * viewer is not allowed to see them. `adaptNearby` below does that translation
 * once, so components never render `undefined` because a key was spelled the
 * server's way.
 */
export interface NearbyProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  profile_picture: string | null;
  bio: string | null;
  program: string | null;
  /** Metres from the current user, as computed by the server. */
  distance: number;
  is_online: boolean;
  building?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  /** Optional until the API exposes it for every account. */
  age?: number | null;
}

/** Exactly what /geofencing/nearby puts in `profiles`. */
export interface ApiNearbyProfile {
  user_id: string;
  university_id?: string;
  online?: boolean;
  last_seen?: string;
  distance?: number;
  accuracy?: number;
  latitude?: number | null;
  longitude?: number | null;
  /** Present only when the viewer passes that field's privacy check. */
  first_name?: string;
  last_name?: string;
  display_name?: string;
  profile_picture_url?: string;
  bio?: string;
  program?: string;
  location_context?: string;
  date_of_birth?: string | null;
}

function yearsSince(dob: string | null | undefined) {
  if (!dob) return null;
  const born = new Date(dob);
  if (Number.isNaN(born.getTime())) return null;
  const age = Math.floor((Date.now() - born.getTime()) / 31557600000);
  return age > 0 && age < 120 ? age : null;
}

export function adaptNearby(profile: ApiNearbyProfile): NearbyProfile {
  // A profile whose name is hidden by privacy still belongs on the map; it is
  // shown as "Someone nearby" rather than dropped, which is the honest
  // rendering of "a student is here but chose not to be named".
  const first = profile.first_name ?? profile.display_name?.split(" ")[0] ?? "Someone";
  const last = profile.last_name ?? profile.display_name?.split(" ").slice(1).join(" ") ?? "";

  return {
    user_id: profile.user_id,
    first_name: first,
    last_name: last,
    profile_picture: profile.profile_picture_url ?? null,
    bio: profile.bio ?? null,
    program: profile.program ?? null,
    distance: profile.distance ?? 0,
    is_online: profile.online ?? false,
    building: profile.location_context ?? null,
    latitude: Number.isFinite(Number(profile.latitude)) ? Number(profile.latitude) : null,
    longitude: Number.isFinite(Number(profile.longitude)) ? Number(profile.longitude) : null,
    age: yearsSince(profile.date_of_birth),
  };
}

/**
 * Location permission is requested HERE, on demand, and never on mount.
 *
 * A cold-start permission prompt is the single most common reason a user denies
 * location outright: they are asked before they have any idea what it is for.
 * The Nearby screen calls this only when the user taps to turn the feature on.
 */
export async function requestLocationPermission(): Promise<
  { granted: true } | { granted: false; canAskAgain: boolean }
> {
  const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
  if (status === Location.PermissionStatus.GRANTED) return { granted: true };
  return { granted: false, canAskAgain };
}

export async function getPermissionStatus() {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status === Location.PermissionStatus.GRANTED;
}

/** Reads the device position and pushes it to the server in one step. */
export async function publishCurrentLocation() {
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  await api.post("/geofencing/location", {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    // Expo may return null when the platform cannot estimate accuracy. The
    // API parses this value as a number; sending null becomes NaN and prevents
    // the location record that the subsequent nearby query depends on.
    accuracy: position.coords.accuracy ?? 50,
  });

  return position.coords;
}

export async function fetchNearby(radius: number) {
  const result = await request<{ count?: number; profiles?: ApiNearbyProfile[] }>(() =>
    api.get("/geofencing/nearby", { params: { radius } })
  );
  if (!result.success) return result;
  return { ...result, data: (result.data.profiles ?? []).map(adaptNearby) };
}

export function setIncognito(enabled: boolean) {
  return request(() => api.post("/geofencing/incognito", { enabled }));
}

export function setLocationSharing(enabled: boolean) {
  return request(() => api.post("/geofencing/location/toggle", { enabled }));
}
