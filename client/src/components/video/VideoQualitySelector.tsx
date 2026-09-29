import { View } from "react-native";

import { PressableScale, Text } from "@/src/components/ui";
import { videoUploadConfig, type VideoQualityId } from "@/src/features/video/config";
import { radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

interface VideoQualitySelectorProps {
  quality: VideoQualityId;
  onChange: (quality: VideoQualityId) => void;
}

/** Reads its options from `videoUploadConfig.qualities` -- adding an "HD+"
 * tier later is a config change, not a change to this component. */
export function VideoQualitySelector({ quality, onChange }: VideoQualitySelectorProps) {
  const { colors } = useTheme();

  return (
    <View style={{ gap: spacing.sm }}>
      {videoUploadConfig.qualities.map((preset) => {
        const active = preset.id === quality;
        return (
          <PressableScale
            key={preset.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            accessibilityLabel={`${preset.label}. ${preset.detail}`}
            onPress={() => onChange(preset.id)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              minHeight: 56,
              paddingHorizontal: spacing.md,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: active ? colors.textPrimary : colors.border,
              backgroundColor: active ? colors.surface : "transparent",
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: radius.full,
                borderWidth: 2,
                borderColor: active ? colors.textPrimary : colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {active ? (
                <View style={{ width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.textPrimary }} />
              ) : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="body">{preset.label}</Text>
              <Text variant="caption" color="textMuted">
                {preset.detail}
              </Text>
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}
