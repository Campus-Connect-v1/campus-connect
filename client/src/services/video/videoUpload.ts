import type { RefObject } from "react";
import type { View } from "react-native";

import type { VideoQualityId } from "@/src/features/video/config";
import type {
  SourceVideo,
  UploadStage,
  VideoEditorState,
  VideoMetadataRecord,
  VideoUploadProgress,
  VideoUploadResult,
} from "@/src/features/video/types";

import { flattenOverlays, hasOverlays } from "./videoCompositor";
import { buildProcessingPlan } from "./videoProcessor";
import { videoStorageProvider } from "./videoStorage";
import { generateThumbnail } from "./videoThumbnail";

export interface StartUploadOptions {
  source: SourceVideo;
  state: VideoEditorState;
  quality: VideoQualityId;
  kind: "posts" | "avatars" | "events";
  /** Output frame size the transformation targets -- the compositor renders
   * the overlay flatten at exactly this size so it lines up pixel for
   * pixel with what Cloudinary produces. */
  outputWidth: number;
  outputHeight: number;
  /** Only required when the editor state actually has overlays. */
  overlayLayerRef?: RefObject<View | null>;
  onStageChange?: (stage: UploadStage) => void;
  onProgress?: (progress: VideoUploadProgress) => void;
}

export interface UploadSession {
  result: Promise<VideoUploadResult>;
  cancel: () => void;
}

class CancelledError extends Error {
  constructor() {
    super("cancelled");
  }
}

/**
 * VideoUploadManager: the only place that runs the upload pipeline end to
 * end (section 15's SELECT→...→COMPLETE stages, from PROCESS onward). A
 * consuming screen never talks to `videoStorageProvider` or the Cloudinary
 * response shape directly -- it calls `startVideoUpload` and reacts to
 * stage/progress callbacks and the final result.
 *
 * `f_mp4` (part of the built transformation) means Cloudinary compresses
 * and re-encodes video synchronously as part of this same upload request,
 * bounded to fit inside the quality preset's bitrate/dimension ceiling --
 * there is no separate compress step in this file because the network call
 * below IS that step, not a stage before or after it.
 */
export function startVideoUpload(options: StartUploadOptions): UploadSession {
  let cancelled = false;
  let cancelCurrent: (() => void) | null = null;

  const cancel = () => {
    cancelled = true;
    cancelCurrent?.();
  };

  const guard = () => {
    if (cancelled) throw new CancelledError();
  };

  const run = async (): Promise<VideoUploadResult> => {
    const setStage = (stage: UploadStage) => options.onStageChange?.(stage);

    setStage("processing");
    guard();

    let overlayImagePublicId: string | undefined;
    if (hasOverlays(options.state)) {
      if (!options.overlayLayerRef) {
        throw new Error("This video has overlays but no overlay layer was provided to flatten them.");
      }
      const overlayUri = await flattenOverlays(
        options.overlayLayerRef,
        options.outputWidth,
        options.outputHeight
      );
      guard();

      const target = await videoStorageProvider.requestUploadTarget({
        kind: options.kind,
        resourceType: "image",
      });
      const handle = videoStorageProvider.upload(target, {
        uri: overlayUri,
        fileName: "overlay.png",
        mimeType: "image/png",
      });
      cancelCurrent = handle.cancel;
      const outcome = await handle.result;
      cancelCurrent = null;
      overlayImagePublicId = outcome.publicId;
    }

    let audioTrackPublicId: string | undefined;
    if (options.state.audio.track) {
      guard();
      const target = await videoStorageProvider.requestUploadTarget({
        kind: options.kind,
        resourceType: "video", // Cloudinary stores standalone audio as a video resource.
      });
      const handle = videoStorageProvider.upload(target, {
        uri: options.state.audio.track.uri,
        fileName: options.state.audio.track.name,
        mimeType: "audio/mpeg",
      });
      cancelCurrent = handle.cancel;
      const outcome = await handle.result;
      cancelCurrent = null;
      audioTrackPublicId = outcome.publicId;
    }

    guard();
    setStage("generating_thumbnail");
    const localThumbnail = await generateThumbnail(options.source.uri);

    guard();
    const { transformation } = buildProcessingPlan({
      source: options.source,
      state: options.state,
      quality: options.quality,
      overlayImagePublicId,
      audioTrackPublicId,
    });

    setStage("uploading");
    guard();
    const target = await videoStorageProvider.requestUploadTarget({
      kind: options.kind,
      resourceType: "video",
      eager: transformation,
    });

    const handle = videoStorageProvider.upload(
      target,
      {
        uri: options.source.uri,
        fileName: options.source.fileName ?? "video.mp4",
        mimeType: options.source.mimeType,
      },
      (sent, total) => options.onProgress?.({ bytesSent: sent, bytesTotal: total, fraction: total ? sent / total : 0 })
    );
    cancelCurrent = handle.cancel;
    const outcome = await handle.result;
    cancelCurrent = null;

    setStage("verifying");
    guard();
    if (!outcome.url.startsWith("https://res.cloudinary.com/")) {
      throw new Error("The upload finished, but the server did not return a valid asset.");
    }

    const thumbnailUrl = videoStorageProvider.deriveThumbnailUrl(outcome.url) ?? localThumbnail?.uri ?? null;

    const metadata: VideoMetadataRecord = {
      id: outcome.publicId,
      originalName: options.source.fileName,
      mimeType: options.source.mimeType,
      originalFileSizeBytes: options.source.fileSizeBytes,
      processedFileSizeBytes: outcome.bytes || null,
      durationMs: options.state.trim.endMs - options.state.trim.startMs,
      width: options.outputWidth,
      height: options.outputHeight,
      thumbnailUrl,
      quality: options.quality,
      caption: options.state.caption,
      processingStatus: "ready",
      uploadStatus: "completed",
      storagePath: outcome.publicId,
      createdAt: new Date().toISOString(),
    };

    setStage("completed");

    return {
      url: outcome.url,
      thumbnailUrl,
      durationMs: metadata.durationMs,
      width: options.outputWidth,
      height: options.outputHeight,
      caption: options.state.caption,
      quality: options.quality,
      metadata,
    };
  };

  const result = run().catch((error) => {
    if (error instanceof CancelledError) {
      options.onStageChange?.("cancelled");
    } else {
      options.onStageChange?.("failed");
    }
    throw error;
  });

  return { result, cancel };
}
