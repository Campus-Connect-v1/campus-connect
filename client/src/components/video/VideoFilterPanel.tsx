import { Image } from "expo-image";
import { ScrollView, StyleSheet, View } from "react-native";

import { PressableScale } from "@/src/components/ui";
import { FILTER_PRESETS } from "@/src/features/video/editor/filters";
import type { FilterId } from "@/src/features/video/types";
import { radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

interface VideoFilterPanelProps {
  thumbnailUri: string | null;
  selected: FilterId;
  onSelect: (filter: FilterId) => void;
}

const CIRCLE_SIZE = 56;

/**
 * Reads its whole list from `FilterEngine`'s registry (`editor/filters.ts`)
 * -- adding a filter is an entry there, never a change to this component.
 *
 * Circular swatches with no visible label, bled to the screen edges: this
 * is modeled directly on the reference strip it was asked to match, where a
 * filter name is either baked into the thumbnail art itself or left off
 * entirely -- the label still exists, just as `accessibilityLabel`, not
 * on-screen text competing with a 56px circle for room.
 *
 * Each swatch tints the source thumbnail with the preset's approximate
 * preview overlay (see the doc comment on `FilterPreset` for why this is an
 * approximation, not the real per-pixel effect).
 */
export function VideoFilterPanel({ thumbnailUri, selected, onSelect }: VideoFilterPanelProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -spacing.lg }}
      contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg }}
    >
      {FILTER_PRESETS.map((preset) => {
        const active = preset.id === selected;
        return (
          <PressableScale
            key={preset.id}
            accessibilityRole="button"
            accessibilityLabel={preset.label}
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(preset.id)}
            style={{
              width: CIRCLE_SIZE,
              height: CIRCLE_SIZE,
              borderRadius: radius.full,
              overflow: "hidden",
              borderWidth: active ? 2.5 : 1,
              borderColor: active ? colors.textPrimary : "rgba(255,255,255,0.4)",
              backgroundColor: colors.surfaceSunken,
            }}
          >
            {thumbnailUri ? (
              <Image source={thumbnailUri} contentFit="cover" style={{ width: "100%", height: "100%" }} />
            ) : null}
            {preset.preview ? (
              <View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: preset.preview.color, opacity: preset.preview.opacity },
                ]}
              />
            ) : null}
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}
