import { useCallback, useRef, useState } from "react";
import type { View } from "react-native";

import { videoUploadConfig, type VideoQualityId } from "@/src/features/video/config";
import { initialEditorState } from "@/src/features/video/editorReducer";
import type {
  SourceVideo,
  UploadStage,
  VideoEditorState,
  VideoUploadProgress,
  VideoUploadResult,
  VideoValidationError,
} from "@/src/features/video/types";
import { validateVideo } from "@/src/features/video/utils/validation";
import { pickVideoFromFiles, pickVideoFromGallery } from "@/src/services/video/videoPicker";
import { recordVideo } from "@/src/services/video/videoRecorder";
import { generateThumbnail } from "@/src/services/video/videoThumbnail";
import { startVideoUpload, type UploadSession } from "@/src/services/video/videoUpload";

export type VideoUploadPhase = "closed" | "picking" | "preview" | "editing" | "uploading";

export interface VideoUploadHookState {
  phase: VideoUploadPhase;
  source: SourceVideo | null;
  validationError: VideoValidationError | null;
  thumbnailUri: string | null;
  editorState: VideoEditorState | null;
  quality: VideoQualityId;
  frameSize: { width: number; height: number } | null;
  overlayLayerRef: React.RefObject<View | null> | null;
  uploadStage: UploadStage;
  uploadProgress: VideoUploadProgress | null;
  uploadErrorMessage: string | null;
  permissionDenied: { canAskAgain: boolean } | null;
  /** A picker/recorder failure that isn't a permission denial (no working
   * camera, a file that couldn't be read) -- distinct from
   * `uploadErrorMessage`, which is only ever about the upload pipeline. */
  pickerError: string | null;
}

export interface UseVideoUploadOptions {
  kind: "posts" | "avatars" | "events";
}

/**
 * The module's public entry point.
 *
 * A consuming screen never imports a picker, an editor component, or the
 * upload manager directly -- it calls `open()` and gets back either a
 * finished `VideoUploadResult` or `null` (the user backed out). Everything
 * between those two points -- picking, editing (a valid pick goes straight
 * there; an invalid one stops at a short explanation instead), uploading,
 * retrying a failed upload -- is owned by this hook and the UI it drives
 * through `state`/the setters a screen wires into `<VideoUploadFlow>`.
 *
 * Usage from any screen:
 * ```tsx
 * const video = useVideoUpload({ kind: "posts" });
 * const onAttach = async () => {
 *   const result = await video.open();
 *   if (result) setAttachedVideoUrl(result.url);
 * };
 * return (
 *   <>
 *     <VideoUploadFlow video={video} />
 *     <YourScreen onAttach={onAttach} />
 *   </>
 * );
 * ```
 * `VideoUploadFlow` (in `components/video`) is the one piece of UI this
 * hook needs mounted -- it renders whichever sub-screen `state.phase` calls
 * for and is the only file that imports the picker/preview/editor/progress
 * components directly.
 */
export function useVideoUpload({ kind }: UseVideoUploadOptions) {
  const [state, setState] = useState<VideoUploadHookState>({
    phase: "closed",
    source: null,
    validationError: null,
    thumbnailUri: null,
    editorState: null,
    quality: videoUploadConfig.defaultQuality,
    frameSize: null,
    overlayLayerRef: null,
    uploadStage: "idle",
    uploadProgress: null,
    uploadErrorMessage: null,
    permissionDenied: null,
    pickerError: null,
  });

  const resolver = useRef<((result: VideoUploadResult | null) => void) | null>(null);
  const session = useRef<UploadSession | null>(null);

  const finish = useCallback((result: VideoUploadResult | null) => {
    resolver.current?.(result);
    resolver.current = null;
    session.current = null;
    setState((s) => ({ ...s, phase: "closed" }));
  }, []);

  const open = useCallback((): Promise<VideoUploadResult | null> => {
    setState((s) => ({ ...s, phase: "picking", permissionDenied: null, pickerError: null }));
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const cancel = useCallback(() => {
    session.current?.cancel();
    finish(null);
  }, [finish]);

  const afterPick = useCallback(async (video: SourceVideo) => {
    const validationError = validateVideo(video);
    const thumbnail = await generateThumbnail(video.uri);
    setState((s) => ({
      ...s,
      // A valid video goes straight into the editor -- there is nothing to
      // decide on a separate "preview" screen when the only next step is
      // always "edit it". `preview` is now reached only when validation
      // failed, where it has an actual job: explain why and offer to
      // discard, since there is no editor to send an invalid video into.
      phase: validationError ? "preview" : "editing",
      source: video,
      validationError,
      thumbnailUri: thumbnail?.uri ?? null,
      editorState: validationError ? null : initialEditorState(video),
    }));
  }, []);

  const selectFromGallery = useCallback(async () => {
    setState((s) => ({ ...s, pickerError: null }));
    const result = await pickVideoFromGallery();
    if (result.status === "denied") {
      setState((s) => ({ ...s, permissionDenied: { canAskAgain: result.canAskAgain } }));
      return;
    }
    if (result.status === "error") {
      setState((s) => ({ ...s, pickerError: result.message }));
      return;
    }
    if (result.status === "cancelled") return;
    await afterPick(result.video);
  }, [afterPick]);

  const selectFromFiles = useCallback(async () => {
    setState((s) => ({ ...s, pickerError: null }));
    const result = await pickVideoFromFiles();
    if (result.status === "denied") {
      setState((s) => ({ ...s, permissionDenied: { canAskAgain: result.canAskAgain } }));
      return;
    }
    if (result.status === "error") {
      setState((s) => ({ ...s, pickerError: result.message }));
      return;
    }
    if (result.status === "cancelled") return;
    await afterPick(result.video);
  }, [afterPick]);

  const record = useCallback(async () => {
    setState((s) => ({ ...s, pickerError: null }));
    const result = await recordVideo();
    if (result.status === "denied") {
      setState((s) => ({ ...s, permissionDenied: { canAskAgain: result.canAskAgain } }));
      return;
    }
    if (result.status === "error") {
      setState((s) => ({ ...s, pickerError: result.message }));
      return;
    }
    if (result.status === "cancelled") return;
    await afterPick(result.video);
  }, [afterPick]);

  const discardPreview = useCallback(() => finish(null), [finish]);

  const cancelEditing = useCallback(() => finish(null), [finish]);

  const startUpload = useCallback(
    (
      result: { state: VideoEditorState; quality: VideoQualityId; frameWidth: number; frameHeight: number },
      overlayLayerRef: React.RefObject<View | null>
    ) => {
      setState((s) =>
        s.source
          ? {
              ...s,
              phase: "uploading",
              editorState: result.state,
              quality: result.quality,
              frameSize: { width: result.frameWidth, height: result.frameHeight },
              overlayLayerRef,
              uploadStage: "processing",
              uploadProgress: null,
              uploadErrorMessage: null,
            }
          : s
      );

      setState((current) => {
        if (!current.source) return current;
        session.current = startVideoUpload({
          source: current.source,
          state: result.state,
          quality: result.quality,
          kind,
          outputWidth: result.frameWidth,
          outputHeight: result.frameHeight,
          overlayLayerRef,
          onStageChange: (uploadStage) => setState((s) => ({ ...s, uploadStage })),
          onProgress: (uploadProgress) => setState((s) => ({ ...s, uploadProgress })),
        });

        session.current.result
          .then((uploadResult) => finish(uploadResult))
          .catch((error) => {
            if (error?.message === "cancelled") return;
            setState((s) => ({ ...s, uploadErrorMessage: error?.message ?? "The upload failed. Try again." }));
          });

        return current;
      });
    },
    [finish, kind]
  );

  const retryUpload = useCallback(() => {
    if (!state.source || !state.editorState || !state.frameSize || !state.overlayLayerRef) return;
    startUpload(
      {
        state: state.editorState,
        quality: state.quality,
        frameWidth: state.frameSize.width,
        frameHeight: state.frameSize.height,
      },
      state.overlayLayerRef
    );
  }, [state, startUpload]);

  return {
    state,
    open,
    cancel,
    selectFromGallery,
    selectFromFiles,
    record,
    discardPreview,
    cancelEditing,
    startUpload,
    retryUpload,
  };
}

export type UseVideoUploadReturn = ReturnType<typeof useVideoUpload>;
