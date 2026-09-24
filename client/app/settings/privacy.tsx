import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";

import { SettingsShell, SettingsToggle } from "@/src/components/settings/SettingsPrimitives";
import { EmptyState, Icon, InlineNotice, PressableScale, Text } from "@/src/components/ui";
import { useAsync } from "@/src/hooks/useAsync";
import { useOptimisticToggle } from "@/src/hooks/useOptimisticToggle";
import { useLocationSharing } from "@/src/services/LocationSharingContext";
import { useSession } from "@/src/services/SessionContext";
import {
  audienceFor,
  fetchPrivacySettings,
  updatePrivacySettings,
  updateProfileVisibility,
  updateVisibilityPreferences,
  type ProfileVisibility,
} from "@/src/services/settingsServices";
import { radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

/**
 * An enum, so a switch cannot express it: "university" and "friends" are both
 * "on" in a way a boolean would flatten.
 */
const VISIBILITY: { value: ProfileVisibility; label: string; detail: string }[] = [
  { value: "public", label: "Everyone", detail: "Any Campus Connect user can see you" },
  { value: "university", label: "My campus", detail: "Only students at your university" },
  { value: "friends", label: "Connections", detail: "Only people you have accepted" },
  { value: "private", label: "Nobody", detail: "You will not appear in discovery at all" },
];

export default function PrivacySettingsScreen() {
  const { colors } = useTheme();
  const { profile, refresh } = useSession();
  // Shared with Ghost Mode on the map: the two write the same server field, so
  // they must not hold separate ideas of its value.
  const locationSharing = useLocationSharing();

  const settings = useAsync(
    useCallback(() => fetchPrivacySettings(), []),
    []
  );

  // "Discoverable" is `profile_visibility`, which is an enum rather than a
  // flag: geofenced means "visible to people nearby", private means nobody.
  const discoverable = useOptimisticToggle(
    true,
    useCallback(
      (next: boolean) =>
        updatePrivacySettings({ profile_visibility: next ? "geofenced" : "private" }),
      []
    )
  );

  const exactLocation = useOptimisticToggle(
    false,
    useCallback((next: boolean) => updatePrivacySettings({ show_exact_location: next }), [])
  );

  const activity = useOptimisticToggle(
    true,
    useCallback(
      async (next: boolean) => {
        const result = await updateVisibilityPreferences({
          show_status_preference: audienceFor(next),
        });
        if (result.success) await refresh();
        return result;
      },
      [refresh]
    )
  );

  const { sync: syncDiscoverable } = discoverable;
  const { sync: syncExact } = exactLocation;
  const { sync: syncActivity } = activity;

  useEffect(() => {
    if (!settings.data) return;
    syncDiscoverable(settings.data.profile_visibility !== "private");
    syncExact(Boolean(Number(settings.data.show_exact_location)));
  }, [settings.data, syncDiscoverable, syncExact]);

  useEffect(() => {
    if (!profile) return;
    // The column is an audience enum; anything other than "none" is on.
    const value = profile?.show_status_preference;
    syncActivity(value !== "none");
  }, [profile, syncActivity]);

  const [visibility, setVisibility] = useState<ProfileVisibility>("university");
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);

  useEffect(() => {
    const current = (profile as { privacy_profile?: ProfileVisibility })?.privacy_profile;
    if (current) setVisibility(current);
  }, [profile]);

  const setProfileVisibility = async (next: ProfileVisibility) => {
    if (savingVisibility || next === visibility) return;

    const previous = visibility;
    Haptics.selectionAsync();
    setVisibility(next);
    setSavingVisibility(true);
    setVisibilityError(null);

    const result = await updateProfileVisibility(next);
    setSavingVisibility(false);

    if (!result.success) {
      // Reverted: a privacy control that shows a setting the server rejected
      // is the worst kind of wrong.
      setVisibility(previous);
      setVisibilityError(result.error);
      return;
    }
    await refresh();
  };

  const error =
    settings.error ??
    discoverable.error ??
    exactLocation.error ??
    activity.error ??
    visibilityError;

  return (
    <SettingsShell title="Privacy">
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}>
        <Text variant="body" color="textSecondary">
          Control what other students can see. Location is only used while Campus Connect is open.
        </Text>

        {error ? <InlineNotice message={error} /> : null}

        {settings.loading ? (
          <EmptyState.Loading compact />
        ) : (
          <View
            style={{ borderRadius: radius.md, backgroundColor: colors.surface, overflow: "hidden" }}
          >
            <SettingsToggle
              title="Appear in people discovery"
              detail="Let students around campus find you"
              value={discoverable.value}
              onChange={discoverable.toggle}
              disabled={discoverable.busy}
            />
            <SettingsToggle
              title="Share my location"
              detail="Off removes you from the map and from nearby entirely"
              value={locationSharing.sharing}
              onChange={(next) => void locationSharing.setSharing(next)}
            />
            <SettingsToggle
              title="Show exact location"
              detail="Off means others only see an approximate distance"
              value={exactLocation.value}
              onChange={exactLocation.toggle}
              disabled={exactLocation.busy}
            />
            <SettingsToggle
              title="Activity status"
              detail="Show when you are active on campus"
              value={activity.value}
              onChange={activity.toggle}
              disabled={activity.busy}
            />
          </View>
        )}
        <View style={{ gap: spacing.xs, paddingTop: spacing.md }}>
          <Text variant="micro" color="textMuted">
            WHO CAN SEE YOUR PROFILE
          </Text>
          {VISIBILITY.map((option) => {
            const active = option.value === visibility;
            return (
              <PressableScale
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                accessibilityLabel={`${option.label}. ${option.detail}`}
                onPress={() => setProfileVisibility(option.value)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.md,
                  minHeight: 60,
                  paddingHorizontal: spacing.md,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: active ? colors.textPrimary : colors.border,
                  backgroundColor: active ? colors.surface : "transparent",
                  opacity: savingVisibility ? 0.6 : 1,
                }}
              >
                <Icon
                  name={active ? "check" : "visible"}
                  size={18}
                  color={active ? colors.textPrimary : colors.textMuted}
                />
                <View style={{ flex: 1 }}>
                  <Text variant="body">{option.label}</Text>
                  <Text variant="caption" color="textMuted">
                    {option.detail}
                  </Text>
                </View>
              </PressableScale>
            );
          })}
        </View>
      </ScrollView>
    </SettingsShell>
  );
}
