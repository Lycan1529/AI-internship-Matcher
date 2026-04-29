import { prisma } from "../db.js";

export async function createNotification({ studentId, recruiterId, applicationId, type, message }) {
  return prisma.notification.create({
    data: {
      studentId,
      recruiterId,
      applicationId,
      type,
      message,
    },
  });
}
