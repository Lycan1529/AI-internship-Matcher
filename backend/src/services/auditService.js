import { prisma } from "../db.js";

export function recordAudit({ actorId, action, targetType, targetId, reason, outcome = "success", metadata }) {
  return prisma.auditLog.create({
    data: { actorId, action, targetType, targetId, reason, outcome, metadata },
  });
}
