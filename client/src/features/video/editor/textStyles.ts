import type { TextFontStyleId } from "../types";

/**
 * The video editor's only entry point for text overlay font styles.
 *
 * `fontFamily` here must match a key registered in `useFonts` (see
 * `app/_layout.tsx`) exactly -- these overlays are captured by
 * `videoCompositor`'s on-device screenshot, not rendered by Cloudinary, so
 * the font actually has to be loaded in the app for the exported video to
 * show anything other than the system fallback.
 */
export interface TextFontStylePreset {
  id: TextFontStyleId;
  label: string;
  fontFamily: string;
}

export const TEXT_FONT_STYLES: TextFontStylePreset[] = [
  { id: "classic", label: "Classic", fontFamily: "Gilroy-Regular" },
  { id: "bold", label: "Bold", fontFamily: "Gilroy-SemiBold" },
  { id: "display", label: "Display", fontFamily: "Blackbold" },
  { id: "retro", label: "Retro", fontFamily: "Chilispepper" },
  { id: "handwritten", label: "Handwritten", fontFamily: "Chrusty" },
];

const BY_ID = new Map(TEXT_FONT_STYLES.map((preset) => [preset.id, preset]));

export function getTextFontStyle(id: TextFontStyleId): TextFontStylePreset {
  return BY_ID.get(id) ?? TEXT_FONT_STYLES[0];
}
