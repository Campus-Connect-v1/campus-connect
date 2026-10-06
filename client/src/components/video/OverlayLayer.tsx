import { forwardRef, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { Icon, Text } from "@/src/components/ui";
import { strokeToPath } from "@/src/features/video/editor/drawing";
import { getTextFontStyle } from "@/src/features/video/editor/textStyles";
import type { EditorOverlay, EmojiOverlay, StickerOverlay, TextOverlay, VideoEditorState } from "@/src/features/video/types";

/** Size and position of the drag-to-delete target, in preview-space pixels.
 * A circle rather than a rect: dropping near it should count, not just
 * exactly on it, and a radius check is the simplest way to be generous
 * about that. */
const DELETE_ZONE_RADIUS = 28;
const DELETE_ZONE_BOTTOM_OFFSET = 64;
/** How far from the zone's center a dragged item's own anchor point still
 * counts as "over it" -- wider than the visible circle so the item doesn't
 * have to be dragged pixel-perfectly onto a 56px target to register. */
const DELETE_HIT_TOLERANCE = 36;

interface OverlayLayerProps {
  state: VideoEditorState;
  width: number;
  height: number;
  /** Absent in the off-screen capture pass used to flatten overlays for
   * upload -- that render must be static, with no gesture handling and no
   * selection chrome, since it is a pixel-for-pixel export, not UI. */
  interactive?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onMove?: (id: string, position: { x: number; y: number }, scale: number, rotation: number) => void;
  /** Dragging an emoji or sticker onto the delete zone and releasing calls
   * this instead of `onMove`. Text overlays never trigger it -- they already
   * have their own delete button in VideoTextEditor, and a second, different
   * delete gesture on the same overlay type would just be confusing. */
  onDelete?: (id: string) => void;
}

/**
 * Renders every text/emoji/sticker overlay plus the drawing strokes, at a
 * given pixel size, from plain `VideoEditorState` -- nothing else in the
 * editor knows how an overlay is drawn.
 *
 * This same component runs in two modes: live, on top of the playing
 * preview (interactive, draggable/pinchable/rotatable), and once more,
 * off-screen and non-interactive, as the exact thing `videoCompositor`
 * captures to a PNG for upload. Two render modes of one component rather
 * than two components is what guarantees the flattened export matches what
 * the user actually arranged.
 */
export const OverlayLayer = forwardRef<View, OverlayLayerProps>(function OverlayLayer(
  { state, width, height, interactive = false, selectedId, onSelect, onMove, onDelete },
  ref
) {
  // Shared across every overlay item rather than one pair per item: only one
  // overlay is ever being dragged at a time, so one "is the delete zone
  // showing / being hovered" pair of shared values is all this needs, and it
  // is what lets the single delete-zone visual below react to whichever item
  // is currently being dragged.
  const deleteZoneProgress = useSharedValue(0);
  const deleteZoneHover = useSharedValue(0);
  const deleteZoneCenter = { x: width / 2, y: height - DELETE_ZONE_BOTTOM_OFFSET };

  const deleteZoneStyle = useAnimatedStyle(() => ({
    opacity: deleteZoneProgress.value,
    transform: [{ translateY: (1 - deleteZoneProgress.value) * 60 }],
    backgroundColor: interpolateColor(deleteZoneHover.value, [0, 1], ["rgba(7,18,25,0.55)", "#E1364A"]),
  }));

  return (
    <View ref={ref} collapsable={false} style={{ width, height }} pointerEvents={interactive ? "box-none" : "none"}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
        {state.drawingStrokes.map((stroke) => (
          <Path
            key={stroke.id}
            d={strokeToPath(stroke, width, height)}
            stroke={stroke.color}
            strokeWidth={stroke.brushSize}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
      </Svg>

      {state.textOverlays.map((overlay) => (
        <OverlayItem
          key={overlay.id}
          overlay={overlay}
          width={width}
          height={height}
          interactive={interactive}
          selected={selectedId === overlay.id}
          onSelect={onSelect}
          onMove={onMove}
        >
          <Text
            style={{
              color: overlay.color,
              fontSize: overlay.fontSize,
              // A line height tied to the chosen size, not inherited from
              // the `body` variant's fixed 24px -- left as-is, any overlay
              // above ~24px (the default is 28, and sizes go up to 56) had
              // its top and bottom sheared off by the mismatch, which is
              // what made text overlays look like they weren't rendering
              // at all.
              lineHeight: overlay.fontSize * 1.25,
              fontFamily: getTextFontStyle(overlay.fontFamily).fontFamily,
              textAlign: overlay.align,
            }}
          >
            {overlay.text}
          </Text>
        </OverlayItem>
      ))}

      {state.emojiOverlays.map((overlay) => (
        <OverlayItem
          key={overlay.id}
          overlay={overlay}
          width={width}
          height={height}
          interactive={interactive}
          selected={selectedId === overlay.id}
          onSelect={onSelect}
          onMove={onMove}
          onDelete={onDelete}
          deleteZoneCenter={deleteZoneCenter}
          deleteZoneProgress={deleteZoneProgress}
          deleteZoneHover={deleteZoneHover}
        >
          <Text style={{ fontSize: 44, lineHeight: 52 }}>{overlay.value}</Text>
        </OverlayItem>
      ))}

      {state.stickerOverlays.map((overlay) => (
        <OverlayItem
          key={overlay.id}
          overlay={overlay}
          width={width}
          height={height}
          interactive={interactive}
          selected={selectedId === overlay.id}
          onSelect={onSelect}
          onMove={onMove}
          onDelete={onDelete}
          deleteZoneCenter={deleteZoneCenter}
          deleteZoneProgress={deleteZoneProgress}
          deleteZoneHover={deleteZoneHover}
        >
          <Text style={{ fontSize: 48, lineHeight: 56 }}>{overlay.glyph}</Text>
        </OverlayItem>
      ))}

      {interactive ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              left: deleteZoneCenter.x - DELETE_ZONE_RADIUS,
              top: deleteZoneCenter.y - DELETE_ZONE_RADIUS,
              width: DELETE_ZONE_RADIUS * 2,
              height: DELETE_ZONE_RADIUS * 2,
              borderRadius: DELETE_ZONE_RADIUS,
              alignItems: "center",
              justifyContent: "center",
            },
            deleteZoneStyle,
          ]}
        >
          <Icon name="delete" size={22} color="#F8F7F4" />
        </Animated.View>
      ) : null}
    </View>
  );
});

function OverlayItem({
  overlay,
  width,
  height,
  interactive,
  selected,
  onSelect,
  onMove,
  onDelete,
  deleteZoneCenter,
  deleteZoneProgress,
  deleteZoneHover,
  children,
}: {
  overlay: TextOverlay | EmojiOverlay | StickerOverlay;
  width: number;
  height: number;
  interactive: boolean;
  selected?: boolean;
  onSelect?: (id: string | null) => void;
  onMove?: OverlayLayerProps["onMove"];
  onDelete?: OverlayLayerProps["onDelete"];
  deleteZoneCenter?: { x: number; y: number };
  deleteZoneProgress?: ReturnType<typeof useSharedValue<number>>;
  deleteZoneHover?: ReturnType<typeof useSharedValue<number>>;
  children: React.ReactNode;
}) {
  const translateX = useSharedValue(overlay.position.x * width);
  const translateY = useSharedValue(overlay.position.y * height);
  const scale = useSharedValue(overlay.scale);
  const rotation = useSharedValue(overlay.rotation);
  const start = useSharedValue({ x: 0, y: 0, scale: 1, rotation: 0 });
  const [dragging, setDragging] = useState(false);

  // Only emoji and sticker overlays can be dragged onto the delete zone --
  // text overlays already have their own delete button (see VideoTextEditor),
  // and showing a second, different way to delete the same overlay type
  // would just be confusing.
  const deletable = overlay.type !== "text";

  // Re-syncs from the reducer when the overlay's own values change for a
  // reason OTHER than this component's own gestures -- undo/redo being the
  // main one. Gesture commits already match what's coming back down here, so
  // this never fights an in-progress drag.
  useEffect(() => {
    if (dragging) return;
    translateX.value = overlay.position.x * width;
    translateY.value = overlay.position.y * height;
    scale.value = overlay.scale;
    rotation.value = overlay.rotation;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlay.position.x, overlay.position.y, overlay.scale, overlay.rotation, width, height]);

  const commit = (x: number, y: number, s: number, r: number) => {
    onMove?.(overlay.id, { x: x / width, y: y / height }, s, r);
  };

  const deleteThis = () => {
    onDelete?.(overlay.id);
  };

  const pan = Gesture.Pan()
    .onBegin(() => {
      start.value = { x: translateX.value, y: translateY.value, scale: scale.value, rotation: rotation.value };
      runOnJS(setDragging)(true);
      if (onSelect) runOnJS(onSelect)(overlay.id);
      if (deletable && deleteZoneProgress) deleteZoneProgress.value = withTiming(1, { duration: 150 });
    })
    .onUpdate((event) => {
      translateX.value = start.value.x + event.translationX;
      translateY.value = start.value.y + event.translationY;

      if (deletable && deleteZoneCenter && deleteZoneHover) {
        // Inlined distance check rather than a helper call -- see the note
        // on the trim/crop/blur fixes: a function imported from another
        // file is not reliably safe to call from inside a worklet even when
        // marked `'worklet'` at its own definition, and this runs on every
        // frame of the drag, not just at the end.
        const dx = translateX.value - deleteZoneCenter.x;
        const dy = translateY.value - deleteZoneCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        deleteZoneHover.value = distance < DELETE_HIT_TOLERANCE ? 1 : 0;
      }
    })
    .onEnd(() => {
      runOnJS(setDragging)(false);

      if (deletable && deleteZoneHover && deleteZoneHover.value === 1) {
        runOnJS(deleteThis)();
      } else {
        runOnJS(commit)(translateX.value, translateY.value, scale.value, rotation.value);
      }

      if (deletable) {
        if (deleteZoneProgress) deleteZoneProgress.value = withTiming(0, { duration: 150 });
        if (deleteZoneHover) deleteZoneHover.value = withTiming(0, { duration: 150 });
      }
    });

  const pinch = Gesture.Pinch()
    .onBegin(() => {
      start.value = { ...start.value, scale: scale.value };
    })
    .onUpdate((event) => {
      scale.value = Math.max(0.3, Math.min(4, start.value.scale * event.scale));
    })
    .onEnd(() => {
      runOnJS(commit)(translateX.value, translateY.value, scale.value, rotation.value);
    });

  const rotate = Gesture.Rotation()
    .onBegin(() => {
      start.value = { ...start.value, rotation: rotation.value };
    })
    .onUpdate((event) => {
      rotation.value = start.value.rotation + (event.rotation * 180) / Math.PI;
    })
    .onEnd(() => {
      runOnJS(commit)(translateX.value, translateY.value, scale.value, rotation.value);
    });

  const gesture = Gesture.Simultaneous(pan, pinch, rotate);

  const style = useAnimatedStyle(() => {
    // Once the drag has crossed into the delete zone, shrinking the item
    // itself is what actually reads as "about to be deleted" -- the zone
    // turning red alone can go unnoticed with the item sitting on top of it
    // at full size.
    const overDelete = deletable && deleteZoneHover ? deleteZoneHover.value : 0;
    return {
      opacity: 1 - overDelete * 0.5,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value * (1 - overDelete * 0.35) },
        { rotate: `${rotation.value}deg` },
      ],
    };
  });

  const content = (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: 0,
          top: 0,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: interactive && selected ? 1.5 : 0,
          borderColor: "#F8F7F4",
          borderStyle: "dashed",
          borderRadius: 4,
          padding: interactive && selected ? 4 : 0,
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );

  if (!interactive) return content;

  return <GestureDetector gesture={gesture}>{content}</GestureDetector>;
}

export type { EditorOverlay };
