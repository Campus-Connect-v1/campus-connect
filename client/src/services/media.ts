import * as ImagePicker from "expo-image-picker";

export interface PickedMedia {
  uri: string;
  kind: "image" | "video";
  width?: number;
  height?: number;
  /** Seconds, videos only. */
  duration?: number | null;
  fileName?: string | null;
  fileSize?: number | null;
}

export type PickResult =
  | { status: "picked"; media: PickedMedia }
  | { status: "cancelled" }
  | { status: "denied"; canAskAgain: boolean };

function toPicked(asset: ImagePicker.ImagePickerAsset): PickedMedia {
  return {
    uri: asset.uri,
    kind: asset.type === "video" ? "video" : "image",
    width: asset.width,
    height: asset.height,
    duration: asset.duration,
    fileName: asset.fileName,
    fileSize: asset.fileSize,
  };
}

/**
 * Opens the system library picker.
 *
 * Permission is requested HERE, at the moment the user taps attach, never on
 * mount — a library prompt fired on a screen the user has not asked anything
 * of is the fastest way to a permanent denial.
 */
export async function pickFromLibrary(
  media: "image" | "video" | "all" = "all"
): Promise<PickResult> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { status: "denied", canAskAgain: permission.canAskAgain };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes:
      media === "image" ? ["images"] : media === "video" ? ["videos"] : ["images", "videos"],
    allowsEditing: media === "image",
    // Square crop only makes sense for the avatar; posts keep their aspect.
    aspect: media === "image" ? [1, 1] : undefined,
    quality: 0.85,
    videoMaxDuration: 60,
  });

  if (result.canceled || !result.assets?.length) return { status: "cancelled" };
  return { status: "picked", media: toPicked(result.assets[0]) };
}

/** Same contract as `pickFromLibrary`, but through the camera. */
export async function captureWithCamera(media: "image" | "video" = "image"): Promise<PickResult> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    return { status: "denied", canAskAgain: permission.canAskAgain };
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: media === "video" ? ["videos"] : ["images"],
    allowsEditing: media === "image",
    aspect: media === "image" ? [1, 1] : undefined,
    quality: 0.85,
    videoMaxDuration: 60,
  });

  if (result.canceled || !result.assets?.length) return { status: "cancelled" };
  return { status: "picked", media: toPicked(result.assets[0]) };
}
