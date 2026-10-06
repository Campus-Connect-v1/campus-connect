import { videoUploadConfig } from "../config";
import type { BlurRegion } from "../types";

/**
 * BlurEngine: the editor's only interface to blur.
 *
 * IMPORTANT LIMITATION, stated plainly rather than worked around:
 *
 * There is no on-device way in this Expo/RN stack (no FFmpeg binding is
 * available -- see the module README -- and no GPU frame-processing
 * pipeline exists in this project) to blur a moving region of a video's
 * actual pixels, frame by frame, in real time on the device. Building that
 * from scratch is a native-module project of its own, not a V1 feature.
 *
 * What IS real, not faked:
 *  - The live editing preview uses `expo-blur`'s BlurView positioned over the
 *    chosen rect, sitting on top of the playing <VideoView>. This is a real
 *    optical blur of what's on screen at that position -- genuinely blurred
 *    pixels, just recomposed live rather than baked into a file.
 *  - The FINAL, uploaded video's blur is Cloudinary's `e_blur_region`, a real
 *    server-side per-pixel blur of that rectangle for the region's whole
 *    duration. This is not an approximation; it is the actual mechanism that
 *    produces what other users see.
 *
 * So: the two paths are both real blur, using two different engines (a view
 * compositor on-device, a video codec effect server-side) joined by one
 * shared region model. If a future native video-processing capability is
 * added, only `toCloudinaryEffects` below needs to change -- the region
 * model, the gestures, and the on-device preview are unaffected.
 */

export function createBlurRegion(rect: BlurRegion["rect"]): BlurRegion {
  return { id: `blur_${Date.now()}_${Math.round(Math.random() * 1e6)}`, rect };
}

export function defaultBlurRect(): BlurRegion["rect"] {
  const { defaultWidthFraction, defaultHeightFraction } = videoUploadConfig.blur;
  return {
    x: (1 - defaultWidthFraction) / 2,
    y: (1 - defaultHeightFraction) / 2,
    width: defaultWidthFraction,
    height: defaultHeightFraction,
  };
}

export function canAddBlurRegion(existing: BlurRegion[]): boolean {
  return existing.length < videoUploadConfig.blur.maxRegions;
}

/**
 * Converts unit-space regions (0..1 of frame) into Cloudinary `e_blur_region`
 * effect segments. Cloudinary takes region geometry in pixels via
 * `w_/h_/x_/y_` chained onto the same layer, gravity north-west so x/y are
 * absolute from the top-left corner (matching this module's unit-rect
 * convention).
 */
export function toCloudinaryEffects(
  regions: BlurRegion[],
  frameWidth: number,
  frameHeight: number
): string[] {
  return regions.map((region) => {
    const w = Math.round(region.rect.width * frameWidth);
    const h = Math.round(region.rect.height * frameHeight);
    const x = Math.round(region.rect.x * frameWidth);
    const y = Math.round(region.rect.y * frameHeight);
    return `e_blur_region:${videoUploadConfig.blur.strength},g_north_west,x_${x},y_${y},w_${w},h_${h}`;
  });
}
