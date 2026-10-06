import { videoUploadConfig, type VideoQualityId } from "../config";
import type { SourceVideo, VideoEditorState } from "../types";
import * as AudioEngine from "./audio";
import * as BlurEngine from "./blur";
import { getFilterPreset } from "./filters";

/**
 * The only file that speaks Cloudinary's transformation-string syntax for
 * trim/rotate/crop/quality. Everything else in the editor works with plain
 * `VideoEditorState`; if the storage provider is ever swapped (see
 * `videoStorage.ts`), this is the file that gets replaced, not the editor.
 */

interface BuildOptions {
  source: SourceVideo;
  state: VideoEditorState;
  quality: VideoQualityId;
  /** Public id of the single flattened overlay PNG (text + emoji + stickers
   * + drawing), when any overlay exists. Produced by the compositor. */
  overlayImagePublicId?: string;
  /** Public id of the uploaded music track, when one is attached. */
  audioTrackPublicId?: string;
}

function targetDimensions(source: SourceVideo, quality: VideoQualityId) {
  const preset = videoUploadConfig.qualities.find((q) => q.id === quality) ?? videoUploadConfig.qualities[0];
  const longestEdge = Math.max(source.width, source.height);
  const scale = Math.min(1, preset.maxDimension / longestEdge);
  return {
    width: Math.round(source.width * scale),
    height: Math.round(source.height * scale),
    bitrateKbps: preset.maxBitrateKbps,
  };
}

/** Builds the ordered list of chained Cloudinary transformation components
 * (joined with "/" by the caller) that reproduces one `VideoEditorState`. */
export function buildCloudinaryTransformation(options: BuildOptions): string[] {
  const { source, state, quality } = options;
  const { width, height, bitrateKbps } = targetDimensions(source, quality);
  const components: string[] = [];

  // 1. Trim + rotate + resize + quality in one component -- these are all
  // resource-shaping operations Cloudinary expects together.
  const first: string[] = [];
  const startSec = (state.trim.startMs / 1000).toFixed(2);
  const endSec = (state.trim.endMs / 1000).toFixed(2);
  first.push(`so_${startSec}`, `eo_${endSec}`);
  if (state.rotation !== 0) first.push(`a_${state.rotation}`);

  // Every aspect except "original" seeds and keeps a pixel rect in
  // `crop.rect` -- the presets only lock its width/height together while
  // it's being resized (see VideoCropper), they don't stop it being moved
  // or resized afterward. That rect, wherever the user left it, is always
  // the actual crop; a plain `ar_`-driven centered fill would silently
  // throw away every drag and pinch the moment a preset (rather than Free)
  // was selected.
  if (state.crop.rect) {
    first.push(
      "c_crop",
      "g_north_west",
      `x_${Math.round(state.crop.rect.x * source.width)}`,
      `y_${Math.round(state.crop.rect.y * source.height)}`,
      `w_${Math.round(state.crop.rect.width * source.width)}`,
      `h_${Math.round(state.crop.rect.height * source.height)}`
    );
  }

  first.push(`w_${width}`, `h_${height}`, "c_limit", `br_${bitrateKbps}k`, "q_auto", "f_mp4");
  components.push(first.join(","));

  // 2. Filter (color effect), its own chained component.
  const filter = getFilterPreset(state.filter);
  if (filter.cloudinaryEffect.length) components.push(filter.cloudinaryEffect.join(","));

  // 3. Blur regions -- one component each, in the frame's own pixel space
  // (after step 1's resize, so use the target dimensions here).
  for (const effect of BlurEngine.toCloudinaryEffects(state.blurRegions, width, height)) {
    components.push(effect);
  }

  // 4. Audio: mute and/or overlay a picked track.
  for (const effect of AudioEngine.toCloudinaryEffects(state.audio, options.audioTrackPublicId)) {
    components.push(effect);
  }

  // 5. The single flattened overlay image (text + emoji + stickers +
  // drawing), positioned to cover the whole frame exactly.
  if (options.overlayImagePublicId) {
    components.push(
      [
        `l_${options.overlayImagePublicId}`,
        "g_north_west",
        "x_0",
        "y_0",
        `w_${width}`,
        `h_${height}`,
        "fl_layer_apply",
      ].join(",")
    );
  }

  return components;
}

export function joinTransformation(components: string[]): string {
  return components.join("/");
}
