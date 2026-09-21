import { View } from "react-native";

import { radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

import { Icon } from "./Icon";
import { Text } from "./Text";

export interface InlineNoticeProps {
  message: string;
  tone?: "error" | "success";
}

/**
 * `assertive` is right for an error the user must act on, but a success
 * confirmation interrupting a screen reader mid-sentence is not — so the live
 * region politeness follows the tone.
 */
export function InlineNotice({ message, tone = "error" }: InlineNoticeProps) {
  const { colors } = useTheme();
  const accent = tone === "success" ? colors.success : colors.destructive;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion={tone === "success" ? "polite" : "assertive"}
      style={{
        minHeight: 52,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.sm,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: accent,
        backgroundColor: colors.surfaceSunken,
        padding: spacing.md,
      }}
    >
      <Icon
        name={tone === "success" ? "check" : "alert"}
        size={19}
        color={accent}
        strokeWidth={2}
      />
      <Text
        selectable
        variant="caption"
        color={tone === "success" ? "success" : "destructive"}
        style={{ flex: 1 }}
      >
        {message}
      </Text>
    </View>
  );
}
