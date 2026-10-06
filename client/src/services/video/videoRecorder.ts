import * as ImagePicker from "expo-image-picker";

import { videoUploadConfig } from "@/src/features/video/config";
import type { SourceVideo } from "@/src/features/video/types";

import { toSourceVideo } from "./videoMetadata";
import type { VideoPickResult } from "./videoPicker";

/**
 * Records a video with the system camera.
 *
 * There is no `expo-camera` dependency in this project, and none is needed:
 * `expo-image-picker`'s `launchCameraAsync` already opens the native camera
 * UI directly for video capture. Adding a second camera library just to
 * duplicate that would be exactly the kind of unnecessary dependency this
 * module is meant to avoid.
 */
export async function recordVideo(): Promise<VideoPickResult> {
  const camera = await ImagePicker.requestCameraPermissionsAsync();
  if (!camera.granted) return { status: "denied", canAskAgain: camera.canAskAgain };

  try {
    // There is no separate microphone-permission request in
    // expo-image-picker's JS API: the native camera sheet prompts for it
    // itself, the moment video recording actually starts, using the
    // `microphonePermission` string configured on the expo-image-picker
    // plugin in app.json.
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["videos"],
      quality: 1,
      videoMaxDuration: videoUploadConfig.maxDurationSeconds,
    });

    if (result.canceled || !result.assets?.length) return { status: "cancelled" };

    const asset = result.assets[0];
    const video: SourceVideo = await toSourceVideo({
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
    // Thrown (not a permission denial -- that's handled above) when there is
    // no working camera at all: every iOS Simulator, and any real device
    // whose camera hardware the OS itself couldn't open. Without this, the
    // rejection surfaces as a raw "Uncaught (in promise) Error: Camera..."
    // dev overlay instead of a message anyone could act on.
    return { status: "error", message: "The camera isn't available on this device right now." };
  }
}
