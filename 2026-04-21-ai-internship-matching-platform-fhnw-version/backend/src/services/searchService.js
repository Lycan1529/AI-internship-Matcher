import { config } from "../config.js";
import { httpError } from "../middleware/errorHandler.js";

export async function searchExternalInternships(query) {
  if (config.searchProvider !== "google") {
    return [];
  }
  if (!config.googleApiKey || !config.googleCseId) {
    throw httpError(500, "Google Custom Search is not configured");
  }

  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", config.googleApiKey);
  url.searchParams.set("cx", config.googleCseId);
  url.searchParams.set("q", `${query} internship Switzerland`);

  const response = await fetch(url);
  const payload = await response.json();
  if (!response.ok) {
    throw httpError(response.status, payload?.error?.message || "Google search request failed");
  }

  return (payload.items || []).map((item) => ({
    title: item.title,
    sourceUrl: item.link,
    snippet: item.snippet,
    sourceName: "Google Custom Search",
    sourceType: "search_index",
  }));
}
