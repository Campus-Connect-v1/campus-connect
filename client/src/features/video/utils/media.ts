import type { CropAspect } from "../types";

/**
 * Explicitly a worklet: this is called from inside gesture `.onUpdate`
 * handlers (the trim handles, the crop rect, blur regions, the volume
 * slider) which run on the UI thread. Reanimated's Babel plugin only
 * auto-workletizes a plain function like this one when it's a closure in
 * the SAME file as the worklet that calls it -- across a module boundary
 * (imported from here into another component) it isn't reliably picked up,
 * and calling a non-worklet function from UI-thread worklet code throws at
 * runtime. That throw is what was crashing the app outright on every trim/
 * crop/blur drag, rather than showing a catchable JS error: the `'worklet'`
 * directive is the fix, not a stylistic choice.
 */
export function clamp(value: number, min: number, max: number): number {
  "worklet";
  return Math.min(max, Math.max(min, value));
}

/** width/height for a given aspect choice, or null when the source's own
 * aspect should be kept ("original" and "free"). */
export function aspectRatioFor(aspect: CropAspect): number | null {
  switch (aspect) {
    case "square":
      return 1;
    case "portrait":
      return 9 / 16;
    case "landscape":
      return 16 / 9;
    case "original":
    case "free":
      return null;
  }
}

/** The largest centered rect of the given aspect ratio that fits inside a
 * 0..1 unit frame. Used to seed the crop overlay when a ratio is chosen. */
export function centeredUnitRect(aspectRatio: number, frameAspectRatio: number) {
  if (aspectRatio >= frameAspectRatio) {
    // Target is wider than the frame -- full width, centered height.
    const height = frameAspectRatio / aspectRatio;
    return { x: 0, y: (1 - height) / 2, width: 1, height };
  }
  const width = aspectRatio / frameAspectRatio;
  return { x: (1 - width) / 2, y: 0, width, height: 1 };
}
