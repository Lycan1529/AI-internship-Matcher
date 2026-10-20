import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { rankInternshipsForStudent } from "../services/matchingService.js";
import { httpError } from "../middleware/errorHandler.js";

export const recommendationRouter = Router();

recommendationRouter.get("/:studentId", requireAuth, async (req, res, next) => {
  const startedAt = Date.now();
  try {
    if (req.user.role === "student") {
      const owned = await prisma.studentProfile.findFirst({ where: { id: req.params.studentId, userId: req.user.id }, select: { id: true } });
      if (!owned) throw httpError(403, "You can only view your own recommendations", undefined, "AUTH_FORBIDDEN");
    }
    const recommendations = await rankInternshipsForStudent(req.params.studentId);
    await prisma.$transaction(
      recommendations.slice(0, 10).map((item) =>
        prisma.matchRecommendation.upsert({
          where: { studentId_internshipId: { studentId: req.params.studentId, internshipId: item.internship.id } },
          update: { matchScore: item.matchScore, explanation: item.explanation },
          create: {
            studentId: req.params.studentId,
            internshipId: item.internship.id,
            matchScore: item.matchScore,
            explanation: item.explanation,
          },
        }),
      ),
    );
    await prisma.matchingRun.create({
      data: {
        status: "success",
        provider: [...new Set(recommendations.map((item) => item.matchingProvider))].join(",") || "local",
        algorithmVersion: "hybrid-60-40-v1",
        jobsProcessed: recommendations.length,
        durationMs: Date.now() - startedAt,
      },
    });
    res.json(recommendations);
  } catch (error) {
    await prisma.matchingRun.create({
      data: {
        status: "failed",
        provider: "unknown",
        algorithmVersion: "hybrid-60-40-v1",
        durationMs: Date.now() - startedAt,
        errorCode: error.code || "MATCHING_ERROR",
      },
    }).catch(() => {});
    next(error);
  }
});
