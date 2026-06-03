import Colors from "@/src/constants/Colors";

/** Shared spatial + elevation tokens for the Collegiate Editorial system. */

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

/** A soft, warm-toned card shadow — restrained, editorial. */
export const cardShadow = {
  shadowColor: "#3A2E18",
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;

/** A hairline rule using the warm border color. */
export const hairline = {
  borderColor: Colors.light.border,
  borderWidth: 1,
} as const;
