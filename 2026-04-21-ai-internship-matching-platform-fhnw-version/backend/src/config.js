export const config = {
  port: Number(process.env.PORT || 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  uploadDir: process.env.UPLOAD_DIR || "./uploads",
  matchingProvider: process.env.MATCHING_PROVIDER || "local",
  explanationProvider: process.env.EXPLANATION_PROVIDER || "local",
  searchProvider: process.env.SEARCH_PROVIDER || "local",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiBaseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  openaiEmbeddingModel: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
  openaiExplanationModel: process.env.OPENAI_EXPLANATION_MODEL || "gpt-5.4-mini",
  googleApiKey: process.env.GOOGLE_API_KEY || "",
  googleCseId: process.env.GOOGLE_CSE_ID || "",
};
