import { Image } from "expo-image";
import { View } from "react-native";

import { radius } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

export interface AvatarProps {
  uri?: string;
  size?: number;
  /** Draws the accent ring used for unseen stories and active members. */
  ring?: boolean;
}

export function Avatar({ uri, size = 40, ring = false }: AvatarProps) {
  const { colors } = useTheme();
  const inner = ring ? size - 6 : size;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.full,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: ring ? 2 : 0,
        borderColor: colors.accent,
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
