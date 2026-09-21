import { View, type ViewStyle } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import { useTheme } from "@/src/styles/useTheme";

interface LoaderProps {
  size?: number;
  color?: string;
  /** The visible width of the ring. */
  strokeWidth?: number;
  style?: ViewStyle;
}

const spin = {
  from: { transform: [{ rotate: "-90deg" }] },
  to: { transform: [{ rotate: "270deg" }] },
} as const;

/**
 * The app's loading mark: a quiet track with one rounded, rotating arc.
 *
 * Rotation is a UI-thread CSS animation, so it stays smooth while JavaScript
 * is resolving the work it represents. Reduced Motion leaves the arc still.
 */
export function Loader({ size = 22, color, strokeWidth = 3, style }: LoaderProps) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const resolvedColor = color ?? colors.textMuted;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * 2 * radius;

  return (
    <View
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
      style={[{ width: size, height: size }, style]}
    >
      <Animated.View
        style={[
          { width: size, height: size, transform: [{ rotate: "-90deg" }] },
          reduced
            ? undefined
            : {
                animationName: spin,
                animationDuration: "760ms",
                animationIterationCount: "infinite",
                animationTimingFunction: "linear",
              },
        ]}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            opacity={0.18}
            stroke={resolvedColor}
            strokeWidth={strokeWidth}
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={resolvedColor}
            strokeDasharray={`${circumference * 0.28} ${circumference * 0.72}`}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}
