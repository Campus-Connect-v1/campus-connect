import { useCallback, useEffect } from "react";
import { ScrollView, View } from "react-native";

import { SettingsShell, SettingsToggle } from "@/src/components/settings/SettingsPrimitives";
import { EmptyState, InlineNotice, Text } from "@/src/components/ui";
import { useAsync } from "@/src/hooks/useAsync";
import { useOptimisticToggle } from "@/src/hooks/useOptimisticToggle";
import { useSession } from "@/src/services/SessionContext";
import {
  audienceFor,
  fetchPrivacySettings,
  updatePrivacySettings,
  updateVisibilityPreferences,
} from "@/src/services/settingsServices";
import { radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

export default function PrivacySettingsScreen() {
  const { colors } = useTheme();
  const { profile, refresh } = useSession();

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

  const error = settings.error ?? discoverable.error ?? exactLocation.error ?? activity.error;

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
      </ScrollView>
    </SettingsShell>
  );
}
