import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

export const notificationRouter = Router();

notificationRouter.get("/", requireAuth, async (req, res) => {
  const where =
    req.user.role === "student"
      ? { student: { userId: req.user.id } }
      : req.user.role === "recruiter"
        ? { recruiter: { userId: req.user.id } }
        : {};
  const notifications = await prisma.notification.findMany({ where, orderBy: { createdAt: "desc" } });
  res.json(notifications);
});

notificationRouter.put("/:id/read", requireAuth, async (req, res, next) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json(notification);
  } catch (error) {
    next(error);
  }
});
