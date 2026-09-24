import { Image } from "expo-image";
import { View } from "react-native";

import { radius } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

export interface AvatarProps {
  uri?: string;
  size?: number;
  /** Draws the accent ring used for unseen stories and active members. */
  ring?: boolean;
  /**
   * Overrides the ring colour, for a campus ring drawn in the university's own
   * brand colour. Pass it already contrast-corrected (see `readableOn`).
   */
  ringColor?: string;
  /** Thinner for the viewer's own campus, so a visitor's ring reads louder. */
  ringWidth?: number;
}

export function Avatar({ uri, size = 40, ring = false, ringColor, ringWidth = 2 }: AvatarProps) {
  const { colors } = useTheme();
  const width = ring ? ringWidth : 0;
  // The gap between ring and photo scales with the ring, so a heavier ring
  // does not sit flush against the image.
  const inner = ring ? size - (width + 1) * 2 : size;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.full,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: width,
        borderColor: ringColor ?? colors.accent,
      }}
    >
      <Image
        source={uri}
        contentFit="cover"
        transition={180}
        style={{
          width: inner,
          height: inner,
          borderRadius: radius.full,
          backgroundColor: colors.surfaceSunken,
        }}
      />
    </View>
  );
}
