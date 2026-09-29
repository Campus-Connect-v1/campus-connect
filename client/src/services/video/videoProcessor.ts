import { buildCloudinaryTransformation, joinTransformation } from "@/src/features/video/editor/transformations";
import type { VideoQualityId } from "@/src/features/video/config";
import type { SourceVideo, VideoEditorState } from "@/src/features/video/types";

/**
 * The "PROCESS" pipeline stage: turns a `VideoEditorState` into a concrete
 * processing plan for the storage provider to execute.
 *
 * This is intentionally thin -- the Cloudinary-specific string-building
 * lives in `features/video/editor/transformations.ts`, which is the layer
 * that would need to change if the storage provider changes. This file is
 * the stable seam between "the editor produced a configuration" and
 * "the storage provider was told what to do with it", so a future
 * non-Cloudinary processor swaps out `transformations.ts`'s caller here
 * without the editor or the upload manager knowing.
 */
export function buildProcessingPlan(options: {
  source: SourceVideo;
  state: VideoEditorState;
  quality: VideoQualityId;
  overlayImagePublicId?: string;
  audioTrackPublicId?: string;
}): { transformation: string } {
  const components = buildCloudinaryTransformation(options);
  return { transformation: joinTransformation(components) };
}
