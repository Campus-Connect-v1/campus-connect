import { spacing } from "./theme";

/**
 * Bottom padding every scrollable screen needs so its last row is not hidden
 * behind the floating tab bar.
 *
 * The bar is absolutely positioned, so the navigator reports no tab bar height
 * to lay out around — each screen has to leave the room itself.
 */
export const TAB_BAR_CLEARANCE = 44 + spacing.xs * 2 + spacing.md + spacing["2xl"];
