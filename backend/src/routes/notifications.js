import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { httpError } from "../middleware/errorHandler.js";

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

notificationRouter.get("/:userId", requireAuth, async (req, res) => {
  if (req.user.role !== "admin" && req.user.id !== req.params.userId) {
    res.status(403).json({ error: { code: "AUTH_FORBIDDEN", message: "You can only view your own notifications" } });
    return;
  }
  const notifications = await prisma.notification.findMany({
    where: {
      OR: [
        { student: { userId: req.params.userId } },
        { recruiter: { userId: req.params.userId } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(notifications);
});

notificationRouter.put("/:id/read", requireAuth, async (req, res, next) => {
  try {
    const where =
      req.user.role === "admin"
        ? { id: req.params.id }
        : req.user.role === "student"
          ? { id: req.params.id, student: { userId: req.user.id } }
          : { id: req.params.id, recruiter: { userId: req.user.id } };
    const notification = await prisma.notification.findFirst({ where });
    if (!notification) throw httpError(404, "Notification not found", undefined, "RESOURCE_NOT_FOUND");
    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { isRead: true },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});
