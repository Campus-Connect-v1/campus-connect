/**
 * Back-compat shim. The palette now lives in `src/styles/theme.ts`; prefer
 * `useTheme()` in new code so dark mode resolves automatically.
 *
 * This file stays only so screens still being migrated keep compiling. The old
 * indigo/purple/cyan values are gone — every key below resolves to a token in
 * the current system, and several of them now point at the same neutral because
 * the old file drew distinctions the design system does not make.
 */
import { palette } from "../styles/theme";

const light = palette.light;

export default {
  light: {
    primary: light.textPrimary,
    secondary: light.textSecondary,
    accent: light.accent,
    text: light.textPrimary,
    textSecondary: light.textSecondary,
    inputBackground: light.surface,
    background: light.background,
    card: light.surface,
    border: light.border,
    tint: light.accent,
    tabIconDefault: light.textMuted,
    tabIconSelected: light.textPrimary,
    lightGray: light.surfaceSunken,
    gray: light.textMuted,
    like: light.destructive,
    link: light.textPrimary,
    caption: light.textSecondary,
    username: light.textPrimary,
    timestamp: light.textMuted,
    success: light.success,
    warning: light.accent,
    error: light.destructive,
    notification: light.destructive,
  },
} as const;
