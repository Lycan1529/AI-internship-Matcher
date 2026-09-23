import fs from "node:fs/promises";
import path from "node:path";

const apiBaseUrl = process.env.FRONTEND_API_URL || process.env.FHNW_API_BASE_URL || "http://127.0.0.1:4000/api";
const safeUrl = JSON.stringify(apiBaseUrl.replace(/\/$/, ""));
const outputPath = path.resolve("frontend/runtime-config.js");

await fs.writeFile(
  outputPath,
  `// Generated at build time. Do not store secrets in this file.\nwindow.FHNW_API_BASE_URL = ${safeUrl};\n`,
  "utf8",
);
