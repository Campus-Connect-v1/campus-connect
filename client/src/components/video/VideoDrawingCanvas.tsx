import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { Icon, PressableScale, Text } from "@/src/components/ui";
import { videoUploadConfig } from "@/src/features/video/config";
import { createStroke, strokeToPath } from "@/src/features/video/editor/drawing";
import type { DrawingStroke, Point } from "@/src/features/video/types";
import { radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

interface VideoDrawingCanvasProps {
  width: number;
  height: number;
  strokes: DrawingStroke[];
  onStrokeComplete: (stroke: DrawingStroke) => void;
  onClear: () => void;
  canUndo: boolean;
  onUndo: () => void;
}

/**
 * The freehand drawing layer.
 *
 * Deliberately its own component, independent of `OverlayLayer`'s render of
 * committed strokes: this one owns the ACTIVE stroke while a finger is still
 * moving, which needs local, per-frame state that has no business living in
 * the editor's reducer (a reducer dispatch per touch-move would be both slow
 * and pollute undo history with every intermediate point). Only the
 * finished stroke is ever committed to `VideoEditorState`.
 */
export function VideoDrawingCanvas({
  width,
  height,
  strokes,
  onStrokeComplete,
  onClear,
  canUndo,
  onUndo,
}: VideoDrawingCanvasProps) {
  const { colors } = useTheme();
  const [color, setColor] = useState<string>(videoUploadConfig.drawing.palette[0]);
  const [brushSize, setBrushSize] = useState<number>(videoUploadConfig.drawing.defaultBrushSize);
  const [activePoints, setActivePoints] = useState<Point[]>([]);
  const pointsRef = useRef<Point[]>([]);

  const toUnit = (x: number, y: number): Point => ({ x: x / width, y: y / height });

  // Gesture callbacks run as worklets on the UI thread. Every one of these
  // touches a ref or setState, neither of which a worklet may do directly --
  // this used to run them there anyway, which crashed the app on the first
  // touch rather than raising a catchable JS error. Each handler below is
  // plain JS, reached only via runOnJS.
  const handleBegin = (x: number, y: number) => {
    pointsRef.current = [toUnit(x, y)];
    setActivePoints(pointsRef.current);
  };

  const handleUpdate = (x: number, y: number) => {
    pointsRef.current = [...pointsRef.current, toUnit(x, y)];
    setActivePoints(pointsRef.current);
  };

  const handleEnd = () => {
    if (pointsRef.current.length > 0) {
      const stroke = createStroke(color, brushSize);
      stroke.points = pointsRef.current;
      onStrokeComplete(stroke);
    }
    pointsRef.current = [];
    setActivePoints([]);
  };

  const pan = Gesture.Pan()
    .onBegin((event) => {
      runOnJS(handleBegin)(event.x, event.y);
    })
    .onUpdate((event) => {
      runOnJS(handleUpdate)(event.x, event.y);
    })
    .onEnd(() => {
      runOnJS(handleEnd)();
    })
    .minDistance(0);

  const activeStroke: DrawingStroke = { id: "active", color, brushSize, points: activePoints };

  return (
    <View style={{ gap: spacing.md }}>
      <GestureDetector gesture={pan}>
        <View style={{ width, height, borderRadius: radius.md, overflow: "hidden" }}>
          <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
            {strokes.map((stroke) => (
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
            {activePoints.length > 0 ? (
              <Path
                d={strokeToPath(activeStroke, width, height)}
                stroke={color}
                strokeWidth={brushSize}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ) : null}
          </Svg>
        </View>
      </GestureDetector>

      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        {videoUploadConfig.drawing.palette.map((hue) => (
          <PressableScale
            key={hue}
            accessibilityRole="button"
            accessibilityLabel={`Brush colour ${hue}`}
            accessibilityState={{ selected: hue === color }}
            onPress={() => setColor(hue)}
            style={{
              width: 30,
              height: 30,
              borderRadius: radius.full,
              backgroundColor: hue,
              borderWidth: hue === color ? 2 : 1,
              borderColor: hue === color ? colors.textPrimary : colors.border,
            }}
          />
        ))}
        <View style={{ flex: 1 }} />
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Undo last stroke"
          disabled={!canUndo}
          onPress={onUndo}
          style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center", opacity: canUndo ? 1 : 0.4 }}
        >
          <Icon name="undo" size={18} color={colors.textPrimary} />
        </PressableScale>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Clear drawing"
          disabled={strokes.length === 0}
          onPress={onClear}
          style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center", opacity: strokes.length ? 1 : 0.4 }}
        >
          <Icon name="close" size={18} color={colors.textPrimary} />
        </PressableScale>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Text variant="caption" color="textMuted">
          Brush size
        </Text>
        <View style={{ flexDirection: "row", gap: spacing.xs, flex: 1 }}>
          {[videoUploadConfig.drawing.minBrushSize, 6, 12, videoUploadConfig.drawing.maxBrushSize].map((size) => (
            <PressableScale
              key={size}
              accessibilityRole="button"
              accessibilityLabel={`Brush size ${size}`}
              accessibilityState={{ selected: brushSize === size }}
              onPress={() => setBrushSize(size)}
              style={{
                width: 36,
                height: 36,
                borderRadius: radius.full,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: brushSize === size ? colors.textPrimary : colors.surface,
              }}
            >
              <View
                style={{
                  width: Math.min(size, 20),
                  height: Math.min(size, 20),
                  borderRadius: radius.full,
                  backgroundColor: brushSize === size ? colors.background : colors.textMuted,
                }}
              />
            </PressableScale>
          ))}
        </View>
      </View>
    </View>
  );
}
