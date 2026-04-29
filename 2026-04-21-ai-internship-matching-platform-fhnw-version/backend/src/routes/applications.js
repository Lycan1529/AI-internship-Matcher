import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createNotification } from "../services/notificationService.js";

export const applicationRouter = Router();

applicationRouter.post("/", requireAuth, requireRole("student", "admin"), async (req, res, next) => {
  try {
    const input = z.object({ studentId: z.string().uuid(), internshipId: z.string().uuid() }).parse(req.body);
    const application = await prisma.application.create({ data: input, include: { internship: true } });
    await createNotification({
      studentId: input.studentId,
      applicationId: application.id,
      type: "application_submitted",
      message: `Application submitted for ${application.internship.title}.`,
    });
    res.status(201).json(application);
  } catch (error) {
    next(error);
  }
});

applicationRouter.get("/student/:id", requireAuth, async (req, res) => {
  const applications = await prisma.application.findMany({
    where: { studentId: req.params.id },
    include: { internship: { include: { company: true, sources: true } } },
    orderBy: { applicationDate: "desc" },
  });
  res.json(applications);
});

applicationRouter.put("/:id/status", requireAuth, requireRole("recruiter", "admin"), async (req, res, next) => {
  try {
    const input = z.object({ status: z.enum(["Applied", "Interview", "Offer", "Rejected"]), recruiterNotes: z.string().optional() }).parse(req.body);
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
