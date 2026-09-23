import { config } from "../config.js";
import { httpError } from "../middleware/errorHandler.js";

async function openaiRequest(path, body) {
  if (!config.openaiApiKey) {
    throw httpError(500, "OPENAI_API_KEY is not configured");
  }

  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(`${config.openaiBaseUrl}${path}`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.openaiApiKey}`,
        },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const retryable = response.status === 429 || response.status >= 500;
        if (!retryable || attempt === 1) {
          throw httpError(response.status, payload?.error?.message || "OpenAI request failed", undefined, "AI_PROVIDER_ERROR");
        }
        lastError = new Error("OpenAI request failed");
      } else {
        return payload;
      }
    } catch (error) {
      lastError = error;
      if (attempt === 1 || error.status) throw error;
    } finally {
      clearTimeout(timeout);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw httpError(503, lastError?.message || "OpenAI is unavailable", undefined, "AI_PROVIDER_UNAVAILABLE");
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
