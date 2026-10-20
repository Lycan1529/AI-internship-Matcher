import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const required = ["ADMIN_BOOTSTRAP_TOKEN", "ADMIN_BOOTSTRAP_EMAIL", "ADMIN_BOOTSTRAP_PASSWORD"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) throw new Error(`Missing required bootstrap variables: ${missing.join(", ")}`);
if (process.env.ADMIN_BOOTSTRAP_TOKEN !== process.env.ADMIN_BOOTSTRAP_AUTHORIZATION) {
  throw new Error("ADMIN_BOOTSTRAP_AUTHORIZATION must match ADMIN_BOOTSTRAP_TOKEN");
}

const prisma = new PrismaClient();
const email = process.env.ADMIN_BOOTSTRAP_EMAIL.trim().toLowerCase();
const displayName = process.env.ADMIN_BOOTSTRAP_NAME?.trim() || "Platform Administrator";

try {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.role !== "admin") {
    throw new Error("Refusing to change an existing non-admin account into an admin account");
  }
  const passwordHash = await bcrypt.hash(process.env.ADMIN_BOOTSTRAP_PASSWORD, 12);
  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, displayName, status: "active", suspendedAt: null },
    create: { email, passwordHash, displayName, role: "admin", status: "active" },
    select: { id: true, email: true, role: true },
  });
  console.log(`Admin bootstrap completed for ${admin.email} (${admin.role}).`);
} finally {
  await prisma.$disconnect();
}
