import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const studentRouter = Router();

const studentSkillSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  proficiency: z.number().int().min(1).max(5).default(3),
  yearsExperience: z.number().min(0).optional(),
});

const studentProjectSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  technologiesUsed: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

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
  skills: z.array(studentSkillSchema).optional(),
  projects: z.array(studentProjectSchema).optional(),
});

function toOptionalDate(value) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

async function buildStudentSkills(skills = []) {
  return Promise.all(
    skills.map(async (skill) => {
      const skillRecord = await prisma.skill.upsert({
        where: { name: skill.name },
        update: { category: skill.category || "general" },
        create: { name: skill.name, category: skill.category || "general" },
      });
      return {
        skillId: skillRecord.id,
        proficiency: skill.proficiency,
        yearsExperience: skill.yearsExperience,
      };
    }),
  );
}

function buildProjects(projects = []) {
  return projects.map((project) => ({
    title: project.title,
    description: project.description,
    technologiesUsed: project.technologiesUsed,
    startDate: toOptionalDate(project.startDate),
    endDate: toOptionalDate(project.endDate),
  }));
}

studentRouter.get("/", requireAuth, requireRole("admin", "recruiter"), async (_req, res) => {
  const students = await prisma.studentProfile.findMany({
    include: { user: { select: { email: true } }, skills: { include: { skill: true } }, projects: true },
  });
  res.json(students);
});

studentRouter.get("/me", requireAuth, requireRole("student", "admin"), async (req, res, next) => {
  try {
    const student = await prisma.studentProfile.findUniqueOrThrow({
      where: { userId: req.user.id },
      include: { user: { select: { email: true } }, skills: { include: { skill: true } }, projects: true, cvDocuments: true },
    });
    res.json(student);
  } catch (error) {
    next(error);
  }
});

studentRouter.get("/:id", requireAuth, requireRole("admin", "recruiter", "student"), async (req, res, next) => {
  try {
    if (req.user.role === "student") {
      const owned = await prisma.studentProfile.findFirst({ where: { id: req.params.id, userId: req.user.id }, select: { id: true } });
      if (!owned) {
        res.status(403).json({ error: { code: "AUTH_FORBIDDEN", message: "Students can only view their own profile" } });
        return;
      }
    }
    const student = await prisma.studentProfile.findUniqueOrThrow({
      where: { id: req.params.id },
      include: { user: { select: { email: true } }, skills: { include: { skill: true } }, projects: true, cvDocuments: true },
    });
    res.json(student);
  } catch (error) {
    next(error);
  }
});

studentRouter.post("/", requireAuth, requireRole("student", "admin"), async (req, res, next) => {
  try {
    const input = studentSchema.parse(req.body);
    if (req.user.role === "student" && input.userId !== req.user.id) {
      res.status(403).json({ error: "Students can only create their own profile" });
      return;
    }
    const studentSkills = await buildStudentSkills(input.skills);
    const student = await prisma.studentProfile.create({
      data: {
        userId: input.userId,
        firstName: input.firstName,
        lastName: input.lastName,
        degreeProgram: input.degreeProgram,
        semester: input.semester,
        locationPreference: input.locationPreference,
        industryPreference: input.industryPreference,
        availability: toOptionalDate(input.availability),
        cvUrl: input.cvUrl,
        cvSummary: input.cvSummary,
        skills: studentSkills.length ? { create: studentSkills } : undefined,
        projects: input.projects?.length ? { create: buildProjects(input.projects) } : undefined,
      },
      include: { user: { select: { email: true } }, skills: { include: { skill: true } }, projects: true, cvDocuments: true },
    });
    res.status(201).json(student);
  } catch (error) {
    next(error);
  }
});

studentRouter.put("/:id", requireAuth, requireRole("student", "admin"), async (req, res, next) => {
  try {
    const input = studentSchema.partial().omit({ userId: true }).parse(req.body);
    if (req.user.role === "student") {
      const owned = await prisma.studentProfile.findFirst({
        where: { id: req.params.id, userId: req.user.id },
        select: { id: true },
      });
      if (!owned) {
        res.status(403).json({ error: "Students can only update their own profile" });
        return;
      }
    }
    const studentSkills = input.skills ? await buildStudentSkills(input.skills) : null;
    const student = await prisma.studentProfile.update({
      where: { id: req.params.id },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        degreeProgram: input.degreeProgram,
        semester: input.semester,
        locationPreference: input.locationPreference,
        industryPreference: input.industryPreference,
        availability: input.availability ? toOptionalDate(input.availability) : undefined,
        cvUrl: input.cvUrl,
        cvSummary: input.cvSummary,
        skills:
          studentSkills !== null
            ? {
                deleteMany: {},
                create: studentSkills,
              }
            : undefined,
        projects:
          input.projects !== undefined
            ? {
                deleteMany: {},
                create: buildProjects(input.projects),
              }
            : undefined,
      },
      include: { user: { select: { email: true } }, skills: { include: { skill: true } }, projects: true, cvDocuments: true },
    });
    res.json(student);
  } catch (error) {
    next(error);
  }
});
