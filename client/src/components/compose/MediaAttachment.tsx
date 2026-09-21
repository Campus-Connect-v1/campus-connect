import { Image } from "expo-image";
import { View } from "react-native";

import { Icon, PressableScale, Text } from "@/src/components/ui";
import type { PickedMedia } from "@/src/services/media";
import { culture, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

/** expo-image-picker reports video duration in milliseconds. */
function clock(ms?: number | null) {
  if (!ms) return null;
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * The picked file, shown at its real aspect with a remove control.
 *
 * Videos get a play badge and their length rather than an inline player: this
 * is a composer, and autoplaying the thing you just picked is noise.
 */
export function MediaAttachment({ media, onRemove }: { media: PickedMedia; onRemove: () => void }) {
  const { colors } = useTheme();
  const ratio = media.width && media.height ? media.width / media.height : 1;

  return (
    <View
      style={{ borderRadius: radius.md, overflow: "hidden", backgroundColor: colors.surfaceSunken }}
    >
      <Image
        source={media.uri}
        contentFit="cover"
        accessibilityLabel={media.kind === "video" ? "Selected video" : "Selected photo"}
        // Clamped so a panorama or a very tall screenshot cannot push the
        // publish button off the screen.
        style={{ width: "100%", aspectRatio: Math.max(0.6, Math.min(ratio, 1.8)) }}
      />

      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Remove attachment"
        onPress={onRemove}
        style={{
          position: "absolute",
          top: spacing.xs,
          right: spacing.xs,
          width: 36,
          height: 36,
          borderRadius: radius.full,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(7,18,25,0.62)",
        }}
      >
        <Icon name="close" size={17} color={colors.onMedia} />
      </PressableScale>

      {media.kind === "video" ? (
        <View
          style={{
            position: "absolute",
            left: spacing.xs,
            bottom: spacing.xs,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing["2xs"],
            paddingHorizontal: spacing.xs,
            paddingVertical: 4,
            borderRadius: radius.full,
            backgroundColor: "rgba(7,18,25,0.62)",
          }}
        >
          <Icon name="play" size={12} color={culture.warmWhite} />
          <Text variant="caption" onMedia>
            {clock(media.duration) ?? "Video"}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
