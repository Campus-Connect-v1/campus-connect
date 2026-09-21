import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { ColorScheme } from "@/src/styles/theme";

const THEME_KEY = "cc.pref.theme";

export type ThemePreference = "system" | "light" | "dark";

interface PreferencesValue {
  theme: ThemePreference;
  setTheme: (next: ThemePreference) => void;
  /** null means "follow the system", which `useTheme` already handles. */
  forcedScheme: ColorScheme | null;
  ready: boolean;
}

const PreferencesContext = createContext<PreferencesValue | null>(null);

/**
 * Device-local preferences, persisted to AsyncStorage.
 *
 * These are deliberately NOT on the server: a theme choice belongs to the
 * device, not the account, and round-tripping it would make the app flash the
 * wrong scheme on every cold start while the request is in flight.
 */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((stored) => {
        if (stored === "light" || stored === "dark" || stored === "system") {
          setThemeState(stored);
        }
      })
      .finally(() => setReady(true));
  }, []);

  const setTheme = useCallback((next: ThemePreference) => {
    // Applied immediately and persisted after: the write is not worth a frame
    // of delay on a control the user is watching.
    setThemeState(next);
    AsyncStorage.setItem(THEME_KEY, next).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      forcedScheme: theme === "system" ? null : theme,
      ready,
    }),
    [theme, setTheme, ready]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("usePreferences must be used inside <PreferencesProvider>");
  return value;
}
