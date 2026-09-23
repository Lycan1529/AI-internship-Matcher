import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const adminRouter = Router();

adminRouter.get("/stats", requireAuth, requireRole("admin"), async (_req, res) => {
  const staleThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [students, recruiters, internships, applications, notifications, activeInternships, staleInternships] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.recruiter.count(),
    prisma.internship.count(),
    prisma.application.count(),
    prisma.notification.count(),
    prisma.internship.count({ where: { status: "open", sources: { some: { isActive: true } } } }),
    prisma.internship.count({ where: { sources: { some: { lastCheckedAt: { lt: staleThreshold } } } } }),
  ]);
  res.json({ students, recruiters, internships, applications, notifications, activeInternships, staleInternships });
});

adminRouter.get("/sources", requireAuth, requireRole("admin"), async (_req, res) => {
  const sources = await prisma.internshipSource.findMany({
    include: { internship: { include: { company: true } } },
    orderBy: { collectedAt: "desc" },
  });
  res.json(sources);
});

adminRouter.get("/analytics", requireAuth, requireRole("admin"), async (_req, res) => {
  const [sourceRows, applicationRows, internships, requirements, recentApplications] = await Promise.all([
    prisma.internshipSource.groupBy({ by: ["platformName"], _count: { _all: true } }),
    prisma.application.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.internship.findMany({ select: { location: true, company: { select: { industry: true } } } }),
    prisma.internshipSkillRequirement.findMany({ include: { skill: { select: { name: true } } } }),
    prisma.application.findMany({
      take: 10,
      orderBy: { updatedAt: "desc" },
      include: { internship: { select: { title: true } }, student: { select: { firstName: true, lastName: true } } },
    }),
  ]);
  const countBy = (values) => Object.entries(values.reduce((counts, value) => {
    if (value) counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {})).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  res.json({
    sourceDistribution: sourceRows.map((row) => ({ source: row.platformName, count: row._count._all })),
    applicationFunnel: applicationRows.map((row) => ({ status: row.status, count: row._count._all })),
    popularSkills: countBy(requirements.map((item) => item.skill.name)),
    industryDemand: countBy(internships.map((item) => item.company.industry)),
    locationDemand: countBy(internships.map((item) => item.location)),
    recentActivity: recentApplications.map((application) => ({
      type: "application",
      status: application.status,
      internship: application.internship.title,
      student: `${application.student.firstName} ${application.student.lastName}`,
      updatedAt: application.updatedAt,
    })),
  });
});
