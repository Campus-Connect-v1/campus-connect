import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/src/components/ui";
import { useUploadQueue } from "@/src/services/UploadQueueContext";
import { culture, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

/** The app's own hues, so the bar belongs to this product rather than any other. */
const BAR_COLOURS = [culture.violet, culture.pink, culture.yellow, culture.lime] as const;

/** How long the finished toast stays before it withdraws. */
const TOAST_MS = 2600;

/**
 * The upload bar and its completion toast.
 *
 * Rendered once at the root, over everything, so it survives the composer
 * closing and every navigation after it -- the whole point is that the upload
 * outlives the screen that started it.
 */
export function UploadIndicator() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { active, finished, dismiss } = useUploadQueue();

  const progress = useSharedValue(0);

  useEffect(() => {
    if (!active) return;
    // Publishing has no measurable progress, so the bar runs to the end and
    // waits there rather than stalling wherever the bytes finished.
    const target = active.status === "publishing" ? 1 : active.progress;
    progress.value = reduced ? target : withTiming(target, { duration: 220 });
  }, [active, progress, reduced]);

  useEffect(() => {
    if (!finished) return;
    const timer = setTimeout(() => dismiss(finished.id), TOAST_MS);
    return () => clearTimeout(timer);
  }, [finished, dismiss]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(2, progress.value * 100)}%`,
  }));

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top: insets.top,
        left: 0,
        right: 0,
        zIndex: 100,
      }}
    >
      {active ? (
        <View
          // Full-bleed and only 3pt tall: it belongs to the window rather than
          // to whatever screen happens to be under it, and it must never push
          // that screen's layout around.
          style={{ height: 3, backgroundColor: colors.border, overflow: "hidden" }}
        >
          <Animated.View style={[{ height: 3 }, fillStyle]}>
            <LinearGradient
              colors={BAR_COLOURS}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
          </Animated.View>
        </View>
      ) : null}

      {finished ? (
        <View
          pointerEvents="none"
          style={{
            marginTop: spacing.xs,
            marginHorizontal: spacing.lg,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: radius.full,
            alignItems: "center",
            backgroundColor:
              finished.status === "failed" ? colors.destructive : colors.textPrimary,
          }}
        >
          <Text variant="label" style={{ color: colors.background }} numberOfLines={2}>
            {finished.status === "failed"
              ? finished.error || `${finished.label} could not be shared`
              : `${finished.label} shared`}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
