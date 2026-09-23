import { router } from "expo-router";
import { Switch, View } from "react-native";

import { Icon, PressableScale, Screen, Text, type IconName } from "@/src/components/ui";
import { culture, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

export function SettingsShell({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();

  return (
    <Screen edges={{ bottom: true }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.lg,
        }}
      >
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
        >
          <Icon name="back" size={21} color={colors.textPrimary} />
        </PressableScale>
        <Text variant="title" style={{ flex: 1, textAlign: "center" }}>
          {title}
        </Text>
        <View style={{ width: 44 }} />
      </View>
      {children}
    </Screen>
  );
}

export function SettingsRow({
  title,
  detail,
  icon,
  onPress,
  destructive,
  badge,
}: {
  title: string;
  detail?: string;
  icon: IconName;
  onPress?: () => void;
  destructive?: boolean;
  /** A count of things waiting here. Omitted or 0 renders nothing. */
  badge?: number;
}) {
  const { colors } = useTheme();
  const tint = destructive ? colors.destructive : colors.textPrimary;
  const waiting = badge && badge > 0 ? badge : 0;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={waiting ? `${title}, ${waiting} waiting` : title}
      onPress={onPress}
      style={{
        minHeight: 66,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingHorizontal: spacing.md,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: radius.full,
          backgroundColor: colors.surfaceSunken,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={icon} size={19} color={tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="body" style={{ color: tint }}>
          {title}
        </Text>
        {detail ? (
          <Text variant="caption" color="textMuted">
            {detail}
          </Text>
        ) : null}
      </View>
      {/* A count here, unlike the tab bar dot: this is where the user is
          deciding whether the trip is worth it. */}
      {waiting ? (
        <View
          style={{
            minWidth: 22,
            height: 22,
            paddingHorizontal: 6,
            borderRadius: radius.full,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: culture.pink,
          }}
        >
          <Text variant="caption" style={{ color: culture.warmWhite, fontSize: 11 }}>
            {waiting > 9 ? "9+" : waiting}
          </Text>
        </View>
      ) : null}

      {onPress ? <Icon name="forward" size={17} color={colors.textMuted} /> : null}
    </PressableScale>
  );
}

export function SettingsToggle({
  title,
  detail,
  value,
  onChange,
  disabled = false,
}: {
  title: string;
  detail: string;
  value: boolean;
  onChange: (value: boolean) => void;
  /** Set while the settings row is still loading its real value. */
  disabled?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        minHeight: 76,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingHorizontal: spacing.md,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text variant="body">{title}</Text>
        <Text variant="caption" color="textMuted">
          {detail}
        </Text>
      </View>
      <Switch
        accessibilityLabel={title}
        accessibilityState={{ disabled }}
        disabled={disabled}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.borderStrong, true: culture.lime }}
        thumbColor={culture.ink}
        style={{ opacity: disabled ? 0.5 : 1 }}
      />
    </View>
  );
}
