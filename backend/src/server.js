import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { studentRouter } from "./routes/students.js";
import { recruiterRouter } from "./routes/recruiters.js";
import { companyRouter } from "./routes/companies.js";
import { internshipRouter } from "./routes/internships.js";
import { applicationRouter } from "./routes/applications.js";
import { notificationRouter } from "./routes/notifications.js";
import { recommendationRouter } from "./routes/recommendations.js";
import { cvRouter } from "./routes/cv.js";
import { adminRouter } from "./routes/admin.js";
import { profileRouter } from "./routes/profile.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { prisma } from "./db.js";
import { assertRuntimeConfig, config } from "./config.js";
import { authRateLimit, securityHeaders } from "./middleware/security.js";

const allowedOrigins = config.frontendOrigin.split(",").map((origin) => origin.trim()).filter(Boolean);

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(securityHeaders);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("Origin is not allowed"));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "lycan-internship-api" });
  });
  app.get("/api/health", async (_req, res) => {
    try {
      await prisma.$queryRawUnsafe("SELECT 1");
      res.json({ status: "ok", service: "lycan-internship-api" });
    } catch {
      res.status(503).json({
        error: { code: "DATABASE_UNAVAILABLE", message: "The API is running, but the database is unavailable." },
      });
    }
  });

  app.use("/api/auth", authRateLimit, authRouter);
  app.use("/api/students", studentRouter);
  app.use("/api/recruiters", recruiterRouter);
  app.use("/api/companies", companyRouter);
  app.use("/api/internships", internshipRouter);
  app.use("/api/applications", applicationRouter);
  app.use("/api/notifications", notificationRouter);
  app.use("/api/recommendations", recommendationRouter);
  app.use("/api/cv", cvRouter);
  app.use("/api/profile", profileRouter);
  app.use("/api/admin", adminRouter);
  app.use(errorHandler);
  return app;
}

if (process.env.NODE_ENV !== "test") {
  try {
    assertRuntimeConfig();
    const app = createApp();
    const server = app.listen(config.port, () => {
      console.log(`API listening on port ${config.port}`);
    });
    const shutdown = (signal) => {
      console.log(`Received ${signal}; closing API server.`);
      server.close(() => prisma.$disconnect().finally(() => process.exit(0)));
      setTimeout(() => process.exit(1), 10_000).unref();
    };
    process.once("SIGTERM", () => shutdown("SIGTERM"));
    process.once("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error(`API startup failed: ${error.message}`);
    process.exit(1);
  }
}
