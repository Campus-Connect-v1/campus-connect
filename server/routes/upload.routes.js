import express from "express";
import authenticate from "../middleware/auth.js";
import { status, signUpload } from "../controllers/upload.controller.js";

const router = express.Router();

// Public: lets the client decide whether to show an attach control at all.
router.get("/status", status);

// Everything below needs a signed-in user -- the upload folder is derived
// from their id.
router.use(authenticate);
router.post("/signature", signUpload);

export default router;
