/** @type {import('tailwindcss').Config} */
const { palette, brand, spacing, radius, font } = require("./src/styles/tokens.json");

module.exports = {
  // `src/**` matters: every component lives under src/, and classes in files
  // outside these globs generate no style at all.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Semantic tokens only. Tailwind's stock `gray-*` ramp is off the menu:
        // it is neutral, and this palette's grays are faintly blue-tinted so
        // they sit with the #003554 accent.
        bg: { DEFAULT: palette.light.background, dark: palette.dark.background },
        surface: { DEFAULT: palette.light.surface, dark: palette.dark.surface },
        sunken: { DEFAULT: palette.light.surfaceSunken, dark: palette.dark.surfaceSunken },
        ink: { DEFAULT: palette.light.textPrimary, dark: palette.dark.textPrimary },
        "ink-2": { DEFAULT: palette.light.textSecondary, dark: palette.dark.textSecondary },
        muted: palette.light.textMuted,
        line: { DEFAULT: palette.light.border, dark: palette.dark.border },
        "line-strong": { DEFAULT: palette.light.borderStrong, dark: palette.dark.borderStrong },
        // The accent inverts by mode — see theme.ts.
        accent: { DEFAULT: palette.light.accent, dark: palette.dark.accent },
        "accent-fg": { DEFAULT: palette.light.accentFg, dark: palette.dark.accentFg },
        destructive: { DEFAULT: palette.light.destructive, dark: palette.dark.destructive },
        success: { DEFAULT: palette.light.success, dark: palette.dark.success },
        "on-media": palette.light.onMedia,
        brand,
      },
      spacing,
      borderRadius: radius,
      fontFamily: {
        regular: [font.regular],
        medium: [font.medium],
        semibold: [font.semibold],
      },
    },
  },
  plugins: [],
};
