import { useCallback, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import {
  Easing,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

/**
 * Below this, a movement is hand tremor or a bounce settling rather than an
 * intent to scroll. Without it the bar flickers on and off while a finger
 * rests on the screen.
 */
const DIRECTION_THRESHOLD = 8;

/**
 * How far down the list the bar is allowed to start hiding.
 *
 * Hiding it the instant the first pixel moves makes the top of the feed feel
 * unstable, because a short flick at rest can take it away and bring it back.
 */
const ENGAGE_AFTER = 24;

const TIMING = { duration: 180, easing: Easing.out(Easing.quad) };

/**
 * A header that gets out of the way when you scroll down and comes straight
 * back when you scroll up.
 *
 * Direction, not position: the bar returns on any upward movement rather than
 * only at the top of the list, so reaching it never means scrolling all the
 * way back.
 *
 * The header has to be absolutely positioned for this -- content passes
 * underneath it, which is the whole point -- so its height is measured rather
 * than assumed and handed back for the list's `paddingTop`. Guessing that
 * number is what leaves a permanent gap, or hides the first row, as soon as
 * the type scale or the campus name changes.
 */
export function useHideOnScroll({ minVisible = 0 }: { minVisible?: number } = {}) {
  const [height, setHeight] = useState(0);

  const offset = useSharedValue(0);
  const lastY = useSharedValue(0);
  const hidden = useSharedValue(false);
  // The worklet cannot read React state, so the measured height lives here too.
  const measured = useSharedValue(0);
  /**
   * How much of the header stays on screen when hidden.
   *
   * Callers pass the top safe-area inset, so the strip behind the status bar
   * keeps its solid background and the feed never scrolls under the clock.
   */
  const floor = useSharedValue(minVisible);
  floor.value = minVisible;

  const onHeaderLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const next = event.nativeEvent.layout.height;
      measured.value = next;
      setHeight((current) => (Math.abs(current - next) > 0.5 ? next : current));
    },
    [measured]
  );

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      const delta = y - lastY.value;
      lastY.value = y;

      // At the top, and through iOS rubber-band overscroll, always visible.
      if (y <= ENGAGE_AFTER) {
        if (hidden.value) {
          hidden.value = false;
          offset.value = withTiming(0, TIMING);
        }
        return;
      }

      if (Math.abs(delta) < DIRECTION_THRESHOLD) return;

      // Each branch is guarded on the current state, so the animation starts
      // once per change of direction rather than restarting every frame.
      if (delta > 0 && !hidden.value) {
        hidden.value = true;
        offset.value = withTiming(-(measured.value - floor.value), TIMING);
      } else if (delta < 0 && hidden.value) {
        hidden.value = false;
        offset.value = withTiming(0, TIMING);
      }
    },
  });

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  return { onScroll, headerStyle, onHeaderLayout, headerHeight: height };
}
