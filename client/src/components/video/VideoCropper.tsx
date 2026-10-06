import { useEffect, useState } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from "react-native-reanimated";

import { Icon, PressableScale, Text } from "@/src/components/ui";
import { aspectRatioFor, centeredUnitRect, clamp } from "@/src/features/video/utils/media";
import type { CropAspect, CropState } from "@/src/features/video/types";
import { radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";
import type { IconName } from "@/src/components/ui";

const ASPECTS: { id: CropAspect; label: string; icon: IconName }[] = [
  { id: "original", label: "Original", icon: "video" },
  { id: "square", label: "Square", icon: "crop" },
  { id: "portrait", label: "Portrait", icon: "crop" },
  { id: "landscape", label: "Landscape", icon: "crop" },
  { id: "free", label: "Free", icon: "crop" },
];

interface VideoCropperProps {
  crop: CropState;
  onChange: (crop: CropState) => void;
  frameWidth: number;
  frameHeight: number;
  /** The pixel size the frame preview is actually rendered at. */
  previewWidth: number;
  previewHeight: number;
}

/**
 * Aspect presets plus a manual, previewable crop rect.
 *
 * A preset (Square/Portrait/Landscape) only seeds the crop rect -- picking
 * one is a starting point, not a final answer. The rect is always
 * draggable and resizable afterward, the same as "Free", except a preset
 * keeps its own ratio locked while resizing rather than letting width and
 * height move independently. "Original" is the one case with no rect at
 * all: the crop is the whole frame, and there is nothing to drag.
 */
export function VideoCropper({ crop, onChange, frameWidth, frameHeight, previewWidth, previewHeight }: VideoCropperProps) {
  const { colors } = useTheme();
  const frameAspect = frameWidth / frameHeight;

  const selectAspect = (aspect: CropAspect) => {
    if (aspect === "original") return onChange({ aspect, rect: null });
    const ratio = aspectRatioFor(aspect);
    if (!ratio) return onChange({ aspect, rect: crop.rect ?? { x: 0.1, y: 0.1, width: 0.8, height: 0.8 } });
    onChange({ aspect, rect: centeredUnitRect(ratio, frameAspect) });
  };

  const rect = crop.rect ?? { x: 0, y: 0, width: 1, height: 1 };
  const lockedAspectRatio = crop.aspect === "free" ? null : aspectRatioFor(crop.aspect);

  return (
    <View style={{ gap: spacing.md }}>
      <View
        style={{
          width: previewWidth,
          height: previewHeight,
          alignSelf: "center",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {crop.aspect !== "original" ? (
          <CropRectHandle
            rect={rect}
            previewWidth={previewWidth}
            previewHeight={previewHeight}
            lockedAspectRatio={lockedAspectRatio}
            onChange={(nextRect) => onChange({ aspect: crop.aspect, rect: nextRect })}
          />
        ) : null}
      </View>

      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        {ASPECTS.map((option) => {
          const active = crop.aspect === option.id;
          return (
            <PressableScale
              key={option.id}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected: active }}
              onPress={() => selectAspect(option.id)}
              style={{
                flex: 1,
                minHeight: 60,
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                borderRadius: radius.md,
                backgroundColor: active ? colors.textPrimary : colors.surface,
              }}
            >
              <Icon name={option.icon} size={16} color={active ? colors.background : colors.textSecondary} />
              <Text variant="micro" style={active ? { color: colors.background } : undefined}>
                {option.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

function CropRectHandle({
  rect,
  previewWidth,
  previewHeight,
  lockedAspectRatio,
  onChange,
}: {
  rect: NonNullable<CropState["rect"]>;
  previewWidth: number;
  previewHeight: number;
  /** width/height to hold fixed while resizing (Square/Portrait/Landscape),
   * or null to resize width and height independently ("Free"). */
  lockedAspectRatio: number | null;
  onChange: (rect: NonNullable<CropState["rect"]>) => void;
}) {
  const { colors } = useTheme();
  const x = useSharedValue(rect.x * previewWidth);
  const y = useSharedValue(rect.y * previewHeight);
  const w = useSharedValue(rect.width * previewWidth);
  const h = useSharedValue(rect.height * previewHeight);
  const start = useSharedValue({ x: 0, y: 0, w: 0, h: 0 });
  const [dragging, setDragging] = useState(false);

  // Resyncs when `rect` changes for a reason other than this component's own
  // gestures -- switching aspect presets being the main one. Without this,
  // picking Portrait after Square left the box wherever Square's drag had
  // last put it, because these shared values otherwise only ever get set
  // once, at mount.
  useEffect(() => {
    if (dragging) return;
    x.value = rect.x * previewWidth;
    y.value = rect.y * previewHeight;
    w.value = rect.width * previewWidth;
    h.value = rect.height * previewHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rect.x, rect.y, rect.width, rect.height, previewWidth, previewHeight]);

  const commit = () => {
    onChange({
      x: clamp(x.value / previewWidth, 0, 1),
      y: clamp(y.value / previewHeight, 0, 1),
      width: clamp(w.value / previewWidth, 0.1, 1),
      height: clamp(h.value / previewHeight, 0.1, 1),
    });
  };

  const move = Gesture.Pan()
    // Capped to one finger so a two-finger touch always resolves as the
    // pinch gesture below instead of the two racing over the same box.
    .maxPointers(1)
    .onBegin(() => {
      start.value = { x: x.value, y: y.value, w: w.value, h: h.value };
      runOnJS(setDragging)(true);
    })
    .onUpdate((event) => {
      // Inlined rather than calling the imported `clamp` -- a plain function
      // from another file, even one marked `'worklet'` at its definition, is
      // not reliably workletized by Reanimated's Babel transform when
      // called from here. That threw at runtime and crashed the app outright
      // (not a catchable JS error -- the failure happens inside the
      // UI-thread worklet runtime, beneath any JS error boundary).
      "worklet";
      x.value = Math.min(Math.max(start.value.x + event.translationX, 0), previewWidth - w.value);
      y.value = Math.min(Math.max(start.value.y + event.translationY, 0), previewHeight - h.value);
    })
    // `commit` calls `onChange`, a prop -- opaque to the worklet transform,
    // so it must cross back to the JS thread via runOnJS. Passing `commit`
    // straight to `.onEnd` (as this did before) let it run as a worklet and
    // crash the app outright the moment a drag ended, rather than raising a
    // catchable JS error. `commit` itself calls `clamp` too, but by the time
    // it runs (via runOnJS) it's plain JS on the JS thread, not a worklet --
    // that call was never the problem.
    .onEnd(() => {
      "worklet";
      runOnJS(setDragging)(false);
      runOnJS(commit)();
    });

  // Two-finger pinch, directly on the crop box: scales width and height by
  // the same factor (so a locked aspect ratio stays locked without any
  // special-casing) around the box's own center, rather than the pinch's
  // focal point -- growing outward from the middle is what reads as
  // "cropping" here; growing from wherever the fingers happened to land
  // would walk the box around the frame as a side effect of resizing it.
  const pinch = Gesture.Pinch()
    .onBegin(() => {
      start.value = { x: x.value, y: y.value, w: w.value, h: h.value };
      runOnJS(setDragging)(true);
    })
    .onUpdate((event) => {
      "worklet";
      const centerX = start.value.x + start.value.w / 2;
      const centerY = start.value.y + start.value.h / 2;

      const rawWidth = start.value.w * event.scale;
      const rawHeight = start.value.h * event.scale;
      const newWidth = Math.min(Math.max(rawWidth, 60), previewWidth);
      const newHeight = Math.min(Math.max(rawHeight, 60), previewHeight);

      w.value = newWidth;
      h.value = newHeight;
      x.value = Math.min(Math.max(centerX - newWidth / 2, 0), previewWidth - newWidth);
      y.value = Math.min(Math.max(centerY - newHeight / 2, 0), previewHeight - newHeight);
    })
    .onEnd(() => {
      "worklet";
      runOnJS(setDragging)(false);
      runOnJS(commit)();
    });

  const moveAndPinch = Gesture.Simultaneous(move, pinch);

  const resize = Gesture.Pan()
    .onBegin(() => {
      start.value = { x: x.value, y: y.value, w: w.value, h: h.value };
      runOnJS(setDragging)(true);
    })
    .onUpdate((event) => {
      "worklet";
      if (lockedAspectRatio) {
        // Width leads (follows the finger directly); height is derived from
        // it to keep the ratio, then the whole thing is capped by whichever
        // edge of the frame it would hit first -- growing past the frame on
        // one axis is what independent w/h clamping (the "Free" branch
        // below) would otherwise still allow.
        const maxWidthForHeight = (previewHeight - y.value) * lockedAspectRatio;
        const rawWidth = Math.max(start.value.w + event.translationX, 60);
        const newWidth = Math.min(rawWidth, previewWidth - x.value, maxWidthForHeight);
        w.value = newWidth;
        h.value = newWidth / lockedAspectRatio;
      } else {
        w.value = Math.min(Math.max(start.value.w + event.translationX, 60), previewWidth - x.value);
        h.value = Math.min(Math.max(start.value.h + event.translationY, 60), previewHeight - y.value);
      }
    })
    .onEnd(() => {
      "worklet";
      runOnJS(setDragging)(false);
      runOnJS(commit)();
    });

  const rectStyle = useAnimatedStyle(() => ({
    left: x.value,
    top: y.value,
    width: w.value,
    height: h.value,
  }));
  const handleStyle = useAnimatedStyle(() => ({
    left: x.value + w.value - 12,
    top: y.value + h.value - 12,
  }));

  return (
    <>
      <GestureDetector gesture={moveAndPinch}>
        <Animated.View
          style={[
            { position: "absolute", borderWidth: 2, borderColor: colors.textPrimary, borderRadius: radius.sm },
            rectStyle,
          ]}
        />
      </GestureDetector>
      <GestureDetector gesture={resize}>
        <Animated.View
          accessibilityRole="adjustable"
          accessibilityLabel="Resize crop area"
          style={[
            {
              position: "absolute",
              width: 24,
              height: 24,
              borderRadius: radius.full,
              backgroundColor: colors.textPrimary,
            },
            handleStyle,
          ]}
        />
      </GestureDetector>
    </>
  );
}
