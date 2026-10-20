import multer from "multer";
import path from "node:path";
import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { httpError } from "../middleware/errorHandler.js";

export const profileRouter = Router();

const uploadDirectory = process.env.UPLOAD_DIR || "uploads/";
const upload = multer({
  dest: uploadDirectory,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const allowed = new Set([".png", ".jpg", ".jpeg", ".webp"]);
    const validMime = ["image/png", "image/jpeg", "image/webp"].includes(file.mimetype);
    const valid = allowed.has(extension) && validMime;
    callback(valid ? null : httpError(400, "Use a PNG, JPG, or WebP profile photo", undefined, "AVATAR_INVALID_FILE"), valid);
  },
});

profileRouter.post("/avatar", requireAuth, requireRole("student", "admin"), upload.single("avatar"), async (req, res, next) => {
  try {
    if (!req.file) throw httpError(400, "A profile photo is required", undefined, "AVATAR_FILE_REQUIRED");
    const student =
      req.user.role === "student"
        ? await prisma.studentProfile.findUniqueOrThrow({ where: { userId: req.user.id } })
        : await prisma.studentProfile.findUniqueOrThrow({ where: { id: req.body.studentId } });
    const avatarUrl = `/uploads/${req.file.filename}`;
    await prisma.studentProfile.update({ where: { id: student.id }, data: { avatarUrl } });
    res.status(201).json({ url: avatarUrl, fileName: req.file.originalname });
  } catch (error) {
    next(error);
  }
});
