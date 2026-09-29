import { BlurView } from "expo-blur";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from "react-native-reanimated";

import { Icon, PressableScale, Text } from "@/src/components/ui";
import { videoUploadConfig } from "@/src/features/video/config";
import { canAddBlurRegion } from "@/src/features/video/editor/blur";
import { clamp } from "@/src/features/video/utils/media";
import type { BlurRegion } from "@/src/features/video/types";
import { radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

interface BlurRegionOverlayProps {
  regions: BlurRegion[];
  width: number;
  height: number;
  onMove: (id: string, rect: BlurRegion["rect"]) => void;
  onRemove: (id: string) => void;
}

/**
 * Live blur preview: real `BlurView` optical blur over the exact region,
 * on top of the playing video. See `editor/blur.ts` for why this -- not a
 * baked-in pixel blur -- is what runs on-device, and what actually gets
 * baked into the uploaded file instead (Cloudinary's `e_blur_region`).
 *
 * Positioned directly over the video preview by the caller (`VideoEditor`),
 * sized to exactly `width`/`height` of that preview -- kept separate from
 * `VideoBlurTool` (the "Add blur region" control) so this can sit in an
 * absolutely-positioned layer on top of playback while the add button lives
 * in the scrollable tool panel below it, without either fighting the
 * other's layout.
 */
export function BlurRegionOverlay({ regions, width, height, onMove, onRemove }: BlurRegionOverlayProps) {
  return (
    <View style={{ width, height }} pointerEvents="box-none">
      {regions.map((region) => (
        <BlurRegionHandle key={region.id} region={region} width={width} height={height} onMove={onMove} onRemove={onRemove} />
      ))}
    </View>
  );
}

interface VideoBlurToolProps {
  regionCount: number;
  onAdd: () => void;
}

/** The "Add blur region" control, for the tool panel -- see
 * `BlurRegionOverlay` above for the draggable regions themselves. */
export function VideoBlurTool({ regionCount, onAdd }: VideoBlurToolProps) {
  const { colors } = useTheme();
  const canAdd = canAddBlurRegion(Array.from({ length: regionCount }));

  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="caption" color="textMuted">
        Drag on the preview above to reposition or resize a blur region.
      </Text>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Add blur region"
        disabled={!canAdd}
        onPress={onAdd}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.xs,
          minHeight: 44,
          borderRadius: radius.md,
          backgroundColor: colors.surface,
          opacity: canAdd ? 1 : 0.4,
        }}
      >
        <Icon name="blur" size={16} color={colors.textPrimary} />
        <Text variant="label">
          {canAdd ? "Add blur region" : `Up to ${videoUploadConfig.blur.maxRegions} regions`}
        </Text>
      </PressableScale>
    </View>
  );
}

function BlurRegionHandle({
  region,
  width,
  height,
  onMove,
  onRemove,
}: {
  region: BlurRegion;
  width: number;
  height: number;
  onMove: (id: string, rect: BlurRegion["rect"]) => void;
  onRemove: (id: string) => void;
}) {
  const x = useSharedValue(region.rect.x * width);
  const y = useSharedValue(region.rect.y * height);
  const w = useSharedValue(region.rect.width * width);
  const h = useSharedValue(region.rect.height * height);
  const start = useSharedValue({ x: 0, y: 0, w: 0, h: 0 });

  const commit = () => {
    onMove(region.id, {
      x: clamp(x.value / width, 0, 1),
      y: clamp(y.value / height, 0, 1),
      width: clamp(w.value / width, 0.05, 1),
      height: clamp(h.value / height, 0.05, 1),
    });
  };

  const move = Gesture.Pan()
    .onBegin(() => {
      start.value = { x: x.value, y: y.value, w: w.value, h: h.value };
    })
    .onUpdate((event) => {
      // Inlined rather than calling the imported `clamp` -- calling a
      // function from another file from inside a worklet isn't reliably
      // safe even when that function carries a `'worklet'` directive at its
      // own definition, and threw at runtime here, crashing the app
      // outright instead of raising a catchable JS error.
      "worklet";
      x.value = Math.min(Math.max(start.value.x + event.translationX, 0), width - w.value);
      y.value = Math.min(Math.max(start.value.y + event.translationY, 0), height - h.value);
    })
    // `commit` calls `onMove`, a prop -- not safe to run as a worklet on the
    // UI thread. Passing `commit` straight to `.onEnd` let it run there
    // anyway and crashed the app outright rather than raising a JS error.
    // `commit` itself still calls `clamp`, but only after `runOnJS` has
    // already moved it to the JS thread, where that's just a plain call.
    .onEnd(() => {
      "worklet";
      runOnJS(commit)();
    });

  const resize = Gesture.Pan()
    .onBegin(() => {
      start.value = { x: x.value, y: y.value, w: w.value, h: h.value };
    })
    .onUpdate((event) => {
      "worklet";
      w.value = Math.min(Math.max(start.value.w + event.translationX, 40), width - x.value);
      h.value = Math.min(Math.max(start.value.h + event.translationY, 40), height - y.value);
    })
    .onEnd(() => {
      "worklet";
      runOnJS(commit)();
    });

  const rectStyle = useAnimatedStyle(() => ({ left: x.value, top: y.value, width: w.value, height: h.value }));
  const handleStyle = useAnimatedStyle(() => ({ left: x.value + w.value - 14, top: y.value + h.value - 14 }));
  const removeStyle = useAnimatedStyle(() => ({ left: x.value + w.value - 14, top: y.value - 14 }));

  return (
    <>
      <GestureDetector gesture={move}>
        <Animated.View style={[{ position: "absolute", overflow: "hidden", borderRadius: radius.sm }, rectStyle]}>
          <BlurView intensity={60} tint="dark" style={{ width: "100%", height: "100%" }} />
        </Animated.View>
      </GestureDetector>
      <GestureDetector gesture={resize}>
        <Animated.View
          accessibilityRole="adjustable"
          accessibilityLabel="Resize blur region"
          style={[{ position: "absolute", width: 28, height: 28, borderRadius: 14, backgroundColor: "#F8F7F4" }, handleStyle]}
        />
      </GestureDetector>
      <Animated.View style={[{ position: "absolute" }, removeStyle]}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Remove blur region"
          onPress={() => onRemove(region.id)}
          style={{ width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(7,18,25,0.7)" }}
        >
          <Icon name="close" size={14} color="#F8F7F4" />
        </PressableScale>
      </Animated.View>
    </>
  );
}
