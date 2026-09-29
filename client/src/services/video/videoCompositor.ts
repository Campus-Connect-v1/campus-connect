import { captureRef } from "react-native-view-shot";
import type { View } from "react-native";

import type { VideoEditorState } from "@/src/features/video/types";

/**
 * Flattens every vector overlay (text, emoji, stickers, drawing strokes)
 * into ONE transparent PNG, sized to the final output frame.
 *
 * Why one flatten pass instead of sending each overlay to Cloudinary as its
 * own layer: text/emoji/sticker rotation+scale and freehand drawing paths
 * are not all expressible as Cloudinary layer parameters (drawing strokes
 * especially), and even where they are, N overlays would be N chained
 * transformation components against a per-request size ceiling. Rendering
 * them once, here, to a single image is both more capable (draws anything
 * the editor can render) and cheaper (one Cloudinary layer, not N).
 *
 * Takes a ref to an already-rendered `OverlayLayer` (see
 * `components/video/OverlayLayer.tsx`), sized to the export dimensions and
 * positioned off-screen, and returns a local file `uri` ready to upload.
 * This is the only file in the module that imports `react-native-view-shot`.
 */
export async function flattenOverlays(
  overlayLayerRef: React.RefObject<View | null>,
  width: number,
  height: number
): Promise<string> {
  if (!overlayLayerRef.current) throw new Error("Overlay layer is not mounted.");

  return captureRef(overlayLayerRef, {
    format: "png",
    quality: 1,
    result: "tmpfile",
    width,
    height,
  });
}

/** Whether there is anything to flatten at all -- callers skip the capture
 * (and the extra Cloudinary upload it implies) entirely when this is false. */
export function hasOverlays(state: VideoEditorState): boolean {
  return (
    state.textOverlays.length > 0 ||
    state.emojiOverlays.length > 0 ||
    state.stickerOverlays.length > 0 ||
    state.drawingStrokes.length > 0
  );
}
