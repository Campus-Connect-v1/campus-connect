import { View } from "react-native";

import { radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

import { Text } from "./Text";

export interface TagProps {
  label: string;
  /** Renders on top of photography: translucent fill, light text. */
  onMedia?: boolean;
}

/** Pill, always. Used for interests, course codes and post topics. */
export function Tag({ label, onMedia }: TagProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs - 2,
        borderRadius: radius.full,
        backgroundColor: onMedia ? "rgba(255,255,255,0.18)" : colors.surface,
        borderWidth: onMedia ? 0 : 1,
        borderColor: colors.border,
      }}
    >
      <Text variant="caption" color="textSecondary" onMedia={onMedia}>
        {label}
      </Text>
    </View>
  );
}
