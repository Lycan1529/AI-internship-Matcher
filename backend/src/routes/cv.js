import { Router } from "express";
import multer from "multer";
import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { parseCvFile } from "../services/cvService.js";
import { httpError } from "../middleware/errorHandler.js";

export const cvRouter = Router();
const uploadDirectory = process.env.UPLOAD_DIR || "uploads/";
const upload = multer({
  dest: uploadDirectory,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const validMime = !file.mimetype || file.mimetype === "application/pdf";
    callback(validMime && extension === ".pdf" ? null : httpError(400, "Only PDF CV files are accepted", undefined, "CV_INVALID_FILE"), validMime && extension === ".pdf");
  },
});

async function resolveStudent(req) {
  if (req.user.role === "student") {
    return prisma.studentProfile.findUniqueOrThrow({ where: { userId: req.user.id } });
  }
  if (!req.body.studentId) throw httpError(400, "studentId is required for admin CV actions", undefined, "VALIDATION_ERROR");
  return prisma.studentProfile.findUniqueOrThrow({ where: { id: req.body.studentId } });
}

async function persistCv(req, parsed = null) {
  if (!req.file) throw httpError(400, "A PDF CV file is required", undefined, "CV_FILE_REQUIRED");
  const student = await resolveStudent(req);
  const fileUrl = `/uploads/${req.file.filename}`;
  const document = await prisma.cVDocument.create({
    data: {
      studentId: student.id,
      fileName: req.file.originalname,
      fileUrl,
      mimeType: req.file.mimetype || "application/pdf",
      sizeBytes: req.file.size,
      parsedText: parsed?.textPreview,
      parsedData: parsed ? parsed : undefined,
      parseStatus: parsed ? "parsed" : "uploaded",
    },
  });
  await prisma.studentProfile.update({ where: { id: student.id }, data: { cvUrl: fileUrl, cvSummary: parsed?.textPreview || undefined } });
  return document;
}

cvRouter.post("/upload", requireAuth, requireRole("student", "admin"), upload.single("cv"), async (req, res, next) => {
  try {
    const document = await persistCv(req);
    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
});

cvRouter.post("/parse", requireAuth, requireRole("student", "admin"), upload.single("cv"), async (req, res, next) => {
  try {
    if (!req.file) throw httpError(400, "A PDF CV file is required", undefined, "CV_FILE_REQUIRED");
    const parsed = await parseCvFile(req.file.path);
    const document = await persistCv(req, parsed);
    res.status(201).json({ document, parsed });
  } catch (error) {
    next(error);
  }
});

cvRouter.delete("/:id", requireAuth, requireRole("student", "admin"), async (req, res, next) => {
  try {
    const where = req.user.role === "admin" ? { id: req.params.id } : { id: req.params.id, student: { userId: req.user.id } };
    const document = await prisma.cVDocument.findFirst({ where });
    if (!document) throw httpError(404, "CV document not found", undefined, "RESOURCE_NOT_FOUND");
    await prisma.cVDocument.delete({ where: { id: document.id } });
    await fs.unlink(path.join(uploadDirectory, path.basename(document.fileUrl))).catch(() => {});
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
