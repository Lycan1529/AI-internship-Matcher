import { Router } from "express";
import multer from "multer";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { parseCvFile } from "../services/cvService.js";

export const cvRouter = Router();
const upload = multer({ dest: process.env.UPLOAD_DIR || "uploads/" });

cvRouter.post("/upload", requireAuth, requireRole("student", "admin"), upload.single("cv"), async (req, res) => {
  res.status(201).json({
    fileName: req.file.originalname,
    storedPath: req.file.path,
    url: `/${req.file.path}`,
  });
});

cvRouter.post("/parse", requireAuth, requireRole("student", "admin"), upload.single("cv"), async (req, res, next) => {
  try {
    const parsed = await parseCvFile(req.file.path);
    res.json(parsed);
  } catch (error) {
    next(error);
  }
});
