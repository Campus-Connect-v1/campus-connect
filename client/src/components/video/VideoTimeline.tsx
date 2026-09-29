import { useState } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from "react-native-reanimated";

import { Text } from "@/src/components/ui";
import { formatDuration } from "@/src/features/video/utils/formatting";
import { clamp } from "@/src/features/video/utils/media";
import type { TrimState } from "@/src/features/video/types";
import { radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

const HANDLE_WIDTH = 20;
const TRACK_HEIGHT = 56;

interface VideoTimelineProps {
  durationMs: number;
  trim: TrimState;
  onChange: (trim: TrimState) => void;
  /** Where playback currently is, so the scrubber can show a moving
   * playhead independent of the trim handles. */
  currentPositionMs?: number;
  width: number;
}

/**
 * The trim scrubber: a visual timeline with draggable start/end handles.
 *
 * Only ever produces a `{startMs, endMs}` pair -- it never touches the
 * source file. The original video plays exactly as recorded; trimming is
 * just two numbers that the export step (Cloudinary's `so_`/`eo_`) applies
 * later, which is what section 14's "never destroy the original" means in
 * practice for this tool specifically.
 */
export function VideoTimeline({ durationMs, trim, onChange, currentPositionMs, width }: VideoTimelineProps) {
  const { colors } = useTheme();
  const trackWidth = width - HANDLE_WIDTH * 2;
  const [dragTrim, setDragTrim] = useState(trim);

  const msToX = (ms: number) => (durationMs > 0 ? (ms / durationMs) * trackWidth : 0);
  // Deliberately NOT called from inside a gesture worklet (see the comment
  // on the handles below) -- kept as plain JS, used only from commit, which
  // itself only ever runs on the JS thread via runOnJS.
  const xToMs = (x: number) => clamp((x / trackWidth) * durationMs, 0, durationMs);

  const startX = useSharedValue(msToX(trim.startMs));
  const endX = useSharedValue(msToX(trim.endMs));
  // Captured at the start of each drag, in `.onBegin` -- `event.translationX`
  // is cumulative from the gesture's own start, not a per-frame delta, so it
  // has to be added to a fixed reference point, not to the live, already-
  // moving `startX`/`endX`. Adding it to the live value (as this used to)
  // meant every update piled a growing cumulative number onto an already-
  // shifted position, which ran the handle to its clamp bound within the
  // first couple of frames -- "it jumps to the other end" the instant you
  // touch it, rather than tracking the finger.
  const startOrigin = useSharedValue(0);
  const endOrigin = useSharedValue(0);
  const windowOrigin = useSharedValue({ start: 0, end: 0 });

  // Takes raw pixel offsets, not milliseconds: the ms conversion (xToMs,
  // which calls the imported `clamp`) now happens in here, on the JS thread,
  // instead of inside the worklet that used to call it directly.
  const commitPixels = (startPx: number, endPx: number) => {
    const next = { startMs: xToMs(startPx), endMs: xToMs(endPx) };
    setDragTrim(next);
    onChange(next);
  };

  const startHandle = Gesture.Pan()
    .onBegin(() => {
      startOrigin.value = startX.value;
    })
    .onUpdate((event) => {
      // Inlined rather than calling the imported `clamp` helper: a plain
      // function imported from another file is not reliably workletized by
      // Reanimated's Babel transform just because it carries a `'worklet'`
      // directive at its definition -- calling it from here threw at
      // runtime and crashed the app outright (not a catchable JS error,
      // since the failure happens inside the UI-thread worklet runtime,
      // beneath any JS error boundary). Inlining the same two-line min/max
      // sidesteps the question entirely, the same way OverlayLayer's pinch
      // handler already does.
      "worklet";
      const next = Math.min(Math.max(startOrigin.value + event.translationX, 0), endX.value - HANDLE_WIDTH);
      startX.value = next;
    })
    .onEnd(() => {
      "worklet";
      // Only raw shared-value numbers cross into commitPixels via runOnJS --
      // no function call happens on the UI thread here at all.
      runOnJS(commitPixels)(startX.value, endX.value);
    });

  const endHandle = Gesture.Pan()
    .onBegin(() => {
      endOrigin.value = endX.value;
    })
    .onUpdate((event) => {
      "worklet";
      const next = Math.min(Math.max(endOrigin.value + event.translationX, startX.value + HANDLE_WIDTH), trackWidth);
      endX.value = next;
    })
    .onEnd(() => {
      "worklet";
      runOnJS(commitPixels)(startX.value, endX.value);
    });

  // Dragging the selected window itself (as opposed to either edge handle)
  // slides both ends together by the same amount, keeping the selected
  // duration fixed -- this is how you pick WHICH part of the video a
  // trim of a given length covers, rather than only how long that trim is.
  const moveWindow = Gesture.Pan()
    .onBegin(() => {
      windowOrigin.value = { start: startX.value, end: endX.value };
    })
    .onUpdate((event) => {
      "worklet";
      const selectedWidth = windowOrigin.value.end - windowOrigin.value.start;
      const nextStart = Math.min(
        Math.max(windowOrigin.value.start + event.translationX, 0),
        trackWidth - selectedWidth
      );
      startX.value = nextStart;
      endX.value = nextStart + selectedWidth;
    })
    .onEnd(() => {
      "worklet";
      runOnJS(commitPixels)(startX.value, endX.value);
    });

  const selectionStyle = useAnimatedStyle(() => ({
    left: startX.value + HANDLE_WIDTH,
    width: Math.max(0, endX.value - startX.value - HANDLE_WIDTH),
  }));
  const startHandleStyle = useAnimatedStyle(() => ({ left: startX.value }));
  const endHandleStyle = useAnimatedStyle(() => ({ left: endX.value }));

  const playheadX =
    currentPositionMs !== undefined
      ? HANDLE_WIDTH + clamp(msToX(currentPositionMs), 0, trackWidth)
      : null;

  return (
    <View style={{ gap: spacing.xs }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text variant="caption" color="textMuted">
          {formatDuration(dragTrim.startMs)}
        </Text>
        <Text variant="label">{formatDuration(dragTrim.endMs - dragTrim.startMs)} selected</Text>
        <Text variant="caption" color="textMuted">
          {formatDuration(dragTrim.endMs)}
        </Text>
      </View>

      <View style={{ height: TRACK_HEIGHT, width, justifyContent: "center" }}>
        <View
          style={{
            position: "absolute",
            left: HANDLE_WIDTH,
            right: HANDLE_WIDTH,
            height: 6,
            borderRadius: radius.full,
            backgroundColor: colors.surfaceSunken,
          }}
        />

        <GestureDetector gesture={moveWindow}>
          <Animated.View
            accessibilityRole="adjustable"
            accessibilityLabel="Move selected range"
            style={[
              {
                position: "absolute",
                height: TRACK_HEIGHT,
                borderRadius: radius.sm,
                backgroundColor: colors.accent,
                opacity: 0.28,
              },
              selectionStyle,
            ]}
          />
        </GestureDetector>

        {playheadX !== null ? (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: playheadX,
              top: 0,
              width: 2,
              height: TRACK_HEIGHT,
              backgroundColor: colors.textPrimary,
            }}
          />
        ) : null}

        <GestureDetector gesture={startHandle}>
          <Animated.View
            accessibilityRole="adjustable"
            accessibilityLabel="Trim start"
            style={[
              {
                position: "absolute",
                top: 0,
                width: HANDLE_WIDTH,
                height: TRACK_HEIGHT,
                borderRadius: radius.sm,
                backgroundColor: colors.accent,
              },
              startHandleStyle,
            ]}
          />
        </GestureDetector>

        <GestureDetector gesture={endHandle}>
          <Animated.View
            accessibilityRole="adjustable"
            accessibilityLabel="Trim end"
            style={[
              {
                position: "absolute",
                top: 0,
                width: HANDLE_WIDTH,
                height: TRACK_HEIGHT,
                borderRadius: radius.sm,
                backgroundColor: colors.accent,
              },
              endHandleStyle,
            ]}
          />
        </GestureDetector>
      </View>
    </View>
  );
}
