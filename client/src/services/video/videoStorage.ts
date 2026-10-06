import * as FileSystem from "expo-file-system/legacy";

import { api } from "@/src/services/api";

/**
 * VideoStorageProvider: the ONLY file in this module that knows the current
 * backend is Cloudinary.
 *
 * Every other file in `features/video` and `services/video` talks to
 * `CloudinaryVideoStorageProvider` through this interface. Swapping storage
 * providers (S3, Supabase, Firebase, Cloudflare R2, another Cloudinary
 * account) means writing one new class here and pointing
 * `videoStorageProvider` at it -- the editor, the upload manager, and every
 * consuming screen are unaffected.
 */
export interface UploadTarget {
  uploadUrl: string;
  fields: Record<string, string>;
  resourceType: "video" | "image";
}

export interface UploadOutcome {
  publicId: string;
  url: string;
  resourceType: "video" | "image";
  bytes: number;
  format: string | null;
}

export interface UploadHandle {
  result: Promise<UploadOutcome>;
  cancel: () => Promise<void>;
}

export interface VideoStorageProvider {
  requestUploadTarget(input: {
    kind: "posts" | "avatars" | "events";
    resourceType: "video" | "image";
    /** A Cloudinary-syntax transformation string, or undefined for a plain
     * upload (used for the overlay PNG and the audio track, which need no
     * processing of their own). */
    eager?: string;
  }): Promise<UploadTarget>;

  upload(
    target: UploadTarget,
    file: { uri: string; fileName: string; mimeType: string },
    onProgress?: (sentBytes: number, totalBytes: number) => void
  ): UploadHandle;

  /** Turns a stored video's URL into a still-frame thumbnail URL, with no
   * extra upload or storage of its own -- Cloudinary derives it on request
   * from the same public id. */
  deriveThumbnailUrl(videoUrl: string): string | null;
}

async function requestUploadTarget(input: {
  kind: "posts" | "avatars" | "events";
  resourceType: "video" | "image";
  eager?: string;
}): Promise<UploadTarget> {
  const response = await api.post("/upload/signature", {
    kind: input.kind,
    resource_type: input.resourceType,
    eager: input.eager,
  });

  const { cloudName, apiKey, timestamp, folder, signature, eager } = response.data as {
    cloudName: string;
    apiKey: string;
    timestamp: number;
    folder: string;
    signature: string;
    eager?: string;
  };

  const fields: Record<string, string> = {
    api_key: apiKey,
    timestamp: String(timestamp),
    signature,
    folder,
  };
  if (eager) fields.eager = eager;

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${input.resourceType}/upload`,
    fields,
    resourceType: input.resourceType,
  };
}

function upload(
  target: UploadTarget,
  file: { uri: string; fileName: string; mimeType: string },
  onProgress?: (sentBytes: number, totalBytes: number) => void
): UploadHandle {
  // A multipart upload straight from disk, not a FormData + fetch() built
  // from an in-memory blob: the whole point for video is that a 60-80MB file
  // is never pulled into JS memory, and this is the one API in the project
  // that reports real byte-level progress and supports a genuine cancel.
  const task = FileSystem.createUploadTask(
    target.uploadUrl,
    file.uri,
    {
      httpMethod: "POST",
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: "file",
      mimeType: file.mimeType,
      parameters: target.fields,
    },
    (progress) => onProgress?.(progress.totalBytesSent, progress.totalBytesExpectedToSend)
  );

  const result = task.uploadAsync().then((response) => {
    if (!response) throw new Error("Upload did not complete.");

    let body: {
      secure_url?: string;
      public_id?: string;
      resource_type?: string;
      bytes?: number;
      format?: string;
      eager?: { secure_url: string }[];
      error?: { message?: string };
    };
    try {
      body = JSON.parse(response.body);
    } catch {
      throw new Error("The upload server sent back something unreadable.");
    }

    if (response.status >= 300 || !body.secure_url || !body.public_id) {
      throw new Error(body.error?.message ?? "The upload was rejected. Try a different file.");
    }

    // The eager derivative -- the actually-edited output -- supersedes the
    // raw upload's own URL whenever one was requested and Cloudinary
    // returned it synchronously.
    const processedUrl = body.eager?.[0]?.secure_url ?? body.secure_url;

    return {
      publicId: body.public_id,
      url: processedUrl,
      resourceType: body.resource_type === "video" ? "video" : "image",
      bytes: body.bytes ?? 0,
      format: body.format ?? null,
    } satisfies UploadOutcome;
  });

  return { result, cancel: () => task.cancelAsync() };
}

function deriveThumbnailUrl(videoUrl: string): string | null {
  // res.cloudinary.com/<cloud>/video/upload/<transforms>/<version>/<path>.<ext>
  // Requesting the same public id with a jpg extension and `so_0` extracts
  // the first frame as a still image -- no extra asset stored.
  const match = videoUrl.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/)(.*)\.[a-zA-Z0-9]+$/);
  if (!match) return null;
  return `${match[1]}so_0,f_jpg/${match[2]}.jpg`;
}

export const cloudinaryVideoStorageProvider: VideoStorageProvider = {
  requestUploadTarget,
  upload,
  deriveThumbnailUrl,
};

/** The provider every other file in this module imports. Change this one
 * binding to point the whole module at a different backend. */
export const videoStorageProvider: VideoStorageProvider = cloudinaryVideoStorageProvider;
