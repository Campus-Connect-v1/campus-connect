import { spacing } from "./theme";

/**
 * Bottom padding every scrollable screen needs so its last row is not hidden
 * behind the floating tab bar.
 *
 * The bar is absolutely positioned, so the navigator reports no tab bar height
 * to lay out around — each screen has to leave the room itself.
 */
export const TAB_BAR_HEIGHT = 44 + spacing.xs * 2;

/**
 * Distance from the bottom of the screen to the top of the floating tab bar.
 * Mirrors the bar's own `bottom: Math.max(insets.bottom, spacing.md)`, so
 * anything floating above it stays put when the home indicator is present.
 */
export const tabBarTop = (bottomInset: number) =>
  Math.max(bottomInset, spacing.md) + TAB_BAR_HEIGHT;

export const TAB_BAR_CLEARANCE = TAB_BAR_HEIGHT + spacing.md + spacing["2xl"];
