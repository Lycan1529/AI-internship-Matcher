import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { httpError } from "../middleware/errorHandler.js";

export const recruiterRouter = Router();

const recruiterSchema = z.object({
  userId: z.string().uuid(),
  companyId: z.string().uuid(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.string().optional(),
});

recruiterRouter.get("/", requireAuth, requireRole("admin"), async (_req, res) => {
  const recruiters = await prisma.recruiter.findMany({ include: { user: true, company: true } });
  res.json(recruiters);
});

recruiterRouter.get("/me", requireAuth, requireRole("recruiter", "admin"), async (req, res, next) => {
  try {
    const recruiter = await prisma.recruiter.findUniqueOrThrow({
      where: { userId: req.user.id },
      include: { user: true, company: true, notifications: true },
    });
    res.json(recruiter);
  } catch (error) {
    next(error);
  }
});

recruiterRouter.get("/:id", requireAuth, requireRole("admin", "recruiter"), async (req, res, next) => {
  try {
    if (req.user.role === "recruiter") {
      const owned = await prisma.recruiter.findFirst({ where: { id: req.params.id, userId: req.user.id }, select: { id: true } });
      if (!owned) throw httpError(403, "You can only view your own recruiter profile", undefined, "AUTH_FORBIDDEN");
    }
    const recruiter = await prisma.recruiter.findUniqueOrThrow({
      where: { id: req.params.id },
      include: { user: true, company: true, notifications: true },
    });
    res.json(recruiter);
  } catch (error) {
    next(error);
  }
});

recruiterRouter.post("/", requireAuth, requireRole("admin", "recruiter"), async (req, res, next) => {
  try {
    const input = recruiterSchema.parse(req.body);
    if (req.user.role === "recruiter" && input.userId !== req.user.id) {
      res.status(403).json({ error: "Recruiters can only create their own profile" });
      return;
    }
    const recruiter = await prisma.recruiter.create({ data: input });
    res.status(201).json(recruiter);
  } catch (error) {
    next(error);
  }
});

recruiterRouter.put("/:id", requireAuth, requireRole("admin", "recruiter"), async (req, res, next) => {
  try {
    if (req.user.role === "recruiter") {
      const owned = await prisma.recruiter.findFirst({ where: { id: req.params.id, userId: req.user.id }, select: { id: true } });
      if (!owned) throw httpError(403, "You can only update your own recruiter profile", undefined, "AUTH_FORBIDDEN");
    }
    const recruiter = await prisma.recruiter.update({
      where: { id: req.params.id },
      data: recruiterSchema.partial().omit({ userId: true }).parse(req.body),
    });
    res.json(recruiter);
  } catch (error) {
    next(error);
  }
});
