import { View } from "react-native";

import { Button, Icon, PressableScale, Text } from "@/src/components/ui";
import { videoUploadConfig } from "@/src/features/video/config";
import { TEXT_FONT_STYLES } from "@/src/features/video/editor/textStyles";
import type { TextFontStyleId } from "@/src/features/video/types";
import { radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

interface VideoTextEditorProps {
  /** Whether the panel is editing an existing overlay (shows Delete, and
   * labels the submit button "Update") or building a new one. */
  editing: boolean;
  canSubmit: boolean;
  color: string;
  onColorChange: (color: string) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  fontFamily: TextFontStyleId;
  onFontFamilyChange: (id: TextFontStyleId) => void;
  onSubmit: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

/**
 * The text tool's controls -- colour, size, and font style -- for whatever
 * is currently being typed.
 *
 * This panel owns none of the text itself and renders no input box of its
 * own: typing happens directly on the video preview (see VideoEditor's live
 * `TextInput` overlay, styled with these same colour/size/family values), so
 * what the person sees while typing is exactly what the overlay will look
 * like, not a preview of it in a separate box down here. Where the overlay
 * lands, and how it's moved/resized/rotated afterward, is `OverlayLayer`'s
 * job (via drag/pinch/rotate gestures) -- this component never produces a
 * position.
 */
export function VideoTextEditor({
  editing,
  canSubmit,
  color,
  onColorChange,
  fontSize,
  onFontSizeChange,
  fontFamily,
  onFontFamilyChange,
  onSubmit,
  onDelete,
  onCancel,
}: VideoTextEditorProps) {
  const { colors } = useTheme();

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
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
            onPress={() => onColorChange(hue)}
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
            onPress={() => onFontSizeChange(size)}
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
        {TEXT_FONT_STYLES.map((style) => {
          const active = fontFamily === style.id;
          return (
            <PressableScale
              key={style.id}
              accessibilityRole="button"
              accessibilityLabel={`Font style ${style.label}`}
              accessibilityState={{ selected: active }}
              onPress={() => onFontFamilyChange(style.id)}
              style={{
                flex: 1,
                minHeight: 44,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: radius.md,
                backgroundColor: active ? colors.textPrimary : colors.surface,
              }}
            >
              <Text
                style={[
                  { fontFamily: style.fontFamily, fontSize: 15, lineHeight: 19 },
                  active ? { color: colors.background } : undefined,
                ]}
              >
                Aa
              </Text>
            </PressableScale>
          );
        })}
      </View>

      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        {editing ? (
          <Button label="Delete" variant="secondary" onPress={onDelete} style={{ flex: 1 }} />
        ) : null}
        <Button
          label={editing ? "Update" : "Add text"}
          disabled={!canSubmit}
          onPress={onSubmit}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}
