import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { httpError } from "../middleware/errorHandler.js";

export const authRouter = Router();

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registrationSchema = credentialsSchema.extend({
  role: z.enum(["student", "recruiter"]).default("student"),
  displayName: z.string().trim().min(1).max(120).optional(),
});

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "8h" });
}

authRouter.post("/register", async (req, res, next) => {
  try {
    const input = registrationSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw httpError(409, "Email is already registered");

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash: await bcrypt.hash(input.password, 10),
        role: input.role,
        displayName: input.displayName,
      },
      select: { id: true, email: true, role: true },
    });
    res.status(201).json({ user, token: signToken(user) });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const input = credentialsSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw httpError(401, "Invalid email or password");
    }
    if (user.status === "suspended") {
      throw httpError(403, "This account is suspended", undefined, "ACCOUNT_SUSPENDED");
    }
    await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });
    res.json({
      user: { id: user.id, email: user.email, role: user.role },
      token: signToken(user),
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, async (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email, role: req.user.role } });
});
