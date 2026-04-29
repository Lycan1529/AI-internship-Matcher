import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const studentRouter = Router();

const studentSchema = z.object({
  userId: z.string().uuid(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  degreeProgram: z.string().min(1),
  semester: z.number().int().min(1).max(12),
  locationPreference: z.string().optional(),
  industryPreference: z.string().optional(),
  availability: z.string().optional(),
  cvUrl: z.string().optional(),
  cvSummary: z.string().optional(),
});

studentRouter.get("/", requireAuth, requireRole("admin", "recruiter"), async (_req, res) => {
  const students = await prisma.studentProfile.findMany({
    include: { user: { select: { email: true } }, skills: { include: { skill: true } }, projects: true },
  });
  res.json(students);
});

studentRouter.post("/", requireAuth, requireRole("student", "admin"), async (req, res, next) => {
  try {
    const input = studentSchema.parse(req.body);
    const student = await prisma.studentProfile.create({
      data: {
        ...input,
        availability: input.availability ? new Date(input.availability) : undefined,
      },
    });
    res.status(201).json(student);
  } catch (error) {
    next(error);
  }
});

studentRouter.put("/:id", requireAuth, requireRole("student", "admin"), async (req, res, next) => {
  try {
    const input = studentSchema.partial().omit({ userId: true }).parse(req.body);
    const student = await prisma.studentProfile.update({
      where: { id: req.params.id },
      data: {
        ...input,
        availability: input.availability ? new Date(input.availability) : undefined,
      },
    });
    res.json(student);
  } catch (error) {
    next(error);
  }
});
