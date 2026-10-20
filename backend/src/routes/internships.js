import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { httpError } from "../middleware/errorHandler.js";

export const internshipRouter = Router();

const internshipSkillSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  requiredLevel: z.number().int().min(1).max(5).optional(),
  weight: z.number().min(0).max(1).optional(),
});

const internshipSchema = z.object({
  companyId: z.string().uuid().optional(),
  companyName: z.string().min(1).optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  workMode: z.enum(["remote", "hybrid", "onsite"]),
  duration: z.string().optional(),
  salaryRange: z.string().optional(),
  deadline: z.string().optional(),
  starts: z.string().optional(),
  duplicateKey: z.string().optional(),
  status: z.enum(["draft", "open", "closed"]).optional(),
  requiredSkills: z.array(internshipSkillSchema).optional(),
  preferredSkills: z.array(internshipSkillSchema).optional(),
  source: z
    .object({
      platformName: z.string(),
      sourceUrl: z.string().url(),
      sourceType: z.string(),
      externalPostingId: z.string().optional(),
    })
    .optional(),
});

function toOptionalDate(value) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

async function buildRequirements(skills = [], fallbackWeight = 0.5, fallbackLevel = 3) {
  return Promise.all(
    skills.map(async (skill) => {
      const record = await prisma.skill.upsert({
        where: { name: skill.name },
        update: { category: skill.category || "general" },
        create: { name: skill.name, category: skill.category || "general" },
      });
      return {
        skillId: record.id,
        requiredLevel: skill.requiredLevel || fallbackLevel,
        weight: skill.weight ?? fallbackWeight,
      };
    }),
  );
}

async function resolveCompanyId(req, input) {
  if (req.user.role === "recruiter") {
    const recruiter = await prisma.recruiter.findUnique({
      where: { userId: req.user.id },
      select: { companyId: true, company: { select: { verificationStatus: true } } },
    });
    if (!recruiter?.companyId) throw httpError(400, "A company profile is required before creating an internship", undefined, "COMPANY_PROFILE_REQUIRED");
    if (input.companyId && input.companyId !== recruiter.companyId) {
      throw httpError(403, "Recruiters can only create internships for their own company", undefined, "AUTH_FORBIDDEN");
    }
    return recruiter;
  }
  if (input.companyId) return { companyId: input.companyId, company: null };
  throw httpError(400, "A company profile is required before creating an internship", undefined, "COMPANY_PROFILE_REQUIRED");
}

async function assertRecruiterCanManageInternship(user, internshipId) {
  if (user.role === "admin") return;
  const recruiter = await prisma.recruiter.findUnique({ where: { userId: user.id }, select: { companyId: true } });
  const internship = await prisma.internship.findUniqueOrThrow({ where: { id: internshipId }, select: { companyId: true } });
  if (!recruiter || recruiter.companyId !== internship.companyId) {
    throw httpError(403, "Recruiters can only manage internships for their own company", undefined, "AUTH_FORBIDDEN");
  }
}

internshipRouter.get("/", async (_req, res) => {
  const internships = await prisma.internship.findMany({
    where: { status: "open", moderationStatus: "active", company: { verificationStatus: "verified" } },
    include: { company: true, sources: true, requirements: { include: { skill: true } } },
    orderBy: { postedDate: "desc" },
  });
  res.json(internships);
});

internshipRouter.get("/mine", requireAuth, requireRole("recruiter", "admin"), async (req, res, next) => {
  try {
    let where = {};
    if (req.user.role === "recruiter") {
      const recruiter = await prisma.recruiter.findUnique({
        where: { userId: req.user.id },
        select: { companyId: true },
      });
      if (!recruiter?.companyId) {
        throw httpError(400, "A company profile is required before viewing internships", undefined, "COMPANY_PROFILE_REQUIRED");
      }
      where = { companyId: recruiter.companyId };
    }

    const internships = await prisma.internship.findMany({
      where,
      include: { company: true, sources: true, requirements: { include: { skill: true } } },
      orderBy: { postedDate: "desc" },
    });
    res.json(internships);
  } catch (error) {
    next(error);
  }
});

internshipRouter.get("/:id", async (req, res, next) => {
  try {
    const internship = await prisma.internship.findFirstOrThrow({
      where: {
        id: req.params.id,
        status: "open",
        moderationStatus: "active",
        company: { verificationStatus: "verified" },
      },
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
    const company = await resolveCompanyId(req, input);
    const isVerified = req.user.role === "admin" || company.company?.verificationStatus === "verified";
    if (req.user.role === "recruiter" && input.status === "open" && !isVerified) {
      throw httpError(403, "Company verification is required before publishing an internship", undefined, "COMPANY_VERIFICATION_REQUIRED");
    }
    const requiredSkills = await buildRequirements(input.requiredSkills, 0.65, 3);
    const preferredSkills = await buildRequirements(input.preferredSkills, 0.35, 2);
    const deadline = toOptionalDate(input.deadline) || toOptionalDate(input.starts) || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    const internship = await prisma.internship.create({
      data: {
        companyId: company.companyId,
        title: input.title,
        description: input.description || `${input.title} internship opportunity`,
        location: input.location,
        workMode: input.workMode,
        duration: input.duration,
        salaryRange: input.salaryRange,
        deadline,
        duplicateKey: input.duplicateKey,
        status: input.status || (isVerified ? "open" : "draft"),
        sources: input.source ? { create: input.source } : undefined,
        requirements: [...requiredSkills, ...preferredSkills].length
          ? { create: [...requiredSkills, ...preferredSkills] }
          : undefined,
      },
      include: { company: true, sources: true, requirements: { include: { skill: true } } },
    });
    res.status(201).json(internship);
  } catch (error) {
    next(error);
  }
});

internshipRouter.put("/:id", requireAuth, requireRole("recruiter", "admin"), async (req, res, next) => {
  try {
    await assertRecruiterCanManageInternship(req.user, req.params.id);
    const input = internshipSchema.partial().parse(req.body);
    if (req.user.role === "recruiter") {
      const recruiter = await prisma.recruiter.findUnique({
        where: { userId: req.user.id },
        include: { company: { select: { verificationStatus: true } } },
      });
      if (input.status === "open" && recruiter?.company.verificationStatus !== "verified") {
        throw httpError(403, "Company verification is required before publishing an internship", undefined, "COMPANY_VERIFICATION_REQUIRED");
      }
    }
    const requiredSkills = input.requiredSkills ? await buildRequirements(input.requiredSkills, 0.65, 3) : null;
    const preferredSkills = input.preferredSkills ? await buildRequirements(input.preferredSkills, 0.35, 2) : null;
    const internship = await prisma.internship.update({
      where: { id: req.params.id },
      data: {
        companyId: input.companyId,
        title: input.title,
        description: input.description,
        location: input.location,
        workMode: input.workMode,
        duration: input.duration,
        salaryRange: input.salaryRange,
        deadline: input.deadline ? toOptionalDate(input.deadline) : undefined,
        duplicateKey: input.duplicateKey,
        status: input.status,
        requirements:
          requiredSkills !== null || preferredSkills !== null
            ? {
                deleteMany: {},
                create: [...(requiredSkills || []), ...(preferredSkills || [])],
              }
            : undefined,
      },
      include: { company: true, sources: true, requirements: { include: { skill: true } } },
    });
    res.json(internship);
  } catch (error) {
    next(error);
  }
});

internshipRouter.delete("/:id", requireAuth, requireRole("recruiter", "admin"), async (req, res, next) => {
  try {
    await assertRecruiterCanManageInternship(req.user, req.params.id);
    await prisma.internship.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
