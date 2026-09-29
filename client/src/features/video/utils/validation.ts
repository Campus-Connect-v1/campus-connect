import { videoUploadConfig } from "../config";
import type { SourceVideo, VideoValidationError } from "../types";

/**
 * Runs before the video is allowed into the editor.
 *
 * Kept as one pure function (no I/O) so it is trivially testable and so
 * every entry point -- gallery pick, camera capture, a future "edit this
 * post's video again" flow -- validates the same way.
 */
export function validateVideo(video: SourceVideo): VideoValidationError | null {
  if (!video.width || !video.height) {
    return {
      code: "no_dimensions",
      message: "That file could not be read as a video.",
    };
  }

  if (
    video.mimeType &&
    !(videoUploadConfig.allowedMimeTypes as readonly string[]).includes(video.mimeType)
  ) {
    return {
      code: "unsupported_format",
      message: "This video format isn't supported. Try MP4 or MOV.",
    };
  }

  if (video.durationMs < videoUploadConfig.minDurationSeconds * 1000) {
    return {
      code: "too_short",
      message: "That clip is too short to post.",
    };
  }

  if (video.durationMs > videoUploadConfig.maxDurationSeconds * 1000) {
    const max = videoUploadConfig.maxDurationSeconds;
    return {
      code: "too_long",
      message: `Videos can be at most ${Math.floor(max / 60)}:${String(max % 60).padStart(2, "0")} long.`,
    };
  }

  if (video.fileSizeBytes > videoUploadConfig.maxFileSizeBytes) {
    const maxMb = Math.round(videoUploadConfig.maxFileSizeBytes / (1024 * 1024));
    return {
      code: "too_large",
      message: `That video is larger than the ${maxMb} MB limit. Try a shorter clip or lower quality.`,
    };
  }

  return null;
}
