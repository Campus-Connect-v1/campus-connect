// Cloudinary, signed direct upload.
//
// The client uploads straight to Cloudinary and sends us back the resulting
// URL. Bytes never pass through this server, which matters on a small
// instance: proxying uploads would tie up the event loop and burn the free
// tier's instance-hours for no benefit.
//
// The flow:
//   1. client asks this server for a signature  (authenticated)
//   2. client POSTs the file + signature to Cloudinary
//   3. client sends the returned secure_url to POST /api/social/posts
//
// The api_secret never leaves the server. Signing here is also what stops
// anonymous uploads into your account -- an unsigned preset would let anyone
// who found the cloud name fill it up.

import crypto from "node:crypto";

export const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "";
const API_KEY = process.env.CLOUDINARY_API_KEY || "";
const API_SECRET = process.env.CLOUDINARY_API_SECRET || "";

export const isConfigured = Boolean(CLOUD_NAME && API_KEY && API_SECRET);

// Folders are namespaced per user so one account cannot overwrite another's
// media by guessing a public_id.
export const folderFor = (userId, kind) =>
  `campus-connect/${kind}/${userId}`;

export const RESOURCE_TYPES = ["image", "video"];

// Cloudinary's scheme: take every parameter that will be sent except file,
// cloud_name, resource_type and api_key; sort by key; join as k=v&k=v; append
// the api_secret; SHA-1 the result.
export const sign = (params) => {
  const toSign = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== "")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto
    .createHash("sha1")
    .update(toSign + API_SECRET)
    .digest("hex");
};

export const buildSignature = ({ userId, kind = "posts", publicId }) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    timestamp,
    folder: folderFor(userId, kind),
    ...(publicId ? { public_id: publicId } : {}),
  };

  return {
    cloudName: CLOUD_NAME,
    apiKey: API_KEY,
    timestamp,
    folder: params.folder,
    signature: sign(params),
    // Where the client PUTs the file. resource_type is chosen client-side by
    // what is actually being uploaded, and is not part of the signature.
    uploadUrl: `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
  };
};

// Delete everything under one folder prefix, for both resource types.
//
// Used by the account purge: uploads live under folderFor(userId, kind), so a
// user's media is exactly what sits under campus-connect/<kind>/<userId>/. The
// trailing slash is load-bearing -- without it the prefix for user_1 would also
// match user_10, user_11 and so on.
//
// The Admin API deletes at most 1000 resources per call and reports `partial`
// while more remain, so this loops; the cap stops a misbehaving response from
// spinning forever. Returns the number deleted. Throws on an HTTP error so the
// caller can log it -- media is best-effort and must never block a purge.
export const deleteByPrefix = async (prefix) => {
  if (!isConfigured) return 0;
  if (!prefix.endsWith("/")) throw new Error(`prefix must end in "/": ${prefix}`);

  const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString("base64");
  let deleted = 0;

  for (const type of RESOURCE_TYPES) {
    for (let page = 0; page < 50; page++) {
      const url =
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/${type}/upload` +
        `?prefix=${encodeURIComponent(prefix)}`;
      const response = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Basic ${auth}` },
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) {
        throw new Error(`Cloudinary ${type} delete ${response.status}: ${await response.text()}`);
      }
      const body = await response.json();
      deleted += Object.keys(body.deleted || {}).length;
      if (!body.partial) break;
    }
  }
  return deleted;
};

// Only accept media URLs that came from our own cloud.
//
// Without this, media_url is an arbitrary string: a post could point at any
// URL on the internet, including a tracking pixel or something that later
// turns into content you did not approve. Checking the host and the cloud
// name means the file is one we actually hold.
const HOSTS = new Set(["res.cloudinary.com", "cloudinary-a.akamaihd.net"]);

export const isOwnMediaUrl = (value) => {
  if (!value) return true; // nothing to check -- text-only posts are fine
  if (!isConfigured) return true; // not set up yet; do not block posting
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  if (!HOSTS.has(url.hostname)) return false;
  // Path is /<cloud_name>/<resource_type>/upload/...
  return url.pathname.startsWith(`/${CLOUD_NAME}/`);
};
