import { api, request, toMessage } from "./api";
import type { PickedMedia } from "./media";

interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
  uploadUrl: string;
}

export type UploadKind = "posts" | "avatars" | "events";

/** GET /upload/status is unauthenticated, so it can be read before sign-in. */
export async function fetchUploadStatus() {
  return request<{ configured: boolean; cloudName: string | null }>(() =>
    api.get("/upload/status")
  );
}

export type UploadResult =
  { success: true; url: string; kind: "image" | "video" } | { success: false; error: string };

/**
 * Uploads one file straight to Cloudinary and returns its hosted URL.
 *
 * The bytes never pass through our API: the server only signs the request, and
 * the device PUTs the file to Cloudinary directly. That keeps large video off
 * the Express process entirely, and the signature is per-request and
 * timestamped so a captured one is not a standing grant.
 */
export async function uploadMedia(
  media: PickedMedia,
  kind: UploadKind = "posts"
): Promise<UploadResult> {
  const signed = await request<UploadSignature>(() =>
    api.post("/upload/signature", { kind, resource_type: media.kind })
  );
  if (!signed.success) return { success: false, error: signed.error };

  const { apiKey, timestamp, folder, signature, uploadUrl } = signed.data;

  const form = new FormData();
  // React Native's FormData takes this {uri, type, name} shape rather than a
  // Blob; passing a Blob here uploads a zero-byte file on Android.
  form.append("file", {
    uri: media.uri,
    type: media.kind === "video" ? "video/mp4" : "image/jpeg",
    name: media.fileName ?? (media.kind === "video" ? "upload.mp4" : "upload.jpg"),
  } as unknown as Blob);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("folder", folder);

  try {
    const response = await fetch(uploadUrl, { method: "POST", body: form });
    const body = (await response.json()) as {
      secure_url?: string;
      resource_type?: string;
      error?: { message?: string };
    };

    if (!response.ok || !body.secure_url) {
      return {
        success: false,
        error: body.error?.message ?? "The upload was rejected. Try a different file.",
      };
    }

    return {
      success: true,
      url: body.secure_url,
      // Cloudinary is the authority on what it actually stored; /auto/upload
      // can classify a file differently from the picker's guess.
      kind: body.resource_type === "video" ? "video" : "image",
    };
  } catch (error) {
    return { success: false, error: toMessage(error) };
  }
}

/**
 * Whether the server has Cloudinary credentials, cached for the session.
 *
 * The promise itself is cached rather than the value, so several screens
 * mounting at once share one request instead of racing three.
 */
let statusPromise: Promise<boolean> | null = null;

export function uploadsEnabled(): Promise<boolean> {
  statusPromise ??= fetchUploadStatus().then((result) =>
    result.success ? result.data.configured : false
  );
  return statusPromise;
}
