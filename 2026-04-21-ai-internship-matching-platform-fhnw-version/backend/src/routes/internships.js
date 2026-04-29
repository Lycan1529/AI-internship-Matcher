import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const internshipRouter = Router();

const internshipSchema = z.object({
  companyId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().min(1),
  location: z.string().optional(),
  workMode: z.enum(["remote", "hybrid", "onsite"]),
  duration: z.string().optional(),
  salaryRange: z.string().optional(),
  deadline: z.string(),
  duplicateKey: z.string().optional(),
  source: z
    .object({
      platformName: z.string(),
      sourceUrl: z.string().url(),
      sourceType: z.string(),
      externalPostingId: z.string().optional(),
    })
    .optional(),
});

internshipRouter.get("/", async (_req, res) => {
  const internships = await prisma.internship.findMany({
    where: { status: "open" },
    include: { company: true, sources: true, requirements: { include: { skill: true } } },
    orderBy: { postedDate: "desc" },
  });
  res.json(internships);
});

internshipRouter.get("/:id", async (req, res, next) => {
  try {
    const internship = await prisma.internship.findUniqueOrThrow({
      where: { id: req.params.id },
      include: { company: true, sources: true, requirements: { include: { skill: true } } },
    });
    res.json(internship);
  } catch (error) {
    next(error);
  }
});

internshipRouter.post("/", requireAuth, requireRole("recruiter", "admin"), async (req, res, next) => {
  try {
    const input = internshipSchema.parse(req.body);
    const internship = await prisma.internship.create({
      data: {
        companyId: input.companyId,
        title: input.title,
        description: input.description,
        location: input.location,
        workMode: input.workMode,
        duration: input.duration,
        salaryRange: input.salaryRange,
        deadline: new Date(input.deadline),
        duplicateKey: input.duplicateKey,
        sources: input.source ? { create: input.source } : undefined,
      },
      include: { sources: true },
    });
    res.status(201).json(internship);
  } catch (error) {
    next(error);
  }
});
