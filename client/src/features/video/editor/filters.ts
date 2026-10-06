import type { FilterId } from "../types";

/**
 * FilterEngine: the video editor's only entry point for filters.
 *
 * VideoEditor and VideoFilterPanel never hard-code a filter's look or its
 * processing recipe -- they read both off this registry, so adding a filter,
 * or replacing how filters are rendered entirely, is a change to this one
 * file.
 *
 * Two things a preset carries, and why they differ:
 *  - `preview`: how the filter looks WHILE EDITING. React Native has no
 *    color-matrix/shader pass over a playing <VideoView> without a GPU
 *    pipeline (Skia or a custom native module), which this project does not
 *    have. The preview is therefore an approximation -- a tint overlay -- not
 *    the real pixel transform. This is intentional and documented, not a bug:
 *    see the module README for the tradeoff.
 *  - `cloudinaryEffect`: the actual `e_` transformation Cloudinary applies to
 *    the uploaded source at export time. This is what the viewer/other users
 *    actually see, and it is a real per-pixel effect, not an approximation.
 */
export interface FilterPreset {
  id: FilterId;
  label: string;
  /** Tint overlay approximating the look during live editing. `null` for
   * "original", which needs no overlay. */
  preview: { color: string; opacity: number } | null;
  /** Cloudinary eager-transformation effect segment(s), applied in order. */
  cloudinaryEffect: string[];
}

export const FILTER_PRESETS: FilterPreset[] = [
  { id: "original", label: "Original", preview: null, cloudinaryEffect: [] },
  {
    id: "bright",
    label: "Bright",
    preview: { color: "#FFFFFF", opacity: 0.12 },
    cloudinaryEffect: ["e_brightness:30"],
  },
  {
    id: "contrast",
    label: "Contrast",
    preview: { color: "#000000", opacity: 0.1 },
    cloudinaryEffect: ["e_contrast:35"],
  },
  {
    id: "warm",
    label: "Warm",
    preview: { color: "#FF9D42", opacity: 0.16 },
    cloudinaryEffect: ["e_tint:40:orange"],
  },
  {
    id: "cool",
    label: "Cool",
    preview: { color: "#3DA9FF", opacity: 0.16 },
    cloudinaryEffect: ["e_tint:40:blue"],
  },
  {
    id: "vintage",
    label: "Vintage",
    preview: { color: "#D9B36C", opacity: 0.22 },
    cloudinaryEffect: ["e_sepia:60", "e_saturation:-20"],
  },
  {
    id: "mono",
    label: "Black & White",
    preview: { color: "#000000", opacity: 0.28 },
    cloudinaryEffect: ["e_grayscale"],
  },
  {
    id: "dramatic",
    label: "Dramatic",
    preview: { color: "#000000", opacity: 0.24 },
    cloudinaryEffect: ["e_contrast:50", "e_saturation:-15", "e_vignette:30"],
  },
];

const BY_ID = new Map(FILTER_PRESETS.map((preset) => [preset.id, preset]));

export function getFilterPreset(id: FilterId): FilterPreset {
  return BY_ID.get(id) ?? FILTER_PRESETS[0];
}
