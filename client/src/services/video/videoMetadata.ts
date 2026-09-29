import { File } from "expo-file-system";
import { createVideoPlayer } from "expo-video";

import type { PickedMedia } from "@/src/services/media";
import type { SourceVideo } from "@/src/features/video/types";

/**
 * Fills in whatever the picker didn't already give us.
 *
 * `expo-image-picker` usually reports duration/width/height/fileSize itself,
 * but is not guaranteed to on every OS/picker combination -- this is the one
 * place that probes the file directly (via `expo-file-system`, for size)
 * rather than every call site doing its own fallback.
 */
export async function toSourceVideo(media: PickedMedia): Promise<SourceVideo> {
  let fileSizeBytes = media.fileSize ?? 0;

  if (!fileSizeBytes) {
    try {
      const file = new File(media.uri);
      if (file.exists) fileSizeBytes = file.size ?? 0;
    } catch {
      // Falls through with 0; a size probe failing should not itself block
      // an otherwise perfectly playable video.
    }
  }

  let durationMs = media.duration ?? 0;
  let width = media.width ?? 0;
  let height = media.height ?? 0;

  // A source that came from Files (expo-document-picker) has none of these --
  // that picker only ever reports uri/name/size, never video metadata. Probe
  // the file itself rather than leaving the editor with a 0-length timeline.
  if (!durationMs || !width || !height) {
    const probed = await probeVideoMetadata(media.uri);
    if (probed) {
      durationMs = durationMs || probed.durationMs;
      width = width || probed.width;
      height = height || probed.height;
    }
  }

  return {
    uri: media.uri,
    fileName: media.fileName ?? null,
    mimeType: "video/mp4",
    fileSizeBytes,
    durationMs,
    width,
    height,
  };
}

/**
 * Reads duration/width/height directly off the video file, for sources a
 * picker didn't already report them for. Uses `expo-video`'s player as a
 * one-shot metadata probe (never rendered, released immediately after) --
 * there is no lighter-weight way to read a video's own metadata in this
 * Expo SDK version without a native module built for exactly that.
 */
function probeVideoMetadata(
  uri: string
): Promise<{ durationMs: number; width: number; height: number } | null> {
  return new Promise((resolve) => {
    const player = createVideoPlayer(uri);
    let settled = false;

    const finish = (result: { durationMs: number; width: number; height: number } | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      player.release();
      resolve(result);
    };

    const subscription = player.addListener("sourceLoad", (payload) => {
      subscription.remove();
      const track = payload.availableVideoTracks[0];
      finish({
        durationMs: Math.round(payload.duration * 1000),
        width: track?.size.width ?? 0,
        height: track?.size.height ?? 0,
      });
    });

    // A file that fails to load (corrupted, unsupported codec) should not
    // hang the picker forever waiting for an event that will never fire.
    const timer = setTimeout(() => finish(null), 5000);
  });
}
