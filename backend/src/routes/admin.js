import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { httpError } from "../middleware/errorHandler.js";
import { recordAudit } from "../services/auditService.js";
import { config } from "../config.js";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole("admin"));

const pageSchema = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(25), query: z.string().trim().max(120).optional() });
const pageResult = (items, total, input) => ({ items, page: input.page, pageSize: input.pageSize, total, totalPages: Math.max(1, Math.ceil(total / input.pageSize)) });
const page = (input) => ({ skip: (input.page - 1) * input.pageSize, take: input.pageSize });

adminRouter.get("/overview", async (_req, res) => {
  const staleThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [students, recruiters, activeInternships, applications, pendingCompanies, staleListings, matchingErrors, recentActions] = await Promise.all([
    prisma.studentProfile.count(), prisma.recruiter.count(), prisma.internship.count({ where: { status: "open", moderationStatus: "active", company: { verificationStatus: "verified" } } }), prisma.application.count(), prisma.company.count({ where: { verificationStatus: "pending" } }), prisma.internship.count({ where: { sources: { some: { lastCheckedAt: { lt: staleThreshold } } } } }), prisma.matchingRun.count({ where: { status: "failed" } }), prisma.auditLog.findMany({ take: 6, orderBy: { createdAt: "desc" }, select: { action: true, targetType: true, targetId: true, createdAt: true, outcome: true } }),
  ]);
  const alerts = [
    ...(pendingCompanies ? [{ type: "company_verification", severity: "medium", count: pendingCompanies, message: `${pendingCompanies} company profile${pendingCompanies === 1 ? "" : "s"} await verification.`, target: "companies" }] : []),
    ...(staleListings ? [{ type: "stale_listings", severity: "low", count: staleListings, message: `${staleListings} listing${staleListings === 1 ? "" : "s"} have stale source checks.`, target: "sources" }] : []),
    ...(matchingErrors ? [{ type: "matching_errors", severity: "high", count: matchingErrors, message: `${matchingErrors} matching run${matchingErrors === 1 ? "" : "s"} failed.`, target: "matching" }] : []),
  ];
  res.json({ kpis: { students, recruiters, activeInternships, applications }, alerts, recentActions });
});

adminRouter.get("/users", async (req, res, next) => {
  try {
    const input = pageSchema.extend({ role: z.enum(["student", "recruiter", "admin"]).optional(), status: z.enum(["active", "suspended"]).optional() }).parse(req.query);
    const where = { ...(input.role ? { role: input.role } : {}), ...(input.status ? { status: input.status } : {}), ...(input.query ? { OR: [{ email: { contains: input.query, mode: "insensitive" } }, { displayName: { contains: input.query, mode: "insensitive" } }] } : {}) };
    const [items, total] = await Promise.all([prisma.user.findMany({ where, ...page(input), orderBy: { createdAt: "desc" }, select: { id: true, email: true, role: true, status: true, displayName: true, createdAt: true, lastActiveAt: true } }), prisma.user.count({ where })]);
    res.json(pageResult(items, total, input));
  } catch (error) { next(error); }
});

adminRouter.patch("/users/:id/status", async (req, res, next) => {
  try {
    const input = z.object({ status: z.enum(["active", "suspended"]), reason: z.string().trim().max(500).optional() }).parse(req.body);
    if (req.params.id === req.user.id && input.status === "suspended") throw httpError(400, "Administrators cannot suspend their own account", undefined, "ADMIN_SELF_SUSPEND");
    const target = await prisma.user.findUniqueOrThrow({ where: { id: req.params.id } });
    if (target.role === "admin" && input.status === "suspended" && await prisma.user.count({ where: { role: "admin", status: "active" } }) <= 1) throw httpError(400, "The last active administrator cannot be suspended", undefined, "ADMIN_LAST_ACTIVE");
    const updated = await prisma.user.update({ where: { id: target.id }, data: { status: input.status, suspendedAt: input.status === "suspended" ? new Date() : null } });
    await recordAudit({ actorId: req.user.id, action: `user.${input.status === "suspended" ? "suspended" : "reactivated"}`, targetType: "user", targetId: target.id, reason: input.reason });
    res.json(updated);
  } catch (error) { next(error); }
});

adminRouter.get("/companies", async (req, res, next) => {
  try {
    const input = pageSchema.extend({ status: z.enum(["pending", "verified", "rejected", "suspended"]).optional() }).parse(req.query);
    const where = { ...(input.status ? { verificationStatus: input.status } : {}), ...(input.query ? { OR: [{ name: { contains: input.query, mode: "insensitive" } }, { location: { contains: input.query, mode: "insensitive" } }, { industry: { contains: input.query, mode: "insensitive" } }] } : {}) };
    const [items, total] = await Promise.all([prisma.company.findMany({ where, ...page(input), orderBy: { createdAt: "desc" }, include: { _count: { select: { recruiters: true, internships: { where: { status: "open" } } } } } }), prisma.company.count({ where })]);
    res.json(pageResult(items, total, input));
  } catch (error) { next(error); }
});

adminRouter.get("/companies/:id", async (req, res, next) => {
  try {
    const company = await prisma.company.findUniqueOrThrow({ where: { id: req.params.id }, include: { recruiters: { include: { user: { select: { email: true, status: true } } } }, internships: { select: { id: true, title: true, status: true, moderationStatus: true } }, reviewedBy: { select: { email: true, displayName: true } } } });
    res.json(company);
  } catch (error) { next(error); }
});

adminRouter.post("/companies/:id/:decision", async (req, res, next) => {
  try {
    const decision = z.enum(["verify", "reject", "suspend", "restore"]).parse(req.params.decision);
    const input = z.object({ notes: z.string().trim().max(1000).optional(), reason: z.string().trim().max(1000).optional() }).parse(req.body);
    if (decision === "reject" && !input.reason) throw httpError(400, "A rejection reason is required", undefined, "VALIDATION_ERROR");
    const status = { verify: "verified", reject: "rejected", suspend: "suspended", restore: "pending" }[decision];
    const company = await prisma.company.update({ where: { id: req.params.id }, data: { verificationStatus: status, verificationNotes: input.notes, rejectionReason: decision === "reject" ? input.reason : null, reviewedById: req.user.id, reviewedAt: new Date() } });
    await recordAudit({ actorId: req.user.id, action: `company.${decision}`, targetType: "company", targetId: company.id, reason: input.reason || input.notes });
    res.json(company);
  } catch (error) { next(error); }
});

adminRouter.get("/internships", async (req, res, next) => {
  try {
    const input = pageSchema.extend({ status: z.enum(["draft", "open", "closed"]).optional(), moderationStatus: z.enum(["active", "flagged", "removed"]).optional() }).parse(req.query);
    const where = { ...(input.status ? { status: input.status } : {}), ...(input.moderationStatus ? { moderationStatus: input.moderationStatus } : {}), ...(input.query ? { OR: [{ title: { contains: input.query, mode: "insensitive" } }, { location: { contains: input.query, mode: "insensitive" } }, { company: { name: { contains: input.query, mode: "insensitive" } } }] } : {}) };
    const [items, total] = await Promise.all([prisma.internship.findMany({ where, ...page(input), orderBy: { postedDate: "desc" }, include: { company: { select: { name: true, verificationStatus: true } }, sources: { take: 1 }, _count: { select: { applications: true } } } }), prisma.internship.count({ where })]);
    res.json(pageResult(items, total, input));
  } catch (error) { next(error); }
});

adminRouter.post("/internships/:id/moderate", async (req, res, next) => {
  try {
    const input = z.object({ status: z.enum(["active", "flagged", "removed"]), reason: z.string().trim().min(3).max(1000) }).parse(req.body);
    const internship = await prisma.internship.update({ where: { id: req.params.id }, data: { moderationStatus: input.status, moderationReason: input.reason, moderatedById: req.user.id, moderatedAt: new Date() } });
    await recordAudit({ actorId: req.user.id, action: `internship.${input.status}`, targetType: "internship", targetId: internship.id, reason: input.reason });
    res.json(internship);
  } catch (error) { next(error); }
});

adminRouter.get("/matching/health", async (_req, res) => {
  const [latest, failures] = await Promise.all([prisma.matchingRun.findFirst({ orderBy: { createdAt: "desc" } }), prisma.matchingRun.count({ where: { status: "failed" } })]);
  res.json({ algorithmVersion: "hybrid-60-40-v1", matchingProvider: config.matchingProvider, explanationProvider: config.explanationProvider, fallback: "deterministic local semantic scoring", latest, failures });
});

adminRouter.get("/matching/metrics", async (_req, res) => {
  const [runs, scores] = await Promise.all([prisma.matchingRun.groupBy({ by: ["status"], _count: { _all: true } }), prisma.matchRecommendation.findMany({ select: { matchScore: true }, take: 1000, orderBy: { createdAt: "desc" } })]);
  const scoreDistribution = { low: 0, medium: 0, high: 0 };
  scores.forEach(({ matchScore }) => { if (matchScore >= 75) scoreDistribution.high += 1; else if (matchScore >= 50) scoreDistribution.medium += 1; else scoreDistribution.low += 1; });
  res.json({ runs, scoreDistribution, sampleSize: scores.length });
});

adminRouter.get("/sources", async (_req, res) => res.json(await prisma.internshipSource.findMany({ include: { internship: { include: { company: true } } }, orderBy: { collectedAt: "desc" } })));
adminRouter.get("/sources/:id/runs", async (_req, res) => res.json({ status: "not_configured", runs: [], message: "No scheduled ingestion adapter is configured for this source." }));

adminRouter.get("/audit-logs", async (req, res, next) => {
  try {
    const input = pageSchema.extend({ action: z.string().trim().optional(), targetType: z.string().trim().optional() }).parse(req.query);
    const where = { ...(input.action ? { action: { contains: input.action, mode: "insensitive" } } : {}), ...(input.targetType ? { targetType: input.targetType } : {}) };
    const [items, total] = await Promise.all([prisma.auditLog.findMany({ where, ...page(input), orderBy: { createdAt: "desc" }, include: { actor: { select: { email: true, displayName: true } } } }), prisma.auditLog.count({ where })]);
    res.json(pageResult(items, total, input));
  } catch (error) { next(error); }
});

adminRouter.get("/settings", (_req, res) => res.json({ companyVerification: "human_review_required", moderation: "admin_controlled", matchingProvider: config.matchingProvider, explanationProvider: config.explanationProvider, sourceFreshnessDays: 30 }));

adminRouter.get("/stats", async (_req, res) => {
  const [students, recruiters, internships, applications, notifications] = await Promise.all([prisma.studentProfile.count(), prisma.recruiter.count(), prisma.internship.count(), prisma.application.count(), prisma.notification.count()]);
  res.json({ students, recruiters, internships, applications, notifications });
});

adminRouter.get("/analytics", async (_req, res) => {
  const [sourceRows, applicationRows, internships, requirements] = await Promise.all([prisma.internshipSource.groupBy({ by: ["platformName"], _count: { _all: true } }), prisma.application.groupBy({ by: ["status"], _count: { _all: true } }), prisma.internship.findMany({ select: { location: true, company: { select: { industry: true } } } }), prisma.internshipSkillRequirement.findMany({ include: { skill: { select: { name: true } } } })]);
  const countBy = (values) => Object.entries(values.reduce((counts, value) => { if (value) counts[value] = (counts[value] || 0) + 1; return counts; }, {})).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  res.json({ sourceDistribution: sourceRows.map((row) => ({ source: row.platformName, count: row._count._all })), applicationFunnel: applicationRows.map((row) => ({ status: row.status, count: row._count._all })), popularSkills: countBy(requirements.map((item) => item.skill.name)), industryDemand: countBy(internships.map((item) => item.company.industry)), locationDemand: countBy(internships.map((item) => item.location)) });
});
