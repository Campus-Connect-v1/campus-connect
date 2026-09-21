import { createContext, useContext } from "react";

import type { ColorScheme } from "./theme";

const SchemeContext = createContext<ColorScheme | null>(null);

/**
 * Pins everything below it to one colour scheme.
 *
 * Without this, forcing a scheme on a screen would only affect that screen's
 * own styles — nested `Button`, `Field` and `Text` each call `useTheme()`
 * independently and would still resolve to the system scheme, so a dark auth
 * screen in light mode would come out with white buttons on it.
 */
export function ThemeScheme({
  scheme,
  children,
}: {
  /** `null` means "follow the system", which `useTheme` resolves on its own. */
  scheme: ColorScheme | null;
  children: React.ReactNode;
}) {
  return <SchemeContext.Provider value={scheme}>{children}</SchemeContext.Provider>;
}

export function useForcedScheme() {
  return useContext(SchemeContext);
}
