import { config } from "../config.js";
import { httpError } from "../middleware/errorHandler.js";

async function openaiRequest(path, body) {
  if (!config.openaiApiKey) {
    throw httpError(500, "OPENAI_API_KEY is not configured");
  }

  const response = await fetch(`${config.openaiBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.openaiApiKey}`,
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw httpError(response.status, payload?.error?.message || "OpenAI request failed");
  }
  return payload;
}

export async function createEmbedding(input) {
  const payload = await openaiRequest("/embeddings", {
    model: config.openaiEmbeddingModel,
    input,
  });
  return payload.data?.[0]?.embedding || [];
}

export async function generateMatchExplanation({ studentSummary, internshipSummary, scoreBreakdown }) {
  const payload = await openaiRequest("/responses", {
    model: config.openaiExplanationModel,
    input: [
      {
        role: "system",
        content: "You explain internship matches for students in concise, professional language.",
      },
      {
        role: "user",
        content: `Student: ${studentSummary}\nInternship: ${internshipSummary}\nScores: ${JSON.stringify(scoreBreakdown)}`,
      },
    ],
  });

  return payload.output_text || "This internship aligns with the student's profile and current scoring signals.";
}
