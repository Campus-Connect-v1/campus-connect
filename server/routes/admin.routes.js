import express from "express";
import rateLimit from "express-rate-limit";

import { login, me } from "../controllers/admin/auth.controller.js";
import { getStats, getActivity } from "../controllers/admin/stats.controller.js";
import {
  listResourceTypes,
  list,
  getOne,
  create,
  update,
  remove,
  impact,
} from "../controllers/admin/resource.controller.js";
import * as operators from "../controllers/admin/operators.controller.js";
import { ask, status as aiStatus } from "../controllers/admin/ai.controller.js";
import {
  listPacks,
  runPack,
  importJson,
  setVerified,
} from "../controllers/admin/seed.controller.js";
import { requireOperator, requirePermission } from "../middleware/adminAuth.js";

const router = express.Router();

// Tighter than the public authLimiter: this endpoint guards every campus's
// data, and there is no legitimate reason to attempt it often.
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many login attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ---- public --------------------------------------------------------------
router.post("/auth/login", adminLoginLimiter, login);

// ---- everything below requires a valid operator token -------------------
router.use(requireOperator);

router.get("/auth/me", me);

router.get("/stats", requirePermission("read"), getStats);
router.get("/activity", requirePermission("read"), getActivity);

// Operator management: owner only.
router.get("/operators", requirePermission("manageOperators"), operators.list);
router.post("/operators", requirePermission("manageOperators"), operators.create);
router.patch("/operators/:id", requirePermission("manageOperators"), operators.update);
router.delete("/operators/:id", requirePermission("manageOperators"), operators.remove);

// Plain-English querying. Read-only by construction, but gated on "write"
// rather than "read": free-form SQL reaches every table, whereas the resource
// routes only expose what the registry whitelists.
router.get("/ai/status", requirePermission("read"), aiStatus);
router.post("/ai/sql", requirePermission("write"), ask);

// Populating the database: curated packs, pasted JSON, and bulk approval.
// All declared before the :resource wildcard so they are not swallowed by it.
router.get("/seed/packs", requirePermission("read"), listPacks);
router.post("/seed/packs/:pack", requirePermission("write"), runPack);
router.post("/seed/import/:resource", requirePermission("write"), importJson);
router.post("/seed/verify", requirePermission("write"), setVerified);

// Generic resources. Declared last so /operators and /seed above are not
// swallowed by the :resource wildcard.
router.get("/resources", requirePermission("read"), listResourceTypes);
router.get("/:resource", requirePermission("read"), list);
router.get("/:resource/:id", requirePermission("read"), getOne);
router.get("/:resource/:id/impact", requirePermission("read"), impact);
router.post("/:resource", requirePermission("write"), create);
router.patch("/:resource/:id", requirePermission("write"), update);
router.delete("/:resource/:id", requirePermission("write"), remove);

export default router;
