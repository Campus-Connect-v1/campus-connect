import * as DocumentPicker from "expo-document-picker";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from "react-native-reanimated";

import { Icon, PressableScale, Text } from "@/src/components/ui";
import { videoUploadConfig } from "@/src/features/video/config";
import { clamp } from "@/src/features/video/utils/media";
import type { AudioState } from "@/src/features/video/types";
import { radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

interface VideoAudioEditorProps {
  audio: AudioState;
  onMuteChange: (muted: boolean) => void;
  onTrackAdded: (track: NonNullable<AudioState["track"]>) => void;
  onTrackRemoved: () => void;
  onVolumeChange: (volume: number) => void;
}

/**
 * Mute + one music track, with the AudioEngine abstraction (`editor/audio.ts`)
 * doing the actual mapping to Cloudinary parameters. There is no in-app
 * licensed music catalog in this project, so "add audio" picks a file the
 * user already has -- the track shape carries everything a real catalog
 * integration would need (`uri`, `name`, `durationMs`, `volume`), so wiring
 * one in later replaces only the picker call below.
 */
export function VideoAudioEditor({
  audio,
  onMuteChange,
  onTrackAdded,
  onTrackRemoved,
  onVolumeChange,
}: VideoAudioEditorProps) {
  const { colors } = useTheme();

  const pickTrack = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "audio/*", copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    onTrackAdded({
      uri: asset.uri,
      name: asset.name,
      durationMs: null,
      volume: videoUploadConfig.audio.defaultVolume,
    });
  };

  return (
    <View style={{ gap: spacing.md }}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={audio.originalMuted ? "Unmute original audio" : "Mute original audio"}
        accessibilityState={{ selected: audio.originalMuted }}
        onPress={() => onMuteChange(!audio.originalMuted)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          minHeight: 56,
          paddingHorizontal: spacing.md,
          borderRadius: radius.md,
          backgroundColor: colors.surface,
        }}
      >
        <Icon name={audio.originalMuted ? "mute" : "volume"} size={18} color={colors.textPrimary} />
        <View style={{ flex: 1 }}>
          <Text variant="body">Original audio</Text>
          <Text variant="caption" color="textMuted">
            {audio.originalMuted ? "Muted" : "Playing"}
          </Text>
        </View>
        <View
          style={{
            width: 44,
            height: 26,
            borderRadius: radius.full,
            backgroundColor: audio.originalMuted ? colors.border : colors.accent,
            padding: 3,
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: radius.full,
              backgroundColor: colors.background,
              alignSelf: audio.originalMuted ? "flex-start" : "flex-end",
            }}
          />
        </View>
      </PressableScale>

      {audio.track ? (
        <View style={{ gap: spacing.sm }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              minHeight: 56,
              paddingHorizontal: spacing.md,
              borderRadius: radius.md,
              backgroundColor: colors.surface,
            }}
          >
            <Icon name="video" size={18} color={colors.textPrimary} />
            <Text variant="body" style={{ flex: 1 }} numberOfLines={1}>
              {audio.track.name}
            </Text>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Remove audio track"
              onPress={onTrackRemoved}
              style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}
            >
              <Icon name="close" size={16} color={colors.textMuted} />
            </PressableScale>
          </View>

          <VolumeBar volume={audio.track.volume} onChange={onVolumeChange} />

          {audio.originalMuted ? null : (
            <Text variant="caption" color="textMuted">
              Adding a track mutes the original audio, so what you hear here is what&apos;s uploaded.
            </Text>
          )}
        </View>
      ) : (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Add a music track"
          onPress={pickTrack}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.xs,
            minHeight: 48,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            borderStyle: "dashed",
          }}
        >
          <Icon name="add" size={16} color={colors.textSecondary} />
          <Text variant="label" color="textSecondary">
            Add a music track
          </Text>
        </PressableScale>
      )}
    </View>
  );
}

function VolumeBar({ volume, onChange }: { volume: number; onChange: (volume: number) => void }) {
  const { colors } = useTheme();
  const trackWidth = 260;
  const fill = useSharedValue(clamp(volume, 0, 1) * trackWidth);
  const start = useSharedValue(0);

  const pan = Gesture.Pan()
    .onBegin(() => {
      start.value = fill.value;
    })
    .onUpdate((event) => {
      // Inlined rather than calling the imported `clamp` -- calling a
      // function from another file inside a worklet isn't reliably safe
      // even when that function carries a `'worklet'` directive at its own
      // definition, and threw at runtime here.
      "worklet";
      fill.value = Math.min(Math.max(start.value + event.translationX, 0), trackWidth);
    })
    // `onChange` is a prop -- calling it directly from this worklet
    // callback ran it on the UI thread and crashed the app when the drag
    // ended, rather than raising a catchable JS error.
    .onEnd(() => {
      "worklet";
      runOnJS(onChange)(fill.value / trackWidth);
    });

  const fillStyle = useAnimatedStyle(() => ({ width: fill.value }));

  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="caption" color="textMuted">
        Track volume
      </Text>
      <GestureDetector gesture={pan}>
        <View style={{ width: trackWidth, height: 32, justifyContent: "center" }}>
          <View
            style={{
              height: 6,
              borderRadius: radius.full,
              backgroundColor: colors.surfaceSunken,
            }}
          />
          <Animated.View
            style={[
              { position: "absolute", height: 6, borderRadius: radius.full, backgroundColor: colors.accent },
              fillStyle,
            ]}
          />
        </View>
      </GestureDetector>
    </View>
  );
}
