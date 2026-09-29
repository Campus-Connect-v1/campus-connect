import { View } from "react-native";

import { PressableScale, Text } from "@/src/components/ui";
import type { RotationDegrees } from "@/src/features/video/types";
import { radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

const OPTIONS: RotationDegrees[] = [0, 90, 180, 270];

interface VideoRotationControlProps {
  rotation: RotationDegrees;
  onChange: (rotation: RotationDegrees) => void;
}

/** Rotation is expressed as an absolute target, not a "rotate by" gesture --
 * tapping "180°" is always 180°, however many times it was tapped before,
 * which is what lets the preview and the reducer both stay simple booleans
 * of "is this degree selected" rather than tracking a running delta. */
export function VideoRotationControl({ rotation, onChange }: VideoRotationControlProps) {
  const { colors } = useTheme();

  return (
    <View>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        {OPTIONS.map((degrees) => {
          const active = rotation === degrees;
          return (
            <PressableScale
              key={degrees}
              accessibilityRole="button"
              accessibilityLabel={degrees === 0 ? "No rotation" : `Rotate ${degrees} degrees`}
              accessibilityState={{ selected: active }}
              onPress={() => onChange(degrees)}
              style={{
                flex: 1,
                minHeight: 44,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: radius.md,
                backgroundColor: active ? colors.textPrimary : colors.surface,
              }}
            >
              <Text variant="label" style={active ? { color: colors.background } : undefined}>
                {degrees}°
              </Text>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}
