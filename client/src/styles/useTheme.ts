import { useColorScheme } from "react-native";

import { elevation, palette, type ColorScheme } from "./theme";
import { useForcedScheme } from "./ThemeScheme";

/**
 * Resolved colours for the active colour scheme.
 *
 * Every screen reads colour through this hook rather than importing `palette`
 * directly, so dark mode is not something that has to be remembered per screen.
 *
 * Precedence: an explicit `force` argument, then an enclosing `<ThemeScheme>`,
 * then the system setting. The auth flow wraps itself in `<ThemeScheme scheme="dark">`
 * because those screens are built on a photo collage that only holds up on a
 * dark ground.
 */
export function useTheme(force?: ColorScheme) {
  const system = useColorScheme();
  const contextScheme = useForcedScheme();
  const scheme: ColorScheme = force ?? contextScheme ?? (system === "dark" ? "dark" : "light");
  const colors = palette[scheme];

  return {
    scheme,
    isDark: scheme === "dark",
    colors,
    /**
     * Shadows are invisible against a near-black ground, so dark mode swaps
     * them for a hairline. Callers spread the result onto a View style.
     */
    elevation(level: keyof typeof elevation) {
      if (scheme === "dark") {
        return { borderWidth: 1, borderColor: colors.border };
      }
      return elevation[level];
    },
  };
}
