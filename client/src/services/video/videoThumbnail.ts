import * as VideoThumbnails from "expo-video-thumbnails";

import { videoUploadConfig } from "@/src/features/video/config";

export interface VideoThumbnailResult {
  uri: string;
  width: number;
  height: number;
}

/**
 * Grabs one frame as a local JPEG. This is the ONLY place that calls
 * `expo-video-thumbnails` -- swapping the thumbnail strategy (a different
 * frame, a server-side grab, an animated preview) is a change here alone.
 */
export async function generateThumbnail(
  videoUri: string,
  atMillisecond: number = videoUploadConfig.thumbnail.atMillisecond
): Promise<VideoThumbnailResult | null> {
  try {
    const result = await VideoThumbnails.getThumbnailAsync(videoUri, {
      time: atMillisecond,
      quality: videoUploadConfig.thumbnail.quality,
    });
    return { uri: result.uri, width: result.width, height: result.height };
  } catch {
    // A missing thumbnail should not block the flow -- the preview screen
    // falls back to a placeholder rather than treating this as fatal.
    return null;
  }
}
