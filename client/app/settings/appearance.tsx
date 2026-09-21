import * as Haptics from "expo-haptics";
import { ScrollView, View } from "react-native";

import { SettingsShell } from "@/src/components/settings/SettingsPrimitives";
import { PressableScale, Text } from "@/src/components/ui";
import { usePreferences, type ThemePreference } from "@/src/services/PreferencesContext";
import { culture, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export default function AppearanceSettingsScreen() {
  const { colors } = useTheme();
  const { theme, setTheme } = usePreferences();

  return (
    <SettingsShell title="Appearance">
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <Text variant="body" color="textSecondary">
          Choose how Campus Connect looks on this device.
        </Text>
        <View accessibilityRole="radiogroup" style={{ flexDirection: "row", gap: spacing.sm }}>
          {OPTIONS.map((option) => {
            const active = option.value === theme;
            return (
              <PressableScale
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                accessibilityLabel={`${option.label} appearance`}
                onPress={() => {
                  Haptics.selectionAsync();
                  setTheme(option.value);
                }}
                style={{
                  flex: 1,
                  minHeight: 96,
                  borderRadius: radius.md,
                  backgroundColor: active ? culture.lime : colors.surface,
                  borderWidth: 1,
                  borderColor: active ? culture.lime : colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text variant="label" style={active ? { color: culture.ink } : undefined}>
                  {option.label}
                </Text>
              </PressableScale>
            );
          })}
        </View>
        <Text variant="caption" color="textMuted">
          Saved on this device. Signing in elsewhere keeps that device&apos;s own choice.
        </Text>
      </ScrollView>
    </SettingsShell>
  );
}
