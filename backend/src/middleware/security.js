import { httpError } from "./errorHandler.js";

const attempts = new Map();

export function securityHeaders(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
}

export function authRateLimit(req, _res, next) {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const windowMs = 15 * 60 * 1000;
  const limit = 20;
  const record = attempts.get(key);
  const recent = record && now - record.startedAt < windowMs ? record : { startedAt: now, count: 0 };
  recent.count += 1;
  attempts.set(key, recent);
  if (recent.count > limit) {
    next(httpError(429, "Too many authentication attempts. Try again later.", undefined, "AUTH_RATE_LIMITED"));
    return;
  }
  next();
}
