import { Pressable, type PressableProps, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { HIT_SLOP_MIN, motion } from "@/src/styles/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends Omit<PressableProps, "style"> {
  style?: ViewStyle | ViewStyle[];
  /** Override the pressed scale. Rarely needed; the token is tuned. */
  scaleTo?: number;
}

/**
 * Every touchable in the app. Press feedback is second in the motion hierarchy
 * (after navigation transitions) and is the cheapest thing that makes a screen
 * feel alive, so it is the default rather than an opt-in.
 *
 * The scale runs on the UI thread via Reanimated; it must never be driven by
 * setState. Reduced motion collapses it to no movement while leaving the press
 * itself fully functional.
 */
export function PressableScale({ style, scaleTo, children, ...rest }: PressableScaleProps) {
  const pressed = useSharedValue(0);
  const reduced = useReducedMotion();
  const target = scaleTo ?? motion.press.scale;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: reduced
          ? 1
          : withSpring(1 - pressed.value * (1 - target), {
              damping: motion.press.damping,
              stiffness: motion.press.stiffness,
              mass: motion.press.mass,
            }),
      },
    ],
  }));

  return (
    <AnimatedPressable
      hitSlop={8}
      onPressIn={() => (pressed.value = 1)}
      onPressOut={() => (pressed.value = 0)}
      {...rest}
      style={[{ minHeight: undefined }, style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

export { HIT_SLOP_MIN };
