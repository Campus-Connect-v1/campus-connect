import { useState } from "react";
import { ScrollView, View } from "react-native";

import { PressableScale, Text } from "@/src/components/ui";
import { STICKER_PACKS, type StickerDefinition } from "@/src/features/video/editor/stickers";
import { radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

interface VideoStickerPickerProps {
  onSelect: (packId: string, sticker: StickerDefinition) => void;
}

/**
 * Renders whatever `STICKER_PACKS` registers -- it has no pack-specific
 * logic of its own, so a new pack (or real illustrated art replacing the
 * glyph packs) is a change to `editor/stickers.ts`, never here.
 */
export function VideoStickerPicker({ onSelect }: VideoStickerPickerProps) {
  const { colors } = useTheme();
  const [packId, setPackId] = useState(STICKER_PACKS[0].id);
  const pack = STICKER_PACKS.find((p) => p.id === packId) ?? STICKER_PACKS[0];

  return (
    <View style={{ gap: spacing.md }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
        {STICKER_PACKS.map((option) => {
          const active = option.id === packId;
          return (
            <PressableScale
              key={option.id}
              accessibilityRole="button"
              accessibilityLabel={`${option.label} sticker pack`}
              accessibilityState={{ selected: active }}
              onPress={() => setPackId(option.id)}
              style={{
                paddingHorizontal: spacing.md,
                minHeight: 36,
                justifyContent: "center",
                borderRadius: radius.full,
                backgroundColor: active ? colors.textPrimary : colors.surface,
              }}
            >
              <Text variant="label" style={active ? { color: colors.background } : undefined}>
                {option.label}
              </Text>
            </PressableScale>
          );
        })}
      </ScrollView>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {pack.stickers.map((sticker) => (
          <PressableScale
            key={sticker.id}
            accessibilityRole="button"
            accessibilityLabel={`Add ${sticker.label} sticker`}
            onPress={() => onSelect(pack.id, sticker)}
            style={{
              width: 60,
              height: 60,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: radius.md,
              backgroundColor: colors.surface,
            }}
          >
            <Text style={{ fontSize: 32 }}>{sticker.glyph}</Text>
          </PressableScale>
        ))}
      </View>
    </View>
  );
}
