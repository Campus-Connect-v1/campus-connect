import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { Alert } from "react-native";
import { env, uploadsEnabled } from "../config/env";
import { toApiError, type ApiResult } from "./api";

/**
 * Image capture + upload. Picking/taking a photo works out of the box; upload
 * targets Cloudinary's unsigned upload API, configured via env
 * (EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME + _UPLOAD_PRESET). The upload provider is
 * isolated here so it can later be swapped for a server endpoint or Firebase.
 */

const PICKER_OPTS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  allowsEditing: true,
  aspect: [4, 3],
  quality: 0.3,
  base64: true,
};

const VIDEO_OPTS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["videos"],
  allowsEditing: true,
  quality: 0.5,
  videoMaxDuration: 15,
};

const MAX_VIDEO_MS = 15_000;
const MAX_DB_VIDEO_BASE64_BYTES = 30 * 1024 * 1024;

export interface LocalImageAttachment {
  uri: string;
  dataUri?: string;
}

export interface LocalVideoAttachment {
  uri: string;
  durationMs?: number | null;
  dataUri?: string;
}

function toAttachment(asset: ImagePicker.ImagePickerAsset): LocalImageAttachment {
  const mimeType = asset.mimeType ?? "image/jpeg";
  return {
    uri: asset.uri,
    dataUri: asset.base64 ? `data:${mimeType};base64,${asset.base64}` : undefined,
  };
}

async function toVideoAttachment(
  asset: ImagePicker.ImagePickerAsset,
): Promise<LocalVideoAttachment | null> {
  if (asset.duration != null && asset.duration > MAX_VIDEO_MS + 500) {
    Alert.alert("Video too long", "Videos can be 15 seconds max.");
    return null;
  }

  const file = new File(asset.uri);
  const info = file.info();
  if (file.exists && info.size && info.size > MAX_DB_VIDEO_BASE64_BYTES) {
    return { uri: asset.uri, durationMs: asset.duration };
  }

  try {
    const base64 = await file.base64();
    const mimeType = asset.mimeType ?? "video/mp4";
    return {
      uri: asset.uri,
      durationMs: asset.duration,
      dataUri: `data:${mimeType};base64,${base64}`,
    };
  } catch {
    return { uri: asset.uri, durationMs: asset.duration };
  }
}

/** Pick an image from the library. Returns local preview + optional DB-safe data uri. */
export async function pickFromLibrary(): Promise<LocalImageAttachment | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert("Permission needed", "Allow photo access to attach an image.");
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTS);
  return result.canceled ? null : toAttachment(result.assets[0]);
}

/** Take a photo with the camera. Returns local preview + optional DB-safe data uri. */
export async function takePhoto(): Promise<LocalImageAttachment | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert("Permission needed", "Allow camera access to take a photo.");
    return null;
  }
  const result = await ImagePicker.launchCameraAsync(PICKER_OPTS);
  return result.canceled ? null : toAttachment(result.assets[0]);
}

/** Pick a video from the library. Enforces the 15 second cap when duration is available. */
export async function pickVideoFromLibrary(): Promise<LocalVideoAttachment | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert("Permission needed", "Allow photo access to attach a video.");
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync(VIDEO_OPTS);
  return result.canceled ? null : toVideoAttachment(result.assets[0]);
}

/** Record a camera video, capped at 15 seconds by the native picker. */
export async function takeVideo(): Promise<LocalVideoAttachment | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert("Permission needed", "Allow camera access to record a video.");
    return null;
  }
  const result = await ImagePicker.launchCameraAsync(VIDEO_OPTS);
  return result.canceled ? null : toVideoAttachment(result.assets[0]);
}

/** Upload a local image/video uri and resolve to a hosted URL. */
export async function uploadMedia(
  uri: string,
  mediaType: "image" | "video",
): Promise<ApiResult<string>> {
  if (!uploadsEnabled()) {
    return {
      success: false,
      error: {
        message:
          "Image uploads aren't configured yet. Add your Cloudinary keys to enable them.",
      },
    };
  }

  const form = new FormData();
  // React Native's FormData accepts this { uri, name, type } file shape.
  form.append("file", {
    uri,
    name: `post_${Date.now()}.${mediaType === "video" ? "mp4" : "jpg"}`,
    type: mediaType === "video" ? "video/mp4" : "image/jpeg",
  } as unknown as Blob);
  form.append("upload_preset", env.cloudinaryPreset);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${env.cloudinaryCloud}/${mediaType}/upload`,
      { method: "POST", body: form },
    );
    const data = (await res.json()) as {
      secure_url?: string;
      error?: { message?: string };
    };
    if (data.secure_url) return { success: true, data: data.secure_url };
    return {
      success: false,
      error: { message: data.error?.message ?? "Upload failed" },
    };
  } catch (error) {
    return { success: false, error: toApiError(error) };
  }
}

/** Upload a local image uri and resolve to a hosted https URL. */
export function uploadImage(uri: string): Promise<ApiResult<string>> {
  return uploadMedia(uri, "image");
}

/** Prefer Cloudinary when configured; otherwise store the compressed data URI in DB. */
export async function resolveImageForPost(
  image: LocalImageAttachment,
): Promise<ApiResult<string>> {
  if (uploadsEnabled()) {
    const upload = await uploadMedia(image.uri, "image");
    if (upload.success) return upload;
  }

  if (image.dataUri) return { success: true, data: image.dataUri };

  return {
    success: false,
    error: {
      message:
        "This image could not be prepared for posting. Try a smaller image or configure Cloudinary.",
    },
  };
}

/** Prefer Cloudinary when configured; otherwise store a short video data URI in DB. */
export async function resolveVideoForPost(
  video: LocalVideoAttachment,
): Promise<ApiResult<string>> {
  if (video.durationMs != null && video.durationMs > MAX_VIDEO_MS + 500) {
    return {
      success: false,
      error: { message: "Videos can be 15 seconds max." },
    };
  }

  if (uploadsEnabled()) {
    const upload = await uploadMedia(video.uri, "video");
    if (upload.success) return upload;
  }

  if (video.dataUri) return { success: true, data: video.dataUri };

  return {
    success: false,
    error: {
      message:
        "This video is too large for database fallback. Use a shorter clip or configure Cloudinary.",
    },
  };
}
