import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  FadeInUp,
  FadeOutUp,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon, Text } from "@/src/components/ui";
import { useUploadQueue } from "@/src/services/UploadQueueContext";
import { culture, foregroundOn, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

/** The app's own hues, so the fill belongs to this product rather than any other. */
const FILL = [culture.violet, culture.pink, culture.yellow, culture.lime] as const;

/** How long the finished pill stays before it withdraws. */
const TOAST_MS = 2600;

/**
 * Clear of the tallest header in the app, so the pill never lands on a title.
 *
 * A global overlay cannot measure whatever screen is under it, so it sits at a
 * fixed distance rather than trying to track each header's height and getting
 * it wrong on the one screen nobody checked.
 */
const HEADER_CLEARANCE = 64;

/**
 * One pill for the whole upload: progress while it runs, outcome when it ends.
 *
 * It floats rather than sitting flush at the top of the window -- a full-bleed
 * bar on the very edge reads as a system-level loading state, not as something
 * this app is doing on the user's behalf.
 *
 * Rendered once at the root, over everything, so it survives the composer
 * closing and every navigation after it. That is the whole point: the upload
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
    // Publishing has no measurable progress, so the fill runs to the end and
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
    width: `${Math.max(4, progress.value * 100)}%`,
  }));

  if (!active && !finished) return null;

  const failed = finished?.status === "failed";
  const background = failed ? colors.destructive : culture.pink;
  const ink = foregroundOn(background);

  /**
   * `label` is the plain noun the job was queued with: "Post" or "Story".
   * The two states read as a sentence pair -- "Sharing a new post", then
   * "Post shared" -- rather than the same word twice.
   */
  const noun = (finished ?? active)?.label ?? "Post";

  const label = finished
    ? failed
      ? finished.error || `${noun} could not be shared`
      : `${noun} shared`
    : `Sharing a new ${noun.toLowerCase()}`;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: insets.top + HEADER_CLEARANCE,
        left: 0,
        right: 0,
        alignItems: "center",
        zIndex: 100,
      }}
    >
      <Animated.View
        entering={reduced ? undefined : FadeInUp.duration(220)}
        exiting={reduced ? undefined : FadeOutUp.duration(180)}
        style={{
          maxWidth: "88%",
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.xs,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.full,
          backgroundColor: background,
          overflow: "hidden",
        }}
      >
        {/* The progress fill sits BEHIND the label rather than under it as a
            separate track: one pill that fills is easier to read at a glance
            than a pill plus a hairline, and it keeps the shape intact. */}
        {active ? (
          <Animated.View style={[StyleSheet.absoluteFillObject, { right: undefined }, fillStyle]}>
            <LinearGradient
              colors={FILL}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1, opacity: 0.85 }}
            />
          </Animated.View>
        ) : null}

        {finished ? (
          <Icon name={failed ? "alert" : "check"} size={15} color={ink} />
        ) : null}
        <Text variant="label" style={{ color: ink }} numberOfLines={2}>
          {label}
        </Text>
      </Animated.View>
    </View>
  );
}
