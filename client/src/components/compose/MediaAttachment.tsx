import { useEvent } from "expo";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { forwardRef, useImperativeHandle } from "react";
import { StyleSheet, View } from "react-native";

import { Icon, Loader, PressableScale, Text } from "@/src/components/ui";
import type { PickedMedia } from "@/src/services/media";
import { radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

export interface MediaAttachmentHandle {
  /** Pauses video playback, if a video is attached and currently playing. No-op for a photo. */
  pause: () => void;
}

interface Props {
  media: PickedMedia;
  onRemove: () => void;
}

/**
 * The video half of MediaAttachment.
 *
 * A real player, not a static frame: expo-video is already proven in
 * app/stories/[userId].tsx for the same job. Stories turns native controls
 * off because it draws its own progress bar; this is the opposite case — the
 * composer wants exactly what native controls give for free (play/pause,
 * scrubber, duration), so there is no custom transport UI to build.
 *
 * useVideoPlayer recreates the player when `uri` changes and disposes the
 * previous one, which is exactly "swap video, forget the old one" — nothing
 * extra needed for that here.
 */
const VideoAttachment = forwardRef<MediaAttachmentHandle, { uri: string; ratio: number }>(
  function VideoAttachment({ uri, ratio }, ref) {
    const { colors } = useTheme();

    const player = useVideoPlayer(uri, (instance) => {
      instance.loop = false;
      // Deliberately no instance.play() — the composer shows a paused poster
      // frame with a play control, never autoplays what was just picked.
    });

    const { status } = useEvent(player, "statusChange", { status: player.status });

    useImperativeHandle(ref, () => ({ pause: () => player.pause() }), [player]);

    return (
      <View style={{ width: "100%", aspectRatio: ratio, backgroundColor: "#000" }}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFillObject}
          contentFit="contain"
          nativeControls
          accessibilityLabel="Selected video"
        />

        {status === "loading" || status === "idle" ? (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              { alignItems: "center", justifyContent: "center" },
            ]}
          >
            <Loader size={28} color={colors.onMedia} />
          </View>
        ) : null}

        {status === "error" ? (
          <View
            style={[
              StyleSheet.absoluteFillObject,
              {
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(7,18,25,0.85)",
                paddingHorizontal: spacing.lg,
              },
            ]}
          >
            <Text variant="caption" onMedia style={{ textAlign: "center" }}>
              Unable to preview this video
            </Text>
          </View>
        ) : null}
      </View>
    );
  }
);

/**
 * The picked file, shown at its real aspect with a remove control.
 *
 * Images render through expo-image, same as always. Videos get a real
 * player (see VideoAttachment above) instead of expo-image trying — and
 * failing — to decode a frame from a video file, which is what produced the
 * black box this component used to leave behind.
 */
export const MediaAttachment = forwardRef<MediaAttachmentHandle, Props>(function MediaAttachment(
  { media, onRemove },
  ref
) {
  const { colors } = useTheme();
  const ratio = media.width && media.height ? media.width / media.height : 1;
  // Clamped so a panorama or a very tall screenshot cannot push the publish
  // button off the screen.
  const clampedRatio = Math.max(0.6, Math.min(ratio, 1.8));

  return (
    <View
      style={{ borderRadius: radius.md, overflow: "hidden", backgroundColor: colors.surfaceSunken }}
    >
      {media.kind === "video" ? (
        <VideoAttachment ref={ref} uri={media.uri} ratio={clampedRatio} />
      ) : (
        <Image
          source={media.uri}
          contentFit="cover"
          accessibilityLabel="Selected photo"
          style={{ width: "100%", aspectRatio: clampedRatio }}
        />
      )}

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
    </View>
  );
});
