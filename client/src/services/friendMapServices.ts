import { api, request } from "./api";

/**
 * How precisely a friend's position may be drawn.
 *
 * The server decides this, never the client: a friend three hundred kilometres
 * away has no business rendering as a street-level pin. "city" and "area" are
 * deliberately coarse, and the map draws them as a halo rather than a point so
 * the imprecision is visible rather than implied.
 */
export type LocationPrecision = "exact" | "area" | "city";

export interface ApiFriendLocation {
  user_id: string;
  first_name: string;
  last_name: string | null;
  profile_picture_url: string | null;
  university_id: string | null;
  latitude: number;
  longitude: number;
  precision: LocationPrecision;
  /** ISO. Drives the "2h ago" label and how faded the marker is. */
  last_seen: string;
  is_online: boolean;
  /** Whether they have an unexpired story, so the ring can say so. */
  has_story?: boolean;
  /** Human label for a coarse position, e.g. "Accra" or "Legon campus". */
  place_label?: string | null;
}

export interface FriendLocation {
  userId: string;
  name: string;
  avatar: string | null;
  universityId: string | null;
  latitude: number;
  longitude: number;
  precision: LocationPrecision;
  lastSeen: string;
  isOnline: boolean;
  hasStory: boolean;
  placeLabel: string | null;
}

function adapt(row: ApiFriendLocation): FriendLocation {
  return {
    userId: row.user_id,
    name: [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || "Someone",
    avatar: row.profile_picture_url ?? null,
    universityId: row.university_id ?? null,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    precision: row.precision ?? "city",
    lastSeen: row.last_seen,
    isOnline: Boolean(row.is_online),
    hasStory: Boolean(row.has_story),
    placeLabel: row.place_label ?? null,
  };
}

/**
 * Every accepted connection who is sharing location, at any distance.
 *
 * This is the one thing the radius query structurally cannot do:
 * `findNearbyUsers` is a `$near` with a `maxDistance`, so a friend outside it
 * is not merely filtered out, they are never found. A persistent friend map
 * needs its own read.
 *
 * The endpoint does not exist yet. Until it does this resolves to an empty
 * list rather than an error, so the map simply shows no far-away friends
 * instead of a failure the user cannot act on. See
 * BACKEND-REQUEST-3-friend-map.md.
 */
export async function fetchFriendLocations() {
  const result = await request<{ friends?: ApiFriendLocation[] }>(() =>
    api.get("/geofencing/friends")
  );

  if (!result.success) {
    // 404 while unimplemented, 501 if it is stubbed. Neither is worth
    // surfacing; any other failure is a real error the caller should see.
    if (result.status === 404 || result.status === 501) {
      return { success: true as const, data: [] as FriendLocation[] };
    }
    return result;
  }

  const rows = result.data.friends ?? [];
  return {
    ...result,
    data: rows
      .filter((row) => Number.isFinite(Number(row.latitude)) && Number.isFinite(Number(row.longitude)))
      .map(adapt),
  };
}
