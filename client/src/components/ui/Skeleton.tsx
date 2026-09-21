import { useEffect } from "react";
import { View, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  useReducedMotion,
} from "react-native-reanimated";

import { radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

/**
 * A pulsing placeholder block.
 *
 * The pulse runs on the UI thread through Reanimated, and collapses to a
 * static block under reduced motion — a looping animation is exactly the kind
 * of decorative motion that setting turns off.
 */
export function Skeleton({ style }: { style?: ViewStyle }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0.55);

  useEffect(() => {
    if (reduced) return;
    pulse.value = withRepeat(withTiming(1, { duration: 820 }), -1, true);
  }, [pulse, reduced]);

  const animated = useAnimatedStyle(() => ({ opacity: reduced ? 0.7 : pulse.value }));

  return (
    <Animated.View
      style={[{ backgroundColor: colors.surfaceSunken, borderRadius: radius.sm }, style, animated]}
    />
  );
}

/** Mirrors PostCard: media block, then author line, then two lines of caption. */
export function PostSkeleton() {
  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm }}>
      <Skeleton style={{ height: 260, borderRadius: radius.md }} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Skeleton style={{ width: 34, height: 34, borderRadius: radius.full }} />
        <Skeleton style={{ height: 13, flex: 1, maxWidth: 140 }} />
      </View>
      <Skeleton style={{ height: 13, width: "92%" }} />
      <Skeleton style={{ height: 13, width: "64%" }} />
    </View>
  );
}

/** Mirrors EventCard: a media tile with a pill button beneath it. */
export function EventSkeleton() {
  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.sm }}>
      <Skeleton style={{ height: 190, borderRadius: radius.md }} />
      <Skeleton style={{ height: 44, borderRadius: radius.full }} />
    </View>
  );
}

/** Mirrors the two-column PeopleGrid. */
export function PeopleSkeleton() {
  return (
    <View style={{ flexDirection: "row", gap: spacing.xs, paddingHorizontal: spacing.lg }}>
      {[0, 1].map((column) => (
        <View key={column} style={{ flex: 1, gap: spacing.xs }}>
          {[0, 1, 2].map((row) => (
            <Skeleton
              key={row}
              style={{
                // Uneven heights, because a grid of identical rectangles reads
                // as a loading bar rather than as the masonry it precedes.
                height: column === row % 2 ? 210 : 164,
                borderRadius: radius.md,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

/** A list of skeletons, for the initial load of a feed. */
export function SkeletonList({
  count = 3,
  item: Item = PostSkeleton,
}: {
  count?: number;
  item?: () => React.ReactElement;
}) {
  return (
    <View accessibilityLabel="Loading" accessibilityRole="progressbar">
      {Array.from({ length: count }, (_, index) => (
        <Item key={index} />
      ))}
    </View>
  );
}
