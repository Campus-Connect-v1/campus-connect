import { View } from "react-native";

import { Button, Text } from "@/src/components/ui";
import { formatFileSize } from "@/src/features/video/utils/formatting";
import type { UploadStage, VideoUploadProgress as Progress } from "@/src/features/video/types";
import { radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

const STAGE_LABEL: Partial<Record<UploadStage, string>> = {
  processing: "Preparing…",
  generating_thumbnail: "Generating thumbnail…",
  uploading: "Uploading video…",
  verifying: "Finishing up…",
};

interface VideoUploadProgressProps {
  stage: UploadStage;
  progress: Progress | null;
  onCancel: () => void;
}

export function VideoUploadProgress({ stage, progress, onCancel }: VideoUploadProgressProps) {
  const { colors } = useTheme();
  const label = STAGE_LABEL[stage] ?? "Working…";
  const fraction = stage === "uploading" ? (progress?.fraction ?? 0) : null;

  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="label">{label}</Text>

      <View style={{ height: 8, borderRadius: radius.full, backgroundColor: colors.surfaceSunken, overflow: "hidden" }}>
        <View
          style={{
            height: "100%",
            width: fraction !== null ? `${Math.round(fraction * 100)}%` : "100%",
            borderRadius: radius.full,
            backgroundColor: colors.accent,
            opacity: fraction === null ? 0.4 : 1,
          }}
        />
      </View>

      {fraction !== null && progress ? (
        <Text variant="caption" color="textMuted">
          {formatFileSize(progress.bytesSent)} / {formatFileSize(progress.bytesTotal)} ·{" "}
          {Math.round(fraction * 100)}%
        </Text>
      ) : null}

      <Button label="Cancel" variant="secondary" onPress={onCancel} />
    </View>
  );
}
