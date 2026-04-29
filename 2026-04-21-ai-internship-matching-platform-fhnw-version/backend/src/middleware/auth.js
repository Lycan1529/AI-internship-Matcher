import jwt from "jsonwebtoken";
import { prisma } from "../db.js";
import { httpError } from "./errorHandler.js";

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) throw httpError(401, "Missing bearer token");

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw httpError(401, "User no longer exists");
    req.user = user;
    next();
  } catch (error) {
    next(error.status ? error : httpError(401, "Invalid or expired token"));
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(httpError(403, "Insufficient permissions"));
      return;
    }
    next();
  };
}
