import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createNotification } from "../services/notificationService.js";
import { canTransitionApplication } from "../services/applicationLifecycle.js";

export const applicationRouter = Router();

async function assertRecruiterCanManageApplication(user, application) {
  if (user.role === "admin") return;
  const recruiter = await prisma.recruiter.findUnique({
    where: { userId: user.id },
    select: { companyId: true },
  });
  if (!recruiter || recruiter.companyId !== application.internship.companyId) {
    throw httpError(403, "You can only manage applications for your own company", undefined, "AUTH_FORBIDDEN");
  }
}

applicationRouter.get("/", requireAuth, requireRole("admin"), async (_req, res) => {
  const applications = await prisma.application.findMany({
    include: { internship: { include: { company: true, sources: true } }, student: true, notifications: true },
    orderBy: { applicationDate: "desc" },
  });
  res.json(applications);
});

applicationRouter.post("/", requireAuth, requireRole("student", "admin"), async (req, res, next) => {
  try {
    const input = z.object({ studentId: z.string().uuid(), internshipId: z.string().uuid() }).parse(req.body);
    if (req.user.role === "student") {
      const owned = await prisma.studentProfile.findFirst({
        where: { id: input.studentId, userId: req.user.id },
        select: { id: true },
      });
      if (!owned) {
        res.status(403).json({ error: "Students can only apply with their own profile" });
        return;
      }
    }
    const application = await prisma.application.create({
      data: input,
      include: {
        internship: { include: { company: { include: { recruiters: true } } } },
      },
    });
    await createNotification({
      studentId: input.studentId,
      applicationId: application.id,
      type: "application_submitted",
      message: `Application submitted for ${application.internship.title}.`,
    });
    await Promise.all(
      application.internship.company.recruiters.map((recruiter) =>
        createNotification({
          recruiterId: recruiter.id,
          applicationId: application.id,
          type: "application_submitted",
          message: `New application received for ${application.internship.title}.`,
        }),
      ),
    );
    res.status(201).json(application);
  } catch (error) {
    next(error);
  }
});

applicationRouter.get("/student/:id", requireAuth, async (req, res) => {
  if (req.user.role === "student") {
    const owned = await prisma.studentProfile.findFirst({ where: { id: req.params.id, userId: req.user.id }, select: { id: true } });
    if (!owned) {
      res.status(403).json({ error: { code: "AUTH_FORBIDDEN", message: "You can only view your own applications" } });
      return;
    }
  }
  const applications = await prisma.application.findMany({
    where: { studentId: req.params.id },
    include: { internship: { include: { company: true, sources: true } } },
    orderBy: { applicationDate: "desc" },
  });
  res.json(applications);
});

applicationRouter.get("/recruiter/:id", requireAuth, requireRole("recruiter", "admin"), async (req, res) => {
  if (req.user.role === "recruiter") {
    const owned = await prisma.recruiter.findFirst({ where: { id: req.params.id, userId: req.user.id }, select: { id: true } });
    if (!owned) {
      res.status(403).json({ error: { code: "AUTH_FORBIDDEN", message: "You can only view your own recruiting pipeline" } });
      return;
    }
  }
  const applications = await prisma.application.findMany({
    where: { internship: { company: { recruiters: { some: { id: req.params.id } } } } },
    include: { internship: { include: { company: true, sources: true } }, student: true },
    orderBy: { applicationDate: "desc" },
  });
  res.json(applications);
});

applicationRouter.put("/:id/status", requireAuth, requireRole("recruiter", "admin"), async (req, res, next) => {
  try {
    const input = z.object({ status: z.enum(["Applied", "Interview", "Offer", "Rejected"]), recruiterNotes: z.string().optional() }).parse(req.body);
    const existing = await prisma.application.findUniqueOrThrow({
      where: { id: req.params.id },
      include: { internship: { select: { companyId: true } } },
    });
    await assertRecruiterCanManageApplication(req.user, existing);
    if (!canTransitionApplication(existing.status, input.status)) {
      throw httpError(400, `Cannot move an application from ${existing.status} to ${input.status}`, undefined, "APPLICATION_INVALID_TRANSITION");
    }
    const application = await prisma.application.update({
      where: { id: req.params.id },
      data: input,
      include: { internship: true, student: true },
    });
    await createNotification({
      studentId: application.studentId,
      applicationId: application.id,
      type: "application_status_updated",
      message: `${application.internship.title} status updated to ${application.status}.`,
    });
    res.json(application);
  } catch (error) {
    next(error);
  }
});
