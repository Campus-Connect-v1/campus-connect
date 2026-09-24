import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";

import { SettingsShell, SettingsToggle } from "@/src/components/settings/SettingsPrimitives";
import { InlineNotice, Text } from "@/src/components/ui";
import { useOptimisticToggle } from "@/src/hooks/useOptimisticToggle";
import {
  getPushStatus,
  PUSH_STATUS_COPY,
  type PushStatus,
} from "@/src/services/notifications";
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

  /**
   * Whether this device can actually receive a push.
   *
   * The preference switch says what the user WANTS; this says what the device
   * can do. They are different questions, and conflating them is why "push is
   * on" could sit above a device that had never been issued a token -- most
   * often because it is a simulator, which Expo will not issue one to.
   */
  const [pushStatus, setPushStatus] = useState<PushStatus | null>(null);
  useEffect(() => {
    void getPushStatus().then(setPushStatus);
  }, []);
  const [pushNotice, setPushNotice] = useState<string | null>(null);
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

        {/* What the DEVICE can do, as opposed to what the user has asked for
            above. Without it, "push on" could sit over a device that was never
            issued a token -- most often a simulator, which Expo refuses. */}
        {pushStatus ? (
          pushStatus === "active" ? (
            <InlineNotice tone="success" message={PUSH_STATUS_COPY[pushStatus]} />
          ) : (
            <View
              style={{
                marginTop: spacing.sm,
                padding: spacing.md,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surfaceSunken,
              }}
            >
              <Text variant="caption" color="textMuted">
                {PUSH_STATUS_COPY[pushStatus]}
              </Text>
            </View>
          )
        ) : null}

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
