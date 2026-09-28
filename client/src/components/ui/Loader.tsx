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
      /**
       * Centres itself on the cross axis.
       *
       * This is a fixed-size box, so a parent that only sets padding leaves it
       * against the leading edge -- which is what put the feed's pagination
       * spinner in the left corner while the ones wrapped in an explicitly
       * centred View looked fine. Leaving it to each call site means every new
       * one is a chance to forget.
       *
       * Cross axis only, so it does the right thing in both directions: in a
       * column it centres horizontally, and inline in a row it centres against
       * the text rather than moving along the line. `style` is applied after,
       * so a caller that wants something else still wins.
       */
      style={[{ width: size, height: size, alignSelf: "center" }, style]}
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
