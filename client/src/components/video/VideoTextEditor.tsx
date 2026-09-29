import { useState } from "react";
import { TextInput, View } from "react-native";

import { Button, Icon, PressableScale, Text } from "@/src/components/ui";
import { videoUploadConfig } from "@/src/features/video/config";
import type { TextOverlay } from "@/src/features/video/types";
import { inputTextStyle, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

interface VideoTextEditorProps {
  /** The overlay being edited, or null when adding a new one. */
  editing: TextOverlay | null;
  onSubmit: (text: string, color: string, fontSize: number) => void;
  onDelete: () => void;
  onCancel: () => void;
}

/**
 * Adds or edits ONE text overlay's content and style. Where it lands on the
 * video, and how it's moved/resized/rotated afterward, is `OverlayLayer`'s
 * job (via drag/pinch/rotate gestures) -- this component only ever produces
 * text + color + size, never a position.
 */
export function VideoTextEditor({ editing, onSubmit, onDelete, onCancel }: VideoTextEditorProps) {
  const { colors } = useTheme();
  const [text, setText] = useState(editing?.text ?? "");
  const [color, setColor] = useState(editing?.color ?? videoUploadConfig.text.palette[0]);
  const [fontSize, setFontSize] = useState(editing?.fontSize ?? videoUploadConfig.text.defaultFontSize);

  const canSubmit = text.trim().length > 0;

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <TextInput
          accessibilityLabel="Overlay text"
          placeholder="Add text"
          placeholderTextColor={colors.textMuted}
          autoFocus
          multiline
          value={text}
          onChangeText={setText}
          style={{
            flex: 1,
            minHeight: 44,
            maxHeight: 100,
            borderRadius: radius.md,
            backgroundColor: colors.surface,
            color: colors.textPrimary,
            ...inputTextStyle(true),
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          }}
        />
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Close text editor"
          onPress={onCancel}
          style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
        >
          <Icon name="close" size={18} color={colors.textMuted} />
        </PressableScale>
      </View>

      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        {videoUploadConfig.text.palette.map((hue) => (
          <PressableScale
            key={hue}
            accessibilityRole="button"
            accessibilityLabel={`Text colour ${hue}`}
            accessibilityState={{ selected: hue === color }}
            onPress={() => setColor(hue)}
            style={{
              width: 30,
              height: 30,
              borderRadius: radius.full,
              backgroundColor: hue,
              borderWidth: hue === color ? 2 : 1,
              borderColor: hue === color ? colors.textPrimary : colors.border,
            }}
          />
        ))}
      </View>

      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        {[16, 22, 28, 40, 56].map((size) => (
          <PressableScale
            key={size}
            accessibilityRole="button"
            accessibilityLabel={`Font size ${size}`}
            accessibilityState={{ selected: fontSize === size }}
            onPress={() => setFontSize(size)}
            style={{
              flex: 1,
              minHeight: 40,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: radius.md,
              backgroundColor: fontSize === size ? colors.textPrimary : colors.surface,
            }}
          >
            <Text
              variant="label"
              style={[{ fontSize: 14 }, fontSize === size ? { color: colors.background } : undefined]}
            >
              {size}
            </Text>
          </PressableScale>
        ))}
      </View>

      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        {editing ? (
          <Button label="Delete" variant="secondary" onPress={onDelete} style={{ flex: 1 }} />
        ) : null}
        <Button
          label={editing ? "Update" : "Add text"}
          disabled={!canSubmit}
          onPress={() => onSubmit(text.trim(), color, fontSize)}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}
