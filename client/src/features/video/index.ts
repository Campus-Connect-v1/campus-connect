/**
 * Public surface of the video module.
 *
 * A consuming screen needs exactly two imports:
 *   import { useVideoUpload } from "@/src/hooks/useVideoUpload";
 *   import { VideoUploadFlow } from "@/src/components/video/VideoUploadFlow";
 *
 * Everything below is exported for the rare case a screen needs a type (the
 * shape of the result it gets back) or wants to read config -- never for
 * reaching into the editor, the storage provider, or any individual tool.
 */
export { videoUploadConfig, type VideoQualityId, type VideoQualityPreset } from "./config";
export type {
  SourceVideo,
  VideoEditorState,
  VideoMetadataRecord,
  VideoUploadResult,
  VideoValidationError,
  FilterId,
  CropAspect,
  RotationDegrees,
} from "./types";
