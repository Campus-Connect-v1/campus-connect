/**
 * Collegiate Editorial type system.
 * Display = Bebas Neue (tall condensed caps) for headlines, titles, numerals.
 * UI/body = Barlow (a clean low-contrast grotesk) for everything functional.
 *
 * Bebas reads best with a little letter-spacing — see `displayTracking`.
 */
export const Font = {
  // Display (Bebas Neue) — there's a single weight; size carries the hierarchy.
  display: "BebasNeue_400Regular",
  displayBold: "BebasNeue_400Regular",
  // UI / body (Barlow)
  body: "Barlow_400Regular",
  medium: "Barlow_500Medium",
  semibold: "Barlow_600SemiBold",
  bold: "Barlow_700Bold",
} as const;

/** Apply to Bebas display text so the condensed caps breathe. */
export const displayTracking = 0.5;

/** Font assets to register in useFonts. */
export {
  Barlow_400Regular,
  Barlow_500Medium,
  Barlow_600SemiBold,
  Barlow_700Bold,
} from "@expo-google-fonts/barlow";
export { BebasNeue_400Regular } from "@expo-google-fonts/bebas-neue";
