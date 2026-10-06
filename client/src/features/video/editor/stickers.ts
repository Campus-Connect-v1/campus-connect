/**
 * StickerRegistry: the single place sticker packs are defined.
 *
 * VideoStickerPicker renders whatever is registered here; it has no
 * knowledge of individual packs or stickers. Adding a pack -- or swapping
 * these for illustrated art -- is a change to this file alone.
 *
 * V1 ships glyph stickers (curated emoji, grouped and named as packs) rather
 * than illustrated art: there are no sticker image assets in this project,
 * and drawing a set is a design task, not an engineering one. `imageUri` is
 * already part of the shape so a future pack can carry real artwork with no
 * change to VideoStickerPicker, StickerOverlay, or the compositor -- only a
 * registry entry.
 */
export interface StickerDefinition {
  id: string;
  /** Rendered directly when present (illustrated art). Falls back to `glyph`
   * (a unicode grapheme) when absent, which is what every V1 sticker does. */
  imageUri?: string;
  glyph: string;
  label: string;
}

export interface StickerPack {
  id: string;
  label: string;
  stickers: StickerDefinition[];
}

export const STICKER_PACKS: StickerPack[] = [
  {
    id: "campus",
    label: "Campus",
    stickers: [
      { id: "grad-cap", glyph: "🎓", label: "Graduation cap" },
      { id: "books", glyph: "📚", label: "Books" },
      { id: "school", glyph: "🏫", label: "School" },
      { id: "backpack", glyph: "🎒", label: "Backpack" },
      { id: "pencil", glyph: "✏️", label: "Pencil" },
      { id: "trophy", glyph: "🏆", label: "Trophy" },
    ],
  },
  {
    id: "reactions",
    label: "Reactions",
    stickers: [
      { id: "fire", glyph: "🔥", label: "Fire" },
      { id: "laugh", glyph: "😂", label: "Laughing" },
      { id: "heart-eyes", glyph: "😍", label: "Heart eyes" },
      { id: "shock", glyph: "😱", label: "Shocked" },
      { id: "hundred", glyph: "💯", label: "100" },
      { id: "clap", glyph: "👏", label: "Clapping" },
    ],
  },
  {
    id: "mood",
    label: "Mood",
    stickers: [
      { id: "heart", glyph: "❤️", label: "Heart" },
      { id: "star", glyph: "⭐", label: "Star" },
      { id: "sparkles", glyph: "✨", label: "Sparkles" },
      { id: "sun", glyph: "☀️", label: "Sun" },
      { id: "rain", glyph: "🌧️", label: "Rain" },
      { id: "moon", glyph: "🌙", label: "Moon" },
    ],
  },
];

export function findSticker(packId: string, stickerId: string): StickerDefinition | null {
  const pack = STICKER_PACKS.find((p) => p.id === packId);
  return pack?.stickers.find((s) => s.id === stickerId) ?? null;
}
