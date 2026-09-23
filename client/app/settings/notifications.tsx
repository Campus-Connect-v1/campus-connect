import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";

import { SettingsShell, SettingsToggle } from "@/src/components/settings/SettingsPrimitives";
import { InlineNotice, Text } from "@/src/components/ui";
import { useOptimisticToggle } from "@/src/hooks/useOptimisticToggle";
import { useSession } from "@/src/services/SessionContext";
import {
  registerForPushNotificationsAsync,
  unregisterPushNotificationsAsync,
} from "@/src/services/notifications";
import { updateNotificationPreferences } from "@/src/services/settingsServices";
import { radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

/**
 * Two switches, because the users table has exactly two columns:
 * `notification_push` and `notification_email`.
 *
 * This screen previously offered four per-category switches (messages, events,
 * groups, suggestions). Nothing stored them and nothing read them, so they
 * were decoration that looked like control. Per-category delivery needs a
 * preferences table before it can be offered again.
 */
export default function NotificationSettingsScreen() {
  const { colors } = useTheme();
  const { profile, refresh } = useSession();

  const [pushNotice, setPushNotice] = useState<string | null>(null);

  /**
   * Turning push ON is the moment of intent, so the OS prompt happens here and
   * nowhere else. Registering the device token is the half that was missing:
   * the preference saved correctly, and the server had no device to send to.
   */
  const push = useOptimisticToggle(
    true,
    useCallback(
      async (next: boolean) => {
        setPushNotice(null);

        if (!next) {
          await unregisterPushNotificationsAsync();
          const result = await updateNotificationPreferences({ notification_push: false });
          if (result.success) await refresh();
          return result;
        }

        const outcome = await registerForPushNotificationsAsync();

        if (outcome === "denied") {
          // The switch must not claim push is on when the OS says otherwise.
          setPushNotice(
            "Notifications are switched off for Campus Connect in your device settings."
          );
          return { success: false as const, error: "" };
        }

        if (outcome === "unavailable") {
          setPushNotice(
            "This build cannot receive push yet. The preference is saved and will apply once it can."
          );
        } else if (outcome === "failed") {
          setPushNotice("Could not register this device. The preference is still saved.");
        }

        const result = await updateNotificationPreferences({ notification_push: true });
        if (result.success) await refresh();
        return result;
      },
      [refresh]
    )
  );

  const email = useOptimisticToggle(
    true,
    useCallback(
      async (next: boolean) => {
        const result = await updateNotificationPreferences({ notification_email: next });
        if (result.success) await refresh();
        return result;
      },
      [refresh]
    )
  );

  const { sync: syncPush } = push;
  const { sync: syncEmail } = email;

  useEffect(() => {
    if (!profile) return;
    const row = profile as unknown as {
      notification_push?: number | boolean;
      notification_email?: number | boolean;
    };
    syncPush(Boolean(row.notification_push ?? 1));
    syncEmail(Boolean(row.notification_email ?? 1));
  }, [profile, syncPush, syncEmail]);

  const error = push.error ?? email.error;

  return (
    <SettingsShell title="Notifications">
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}>
        <Text variant="body" color="textSecondary">
          Choose how Campus Connect reaches you.
        </Text>

        {error ? <InlineNotice message={error} /> : null}
        {pushNotice ? <InlineNotice message={pushNotice} /> : null}

        <View
          style={{ borderRadius: radius.md, backgroundColor: colors.surface, overflow: "hidden" }}
        >
          <SettingsToggle
            title="Push notifications"
            detail="Alerts on this device"
            value={push.value}
            onChange={push.toggle}
            disabled={push.busy}
          />
          <SettingsToggle
            title="Email notifications"
            detail="Sent to your campus email"
            value={email.value}
            onChange={email.toggle}
            disabled={email.busy}
          />
        </View>

        <Text variant="caption" color="textMuted">
          Per-topic controls arrive once the server stores them.
        </Text>
      </ScrollView>
    </SettingsShell>
  );
}
