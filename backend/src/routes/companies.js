import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { httpError } from "../middleware/errorHandler.js";

export const companyRouter = Router();

const companySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  industry: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
});

companyRouter.get("/", requireAuth, requireRole("admin", "recruiter"), async (_req, res) => {
  const companies = await prisma.company.findMany({ include: { recruiters: true, internships: true } });
  res.json(companies);
});

companyRouter.post("/", requireAuth, requireRole("admin", "recruiter"), async (req, res, next) => {
  try {
    const company = await prisma.company.create({ data: companySchema.parse(req.body) });
    res.status(201).json(company);
  } catch (error) {
    next(error);
  }
});

companyRouter.put("/:id", requireAuth, requireRole("admin", "recruiter"), async (req, res, next) => {
  try {
    if (req.user.role === "recruiter") {
      const owned = await prisma.recruiter.findFirst({ where: { userId: req.user.id, companyId: req.params.id }, select: { id: true } });
      if (!owned) throw httpError(403, "Recruiters can only update their own company", undefined, "AUTH_FORBIDDEN");
    }
    const company = await prisma.company.update({
      where: { id: req.params.id },
      data: companySchema.partial().parse(req.body),
    });
    res.json(company);
  } catch (error) {
    next(error);
  }
});
