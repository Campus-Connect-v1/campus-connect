import { useVideoPlayer, VideoView } from "expo-video";
import { View } from "react-native";

import { Button, Text } from "@/src/components/ui";
import type { SourceVideo, VideoValidationError } from "@/src/features/video/types";
import { formatDuration, formatFileSize, formatResolution } from "@/src/features/video/utils/formatting";
import { radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

interface VideoPreviewProps {
  video: SourceVideo;
  error: VideoValidationError;
  onDiscard: () => void;
}

/**
 * Shown only when a picked/recorded video fails validation (too long, too
 * large, unsupported format) -- a valid one goes straight into `VideoEditor`
 * with no intermediate stop. This screen's whole job is explaining why this
 * one can't be edited and offering a way out, since there is nowhere
 * forward to send it.
 */
export function VideoPreview({ video, error, onDiscard }: VideoPreviewProps) {
  const player = useVideoPlayer(video.uri, (instance) => {
    instance.loop = true;
    instance.play();
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="title">Can&apos;t use this video</Text>

      <View style={{ borderRadius: radius.lg, overflow: "hidden", backgroundColor: "#000" }}>
        <VideoView player={player} style={{ width: "100%", height: 400 }} contentFit="contain" nativeControls />
      </View>

      <View style={{ gap: spacing["2xs"] }}>
        <Row label="Duration" value={formatDuration(video.durationMs)} />
        <Row label="Resolution" value={formatResolution(video.width, video.height)} />
        <Row label="Size" value={formatFileSize(video.fileSizeBytes)} />
      </View>

      <Text variant="caption" color="destructive">
        {error.message}
      </Text>

      <Button label="Discard" variant="secondary" onPress={onDiscard} />
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
      <Text variant="label" style={{ color: colors.textPrimary }}>
        {value}
      </Text>
    </View>
  );
}
