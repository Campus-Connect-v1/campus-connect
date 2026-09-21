import { Image } from "expo-image";
import { useEffect } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { radius, spacing } from "@/src/styles/theme";

interface Props {
  images: string[];
  /** Drift speed in ms for one full loop. Slower reads as ambient, not busy. */
  duration?: number;
}

/**
 * Three columns of campus photography drifting slowly in opposite directions.
 *
 * The motion is ambient rather than interactive, so it is the one place in the
 * app running an infinite loop: it earns that by making a static sign-in wall
 * feel like a place with people in it. It stops entirely under reduced motion,
 * leaving a still collage.
 */
export function PhotoCollage({ images, duration = 42000 }: Props) {
  const { width } = useWindowDimensions();
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);

  const columnWidth = (width - spacing.xs * 2) / 3;
  // Each column holds the list twice so the drift can loop without a seam.
  const columns = [0, 1, 2].map((c) => {
    const slice = images.filter((_, i) => i % 3 === c);
    return [...slice, ...slice];
  });
  const columnHeight = columns[0].length * (columnWidth * 1.3 + spacing.xs);

  useEffect(() => {
    if (reduced) return;
    progress.value = withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false);
  }, [duration, progress, reduced]);

  const up = useAnimatedStyle(() => ({
    transform: [{ translateY: -progress.value * (columnHeight / 2) }],
  }));
  const down = useAnimatedStyle(() => ({
    transform: [{ translateY: -(columnHeight / 2) + progress.value * (columnHeight / 2) }],
  }));

  return (
    <View
      style={[StyleSheet.absoluteFill, { flexDirection: "row", gap: spacing.xs }]}
      pointerEvents="none"
    >
      {columns.map((column, index) => (
        <Animated.View
          key={index}
          style={[{ width: columnWidth, gap: spacing.xs }, index === 1 ? down : up]}
        >
          {column.map((uri, i) => (
            <Image
              key={`${uri}-${i}`}
              source={uri}
              contentFit="cover"
              transition={400}
              style={{
                width: columnWidth,
                height: columnWidth * 1.3,
                borderRadius: radius.sm,
              }}
            />
          ))}
        </Animated.View>
      ))}
    </View>
  );
}
