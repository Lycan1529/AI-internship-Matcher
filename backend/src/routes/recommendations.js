import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { rankInternshipsForStudent } from "../services/matchingService.js";
import { httpError } from "../middleware/errorHandler.js";

export const recommendationRouter = Router();

recommendationRouter.get("/:studentId", requireAuth, async (req, res, next) => {
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
    res.json(recommendations);
  } catch (error) {
    next(error);
  }
});
