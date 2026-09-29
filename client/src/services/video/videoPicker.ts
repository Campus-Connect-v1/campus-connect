import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

import { videoUploadConfig } from "@/src/features/video/config";
import type { SourceVideo } from "@/src/features/video/types";

import { toSourceVideo } from "./videoMetadata";

export type VideoPickResult =
  | { status: "picked"; video: SourceVideo }
  | { status: "cancelled" }
  | { status: "denied"; canAskAgain: boolean }
  | { status: "error"; message: string };

/**
 * The video module's own picker entry points.
 *
 * This intentionally does not reuse `@/src/services/media`'s
 * `pickFromLibrary`: that helper serves photo pickers too (avatars, post
 * images) with a 60s/quality-0.85 cap tuned for that use. Video needs its
 * own config-driven duration and quality ceiling (`videoUploadConfig`), so
 * it calls `expo-image-picker` directly rather than inheriting a cap meant
 * for a different screen.
 */
export async function pickVideoFromGallery(): Promise<VideoPickResult> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return { status: "denied", canAskAgain: permission.canAskAgain };

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 1,
      videoMaxDuration: videoUploadConfig.maxDurationSeconds,
    });

    if (result.canceled || !result.assets?.length) return { status: "cancelled" };

    const asset = result.assets[0];
    const video = await toSourceVideo({
      uri: asset.uri,
      kind: "video",
      width: asset.width,
      height: asset.height,
      duration: asset.duration,
      fileName: asset.fileName,
      fileSize: asset.fileSize,
    });
    return { status: "picked", video };
  } catch {
    return { status: "error", message: "Couldn't open your photo library. Try again." };
  }
}

/**
 * Picks a video from Files (iCloud Drive, "On My iPhone", Downloads, a
 * connected cloud provider) rather than the Photos library -- the Photos
 * picker above can only ever see what is actually in the Photos app, so a
 * video that only exists in, say, Downloads is invisible to it. This is
 * the module's answer to that gap.
 */
export async function pickVideoFromFiles(): Promise<VideoPickResult> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "video/*",
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) return { status: "cancelled" };

    const asset = result.assets[0];
    const video = await toSourceVideo({
      uri: asset.uri,
      kind: "video",
      width: undefined,
      height: undefined,
      duration: undefined,
      fileName: asset.name,
      fileSize: asset.size ?? undefined,
    });
    return { status: "picked", video };
  } catch {
    return { status: "error", message: "Couldn't open that file. Try a different one." };
  }
}
