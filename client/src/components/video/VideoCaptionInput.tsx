import { TextInput } from "react-native";

import { inputTextStyle, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

interface VideoCaptionInputProps {
  value: string;
  onChange: (caption: string) => void;
}

/**
 * The caption is metadata, not pixels: it is stored on `VideoEditorState`
 * (and later `VideoMetadataRecord`) and shown by whatever screen renders the
 * finished post -- it is never burned into the video, per section 4E's
 * "metadata/overlay handling where possible" ("Do add text ON the video" is
 * a separate, distinct feature: `VideoTextEditor` + `OverlayLayer`).
 */
export function VideoCaptionInput({ value, onChange }: VideoCaptionInputProps) {
  const { colors } = useTheme();

  return (
    <TextInput
      accessibilityLabel="Caption"
      placeholder="Write a caption…"
      placeholderTextColor={colors.textMuted}
      multiline
      autoCapitalize="sentences"
      value={value}
      onChangeText={onChange}
      style={{
        minHeight: 80,
        borderRadius: radius.md,
        backgroundColor: colors.surface,
        color: colors.textPrimary,
        ...inputTextStyle(true),
        padding: spacing.md,
        textAlignVertical: "top",
      }}
    />
  );
}
