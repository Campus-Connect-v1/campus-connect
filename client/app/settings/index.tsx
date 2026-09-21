import { router } from "expo-router";
import { Alert, ScrollView, View } from "react-native";

import { SettingsRow, SettingsShell } from "@/src/components/settings/SettingsPrimitives";
import { Text } from "@/src/components/ui";
import { useSession } from "@/src/services/SessionContext";
import { radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { signOut } = useSession();

  // Signing out drops the stored token, so it is confirmed rather than fired
  // on a single tap next to the other rows.
  const confirmLogout = () =>
    Alert.alert("Log out?", "You will need to sign in again to get back in.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: signOut },
    ]);

  return (
    <SettingsShell title="Settings">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }}
      >
        <View>
          <Text variant="micro" color="textMuted" style={{ paddingBottom: spacing.xs }}>
            YOUR ACCOUNT
          </Text>
          <View
            style={{ borderRadius: radius.md, backgroundColor: colors.surface, overflow: "hidden" }}
          >
            <SettingsRow
              title="Account"
              detail="Profile, email and university"
              icon="profile"
              onPress={() => router.push("/settings/account")}
            />
            <SettingsRow
              title="Privacy"
              detail="Visibility, location and safety"
              icon="privacy"
              onPress={() => router.push("/settings/privacy")}
            />
            <SettingsRow
              title="Notifications"
              detail="Choose what gets your attention"
              icon="notification"
              onPress={() => router.push("/settings/notifications")}
            />
            <SettingsRow
              title="Appearance"
              detail="Theme and accessibility"
              icon="appearance"
              onPress={() => router.push("/settings/appearance")}
            />
          </View>
        </View>

        <View>
          <Text variant="micro" color="textMuted" style={{ paddingBottom: spacing.xs }}>
            SUPPORT
          </Text>
          <View
            style={{ borderRadius: radius.md, backgroundColor: colors.surface, overflow: "hidden" }}
          >
            <SettingsRow
              title="Help and feedback"
              detail="Get support or share an idea"
              icon="help"
              onPress={() => router.push("/settings/help")}
            />
            <SettingsRow
              title="Privacy Policy"
              detail="What we collect and why"
              icon="privacy"
              onPress={() => router.push("/legal/privacy")}
            />
            <SettingsRow
              title="Terms of Service"
              detail="The rules for using Campus Connect"
              icon="course"
              onPress={() => router.push("/legal/terms")}
            />
            <SettingsRow title="About Campus Connect" detail="Version 1.0.0" icon="alert" />
          </View>
        </View>

        <View
          style={{ borderRadius: radius.md, backgroundColor: colors.surface, overflow: "hidden" }}
        >
          <SettingsRow title="Log out" icon="logout" destructive onPress={confirmLogout} />
        </View>
      </ScrollView>
    </SettingsShell>
  );
}
