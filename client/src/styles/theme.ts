/**
 * Campus Connect design tokens — the single source of truth.
 *
 * Direction: colourful, high-energy, built for students. The chrome is
 * near-monochrome so that PHOTOGRAPHY and the BRAND HUES are the only loud
 * things on a screen.
 *
 * The identity is original to Campus Connect: warm white and near-black form
 * the product layer; violet, pink, yellow and lime punctuate culture-led areas.
 *
 * Rules this file encodes (do not break them screen by screen):
 *   - Semantic colours describe product states and remain calm.
 *   - `culture` colours belong to editorial moments, categories and campaigns.
 *     Scattering them at random makes a colourful app look like a toy.
 *   - Foreground colour is paired by hue: warm white on violet; ink on pink,
 *     yellow and lime. Do not assume one foreground works on every accent.
 *   - ONE gray family, faintly warm.
 *   - Both modes exist from day one.
 *   - No gradients except the media scrim.
 */

import { Platform, type TextStyle, type ViewStyle } from "react-native";

import tokens from "./tokens.json";

/**
 * Colour, spacing, radius and font values live in `tokens.json` because
 * tailwind.config.js is loaded by Node and cannot import TypeScript. One file,
 * two consumers, nothing to keep in sync by hand.
 */
export const palette = tokens.palette;

/**
 * Compatibility aliases for older components. New work should use `culture`.
 */
export const brand = tokens.brand;

/** Expressive editorial colours. Use sparingly for culture-led moments. */
export const culture = tokens.culture;

/**
 * Which expressive hue belongs to each main destination. Repetition makes the
 * palette navigational instead of decorative.
 */
export const SECTION_HUE = {
  home: culture.violet,
  connect: culture.pink,
  events: culture.yellow,
  profile: culture.lime,
} as const;

/** Accessible foreground paired with each bright section colour. */
export const SECTION_FOREGROUND = {
  home: culture.warmWhite,
  connect: culture.ink,
  events: culture.ink,
  profile: culture.ink,
} as const;

/**
 * The readable foreground for any fixed background colour.
 *
 * A `culture` hue does NOT change between light and dark mode, so text sitting
 * on one must not come from the theme either: `textPrimary` is near-white in
 * dark mode, which renders white-on-lime and disappears. This picks ink or warm
 * white by luminance, which reproduces the documented pairing (warm white on
 * violet, ink on pink, yellow and lime) and also copes with a hue added later.
 *
 * Measured contrast against these tokens: violet 5.29, pink 5.37, yellow 13.08,
 * lime 15.07 - all clear of 4.5:1.
 */
/** sRGB relative luminance. Shared by the contrast helpers below. */
function luminance(hex: string): number | null {
  const raw = hex.replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  if (full.length !== 6 || /[^0-9a-fA-F]/.test(full)) return null;

  const channel = (offset: number) => {
    const value = parseInt(full.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

function contrast(a: number, b: number) {
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Nudges a colour until it is visible against `background`.
 *
 * University brand colours come from the database and are frequently very dark
 * (#800000, and #000000 is the column default), so a ring drawn in the raw
 * brand colour disappears against a dark ground. This walks the colour toward
 * whichever end of the scale has room until it clears `minRatio`.
 *
 * 3:1 is the WCAG 1.4.11 floor for a non-text UI component, which is what a
 * ring is. Text uses 4.5:1 and `foregroundOn` instead.
 */
export function readableOn(color: string, background: string, minRatio = 3): string {
  const target = luminance(background);
  const start = luminance(color);
  if (target === null || start === null) return color;

  if (contrast(start, target) >= minRatio) return color;

  const raw = color.replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const rgb = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));

  // Move away from the background: lighten on a dark ground, darken on a light
  // one. Mixing toward white or black keeps the hue recognisable.
  const towardWhite = target < 0.5;

  for (let step = 1; step <= 20; step++) {
    const amount = step / 20;
    const mixed = rgb.map((c) =>
      Math.round(towardWhite ? c + (255 - c) * amount : c * (1 - amount))
    );
    const hex = "#" + mixed.map((c) => c.toString(16).padStart(2, "0")).join("");
    const lum = luminance(hex);
    if (lum !== null && contrast(lum, target) >= minRatio) return hex;
  }

  return towardWhite ? culture.warmWhite : culture.ink;
}

export function foregroundOn(background: string): string {
  const lum = luminance(background);
  if (lum === null) return culture.ink;

  // Compared against both candidates rather than a fixed midpoint, because the
  // two are not symmetric around one.
  const withInk = (lum + 0.05) / 0.0757;
  const withWarmWhite = 0.9611 / (lum + 0.05);

  return withInk >= withWarmWhite ? culture.ink : culture.warmWhite;
}

export type SectionKey = keyof typeof SECTION_HUE;

export type ColorScheme = keyof typeof palette;
export type ColorToken = keyof (typeof palette)["light"];

export const spacing = tokens.spacing;

/**
 * Shape lock, by role. Radii are not a free choice per component:
 *   sm   inputs, small controls
 *   md   media tiles, list thumbnails
 *   lg   sheets, hero media
 *   full CTAs, tags, avatars — always
 */
export const radius = tokens.radius;

export const font = tokens.font;

/**
 * Type scale. Every screen picks from here; no per-screen fontSize literals.
 *
 * `maxFontSizeMultiplier` is bounded on chrome (display/title/label) so custom
 * containers cannot be burst by Dynamic Type, and left unbounded on body and
 * caption so prose stays fully accessible.
 *
 * `includeFontPadding: false` is Android-only and required here: Gilroy ships
 * generous vertical metrics and Android otherwise adds phantom leading that
 * breaks the tight display tracking.
 */
const androidFontFix = Platform.select({ android: { includeFontPadding: false }, default: {} });

type TypeToken = { style: TextStyle; maxFontSizeMultiplier?: number };

export const type = {
  /**
   * Blackbold, the temporary brand face. Reserved for hero moments and
   * page-level titles — never for body, labels or anything inside a control.
   * The rest of the app stays on Gilroy so the display face remains a signal,
   * not visual noise.
   *
   * The generous line height keeps the heavy display shapes clear at large sizes.
   */
  wordmark: {
    style: { fontFamily: font.display, fontSize: 44, lineHeight: 52, ...androidFontFix },
    maxFontSizeMultiplier: 1.25,
  },
  poster: {
    style: {
      fontFamily: font.display,
      fontSize: 42,
      lineHeight: 42,
      letterSpacing: -0.4,
      ...androidFontFix,
    },
    maxFontSizeMultiplier: 1.2,
  },
  posterCompact: {
    style: {
      fontFamily: font.display,
      fontSize: 36,
      lineHeight: 37,
      letterSpacing: -0.3,
      ...androidFontFix,
    },
    maxFontSizeMultiplier: 1.2,
  },
  display: {
    style: {
      fontFamily: font.semibold,
      fontSize: 40,
      lineHeight: 42,
      letterSpacing: -0.8,
      ...androidFontFix,
    },
    maxFontSizeMultiplier: 1.3,
  },
  title: {
    style: {
      fontFamily: font.display,
      fontSize: 30,
      lineHeight: 32,
      letterSpacing: -0.2,
      ...androidFontFix,
    },
    maxFontSizeMultiplier: 1.3,
  },
  heading: {
    style: { fontFamily: font.semibold, fontSize: 20, lineHeight: 26, ...androidFontFix },
    maxFontSizeMultiplier: 1.4,
  },
  body: {
    style: { fontFamily: font.regular, fontSize: 16, lineHeight: 24, ...androidFontFix },
  },
  label: {
    style: { fontFamily: font.medium, fontSize: 14, lineHeight: 20, ...androidFontFix },
    maxFontSizeMultiplier: 1.3,
  },
  caption: {
    style: { fontFamily: font.regular, fontSize: 13, lineHeight: 18, ...androidFontFix },
  },
  micro: {
    style: {
      fontFamily: font.medium,
      fontSize: 11,
      lineHeight: 14,
      letterSpacing: 0.66,
      textTransform: "uppercase",
      ...androidFontFix,
    },
    maxFontSizeMultiplier: 1.3,
  },
} as const satisfies Record<string, TypeToken>;

export type TypeVariant = keyof typeof type;

/**
 * Two elevation levels, each an iOS shadow + Android elevation PAIR.
 * `shadowColor` without `elevation` is invisible on Android; never ship one alone.
 *
 * In dark mode a shadow against #14160F reads as nothing, so `useElevation()`
 * substitutes a hairline border instead. Grouping is otherwise done with
 * whitespace and hairlines, not with a stack of shadowed cards.
 */
/**
 * Text style for a TextInput.
 *
 * A single-line TextInput must NOT carry `lineHeight`. iOS applies it as a
 * paragraph style and stops centring the text in the field, so the glyphs sit
 * low and look like they are sliding out of the control. Multiline is fine with
 * it, and needs it for readable wrapped prose.
 *
 * Takes the family, size and the Android padding fix from the `body` token, so
 * an input can never drift from the type scale.
 */
export function inputTextStyle(multiline = false): TextStyle {
  const { lineHeight, ...withoutLineHeight } = type.body.style;
  return multiline ? { ...type.body.style } : { ...withoutLineHeight };
}

export const elevation = {
  e1: {
    shadowColor: "#14160F",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  e2: {
    shadowColor: "#14160F",
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
} as const satisfies Record<string, ViewStyle>;

/** Minimum touch target, in points. Non-negotiable floor. */
export const HIT_SLOP_MIN = 44;

/**
 * Motion, at MOTION_INTENSITY 5. Springs for anything interactive; no linear
 * easing. `press` is the scale every touchable springs to.
 */
export const motion = {
  press: { scale: 0.97, damping: 18, stiffness: 320, mass: 0.6 },
  enter: { damping: 20, stiffness: 180 },
  durationFast: 140,
  durationBase: 240,
} as const;
