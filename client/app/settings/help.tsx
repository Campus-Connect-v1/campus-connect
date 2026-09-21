import { ScrollView, View } from "react-native";

import { SettingsRow, SettingsShell } from "@/src/components/settings/SettingsPrimitives";
import { Text } from "@/src/components/ui";
import { culture, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

export default function HelpScreen() {
  const { colors } = useTheme();
  return (
    <SettingsShell title="Help">
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }}>
        <View
          style={{
            borderRadius: radius.lg,
            backgroundColor: culture.lime,
            padding: spacing.lg,
            gap: spacing.sm,
          }}
        >
          <Text variant="title" style={{ color: culture.ink }}>
            Need a hand?
          </Text>
          <Text variant="body" style={{ color: culture.ink }}>
            Find an answer or tell us what is getting in your way.
          </Text>
        </View>
        <View
          style={{ borderRadius: radius.md, backgroundColor: colors.surface, overflow: "hidden" }}
        >
          <SettingsRow title="Help centre" detail="Guides and common questions" icon="help" />
          <SettingsRow title="Report a problem" detail="Something is not working" icon="alert" />
          <SettingsRow title="Send feedback" detail="Help shape Campus Connect" icon="message" />
          <SettingsRow
            title="Safety centre"
            detail="Blocking, reporting and support"
            icon="privacy"
          />
        </View>
      </ScrollView>
    </SettingsShell>
  );
}
