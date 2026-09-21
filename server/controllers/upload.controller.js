import {
  buildSignature,
  isConfigured,
  CLOUD_NAME,
  RESOURCE_TYPES,
} from "../config/cloudinary.js";

// Tells the client whether uploads are available, so it can hide the attach
// button rather than failing at the point of use.
export const status = (req, res) => {
  res.json({ configured: isConfigured, cloudName: CLOUD_NAME || null });
};

// Hands the client a short-lived signature for one upload.
//
// Signatures are per-request and carry a timestamp; Cloudinary rejects stale
// ones, so a leaked signature is not a standing grant.
export const signUpload = (req, res) => {
  if (!isConfigured) {
    return res.status(503).json({
      message:
        "Uploads are not configured. Set CLOUDINARY_CLOUD_NAME, " +
        "CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET on the server.",
    });
  }

  const kind = ["posts", "avatars", "events"].includes(req.body?.kind)
    ? req.body.kind
    : "posts";

  const resourceType = req.body?.resource_type;
  if (resourceType && !RESOURCE_TYPES.includes(resourceType)) {
    return res
      .status(400)
      .json({ message: `resource_type must be one of: ${RESOURCE_TYPES.join(", ")}` });
  }

  // The folder is derived from the authenticated user, never from the request
  // body, so a client cannot write into someone else's folder.
  res.json(buildSignature({ userId: req.user.id, kind }));
};
