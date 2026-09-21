import { api, request } from "./api";
import { updateProfile } from "./userServices";

/**
 * GET/PUT /geofencing/privacy — the `user_privacy_settings` row.
 *
 * `profile_visibility` is an enum, not a boolean: "geofenced" means visible to
 * people within `custom_radius`, "private" means visible to nobody. The
 * discovery toggle maps onto those two values rather than inventing a flag.
 */
export interface ApiPrivacySettings {
  profile_visibility: "public" | "geofenced" | "private" | "friends_only";
  custom_radius: number;
  show_exact_location: boolean | number;
  visible_fields: Record<string, boolean> | string | null;
}

export async function fetchPrivacySettings() {
  const result = await request<{ settings: ApiPrivacySettings }>(() =>
    api.get("/geofencing/privacy")
  );
  return result.success ? { ...result, data: result.data.settings } : result;
}

export async function updatePrivacySettings(patch: Partial<ApiPrivacySettings>) {
  const result = await request<{ settings: ApiPrivacySettings }>(() =>
    api.put("/geofencing/privacy", patch)
  );
  return result.success ? { ...result, data: result.data.settings } : result;
}

/**
 * Notification preferences live on the users row, not in a notifications table.
 *
 * The columns are exactly two — `notification_email` and `notification_push` —
 * so the settings screen offers exactly two switches. Per-category switches
 * (messages / events / groups) would have nowhere to persist and nothing
 * reading them, which is the defect this replaces.
 */
export function updateNotificationPreferences(patch: {
  notification_email?: boolean;
  notification_push?: boolean;
}) {
  return updateProfile(patch as never);
}

/**
 * Audience enums on the users row, NOT booleans.
 *
 * The server validates these against "friends" | "university" | "none" and
 * answers 400 for anything else, so a switch has to map onto a value rather
 * than send true/false. "university" is the on position: visible to the
 * campus, which is what the switch's label promises.
 */
export type VisibilityAudience = "friends" | "university" | "none";

export function audienceFor(enabled: boolean): VisibilityAudience {
  return enabled ? "university" : "none";
}

export function updateVisibilityPreferences(patch: {
  show_location_preference?: VisibilityAudience;
  show_status_preference?: VisibilityAudience;
}) {
  return updateProfile(patch as never);
}

/** Who can see the profile at all. Also an enum, also 400s on anything else. */
export type ProfileVisibility = "public" | "university" | "friends" | "private";

export function updateProfileVisibility(privacy_profile: ProfileVisibility) {
  return updateProfile({ privacy_profile } as never);
}
