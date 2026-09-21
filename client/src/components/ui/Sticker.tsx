import { View, type ViewStyle } from "react-native";

import { foregroundOn, radius, spacing } from "@/src/styles/theme";

import { Text } from "./Text";

interface StickerProps {
  label: string;
  backgroundColor: string;
  /**
   * Overrides the automatic foreground. Rarely needed: the default is derived
   * from `backgroundColor` and is the one that actually contrasts with it.
   */
  color?: string;
  rotation?: number;
  style?: ViewStyle;
}

/**
 * A controlled hit of campaign language, reserved for editorial media.
 *
 * The label colour comes from the BACKGROUND, not from the theme. A sticker
 * sits on a fixed `culture` hue that is identical in both modes, so a
 * theme-driven `textPrimary` turns white in dark mode and vanishes on lime,
 * yellow and pink.
 */
export function Sticker({ label, backgroundColor, color, rotation = -3, style }: StickerProps) {
  const foreground = color ?? foregroundOn(backgroundColor);

  return (
    <View
      style={[
        {
          alignSelf: "flex-start",
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: radius.sm,
          backgroundColor,
          transform: [{ rotate: `${rotation}deg` }],
        },
        style,
      ]}
    >
      <Text variant="micro" style={{ color: foreground }}>
        {label}
      </Text>
    </View>
  );
}
