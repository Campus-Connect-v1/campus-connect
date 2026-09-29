/**
 * Single source of truth for every tunable in the video module.
 *
 * Nothing under `src/components/video`, `src/services/video`, or this
 * feature folder should hard-code a limit, a preset list, or a compression
 * setting -- it reads it from here. That is what lets a future "raise the
 * duration cap" or "add an HD+ tier" change be a one-file edit.
 */

export type VideoQualityId = "standard" | "hd";

export interface VideoQualityPreset {
  id: VideoQualityId;
  label: string;
  detail: string;
  /** Cloudinary video codec bitrate cap, in kbps. */
  maxBitrateKbps: number;
  /** Longest edge, in pixels. Cloudinary downsizes to fit, never upsizes. */
  maxDimension: number;
}

export const videoUploadConfig = {
  /** Longest a source video may run. Matches the picker's own cap so a
   * rejection never happens after the user already waited for a 10-minute
   * video to load into the editor. */
  maxDurationSeconds: 120,
  /** Below this there is nothing to usefully trim or edit. */
  minDurationSeconds: 1,
  /** Source file size ceiling, checked before the file ever leaves the
   * device. Cloudinary's own free-tier ceiling is 100 MB; this stays under
   * it with room for the processed derivatives. */
  maxFileSizeBytes: 80 * 1024 * 1024,
  allowedMimeTypes: ["video/mp4", "video/quicktime", "video/webm"],

  defaultQuality: "standard" as VideoQualityId,
  qualities: [
    {
      id: "standard",
      label: "Standard",
      detail: "Smaller file, faster upload",
      maxBitrateKbps: 1500,
      maxDimension: 720,
    },
    {
      id: "hd",
      label: "HD",
      detail: "Higher quality, larger file",
      maxBitrateKbps: 4000,
      maxDimension: 1080,
    },
  ] as VideoQualityPreset[],

  thumbnail: {
    /** Where in the clip the auto-thumbnail is grabbed from. */
    atMillisecond: 0,
    quality: 0.7,
  },

  drawing: {
    defaultBrushSize: 6,
    minBrushSize: 2,
    maxBrushSize: 24,
    palette: ["#F8F7F4", "#161616", "#FF3D81", "#FFD84D", "#B8FF5A", "#6C3BFF"],
  },

  text: {
    defaultFontSize: 28,
    minFontSize: 14,
    maxFontSize: 72,
    palette: ["#F8F7F4", "#161616", "#FF3D81", "#FFD84D", "#B8FF5A", "#6C3BFF"],
  },

  blur: {
    /** Region size as a fraction of the frame, so it scales with any video. */
    defaultWidthFraction: 0.28,
    defaultHeightFraction: 0.2,
    minWidthFraction: 0.08,
    minHeightFraction: 0.08,
    /** Cloudinary `e_blur_region` strength (0-2000). */
    strength: 800,
    /** Hard V1 limit -- see BlurEngine's doc comment for why. */
    maxRegions: 4,
  },

  audio: {
    defaultVolume: 1,
    /** How far below 1.0 the original track ducks when a music track plays
     * over it. 0 means the added track fully replaces the original. */
    duckOriginalTo: 0,
  },

  /** How many steps of editor history are kept. Bounded so a long editing
   * session cannot grow this without limit in memory. */
  maxHistoryEntries: 50,

  upload: {
    /** Polling interval while Cloudinary finishes an eager transformation. */
    statusPollIntervalMs: 1500,
    statusPollTimeoutMs: 60_000,
  },
} as const;

export type VideoUploadConfig = typeof videoUploadConfig;
