import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { authRouter } from "./routes/auth.js";
import { studentRouter } from "./routes/students.js";
import { internshipRouter } from "./routes/internships.js";
import { applicationRouter } from "./routes/applications.js";
import { notificationRouter } from "./routes/notifications.js";
import { recommendationRouter } from "./routes/recommendations.js";
import { cvRouter } from "./routes/cv.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const port = process.env.PORT || 4000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN?.split(",") || "*",
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(path.resolve(__dirname, "..", process.env.UPLOAD_DIR || "uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "FHNW AI Internship Matching API" });
});

app.use("/api/auth", authRouter);
app.use("/api/students", studentRouter);
app.use("/api/internships", internshipRouter);
app.use("/api/applications", applicationRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/recommendations", recommendationRouter);
app.use("/api/cv", cvRouter);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
