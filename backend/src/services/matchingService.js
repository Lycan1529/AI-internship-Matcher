import { prisma } from "../db.js";
import { config } from "../config.js";
import { createEmbedding, generateMatchExplanation } from "./openaiService.js";

const FINAL_SCORE_WEIGHTS = {
  ruleBased: 0.6,
  embedding: 0.4,
};

function normalize(value) {
  return String(value || "").toLowerCase();
}

function percentage(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function combineMatchScores(ruleBasedScore, embeddingScore) {
  return percentage(
    Number(ruleBasedScore || 0) * FINAL_SCORE_WEIGHTS.ruleBased +
      Number(embeddingScore || 0) * FINAL_SCORE_WEIGHTS.embedding,
  );
}

function tokenize(value) {
  return String(value || "")
    .toLowerCase()
    .split(/[^a-z0-9+#]+/i)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2);
}

function addWeightedTerms(target, values, weight = 1) {
  const list = Array.isArray(values) ? values : [values];
  list.forEach((value) => {
    tokenize(value).forEach((token) => {
      target.set(token, (target.get(token) || 0) + weight);
    });
  });
  return target;
}

function cosineSimilarity(left, right) {
  const keys = new Set([...left.keys(), ...right.keys()]);
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  keys.forEach((key) => {
    const a = left.get(key) || 0;
    const b = right.get(key) || 0;
    dot += a * b;
    leftNorm += a * a;
    rightNorm += b * b;
  });
  if (!leftNorm || !rightNorm) return 0;
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

function cosineSimilarityArray(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || !left.length || !right.length || left.length !== right.length) {
    return 0;
  }
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let index = 0; index < left.length; index += 1) {
    const a = Number(left[index] || 0);
    const b = Number(right[index] || 0);
    dot += a * b;
    leftNorm += a * a;
    rightNorm += b * b;
  }
  if (!leftNorm || !rightNorm) return 0;
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

function studentEmbedding(student) {
  const embedding = new Map();
  addWeightedTerms(embedding, student.degreeProgram, 1.2);
  addWeightedTerms(embedding, student.skills.map((item) => item.skill.name), 3.4);
  addWeightedTerms(embedding, student.industryPreference, 2.2);
  addWeightedTerms(embedding, student.projects.map((project) => project.title), 1.8);
  addWeightedTerms(embedding, student.projects.map((project) => project.description), 1.4);
  addWeightedTerms(embedding, student.cvSummary, 1.5);
  addWeightedTerms(embedding, student.locationPreference, 0.7);
  return embedding;
}

function internshipEmbedding(internship) {
  const embedding = new Map();
  addWeightedTerms(embedding, internship.title, 2.4);
  addWeightedTerms(embedding, internship.company.name, 1.1);
  addWeightedTerms(embedding, internship.location, 0.8);
  addWeightedTerms(embedding, internship.description, 1.5);
  addWeightedTerms(embedding, internship.requirements.filter((item) => item.weight >= 0.5).map((item) => item.skill.name), 3.8);
  addWeightedTerms(embedding, internship.requirements.filter((item) => item.weight < 0.5).map((item) => item.skill.name), 2.1);
  addWeightedTerms(embedding, internship.company.industry, 2.2);
  addWeightedTerms(embedding, internship.workMode, 0.5);
  return embedding;
}

function studentEmbeddingText(student) {
  return [
    student.degreeProgram,
    `Skills: ${student.skills.map((item) => item.skill.name).join(", ")}`,
    `Interests: ${student.industryPreference || ""}`,
    `Projects: ${student.projects.map((project) => `${project.title} ${project.description || ""}`).join(" | ")}`,
    `CV: ${student.cvSummary || ""}`,
    `Location: ${student.locationPreference || ""}`,
    `Availability: ${student.availability || ""}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function internshipEmbeddingText(internship) {
  return [
    `${internship.title} at ${internship.company.name}`,
    internship.description,
    `Required skills: ${internship.requirements.filter((item) => item.weight >= 0.5).map((item) => item.skill.name).join(", ")}`,
    `Preferred skills: ${internship.requirements.filter((item) => item.weight < 0.5).map((item) => item.skill.name).join(", ")}`,
    `Industry: ${internship.company.industry || ""}`,
    `Location: ${internship.location || ""}`,
    `Work mode: ${internship.workMode || ""}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function weightedOverlap(left, right) {
  return [...left.keys()]
    .filter((key) => right.has(key) && !["intern", "internship", "student"].includes(key))
    .map((key) => ({ key, weight: (left.get(key) || 0) + (right.get(key) || 0) }))
    .sort((a, b) => b.weight - a.weight)
    .map((item) => item.key);
}

async function semanticSimilarityForMatch(student, internship, studentVector, internshipVector) {
  if (!config.openaiApiKey || config.matchingProvider === "local") {
    return {
      similarity: cosineSimilarity(studentVector, internshipVector),
      provider: config.openaiApiKey ? "local-forced" : "local",
    };
  }

  try {
    const [studentEmbeddingVector, internshipEmbeddingVector] = await Promise.all([
      createEmbedding(studentEmbeddingText(student)),
      createEmbedding(internshipEmbeddingText(internship)),
    ]);
    return {
      similarity: cosineSimilarityArray(studentEmbeddingVector, internshipEmbeddingVector),
      provider: "openai",
    };
  } catch {
    return {
      similarity: cosineSimilarity(studentVector, internshipVector),
      provider: "local-fallback",
    };
  }
}

async function analyzeMatch(student, internship) {
  const matchedRequired = internship.requirements
    .filter((requirement) => requirement.weight >= 0.5 && student.skills.some((item) => item.skillId === requirement.skillId))
    .map((requirement) => requirement.skill.name);
  const matchedPreferred = internship.requirements
    .filter((requirement) => requirement.weight < 0.5 && student.skills.some((item) => item.skillId === requirement.skillId))
    .map((requirement) => requirement.skill.name);
  const missing = internship.requirements
    .filter((requirement) => requirement.weight >= 0.5 && !student.skills.some((item) => item.skillId === requirement.skillId))
    .map((requirement) => requirement.skill.name);
  const studentVector = studentEmbedding(student);
  const internshipVector = internshipEmbedding(internship);
  const semantic = await semanticSimilarityForMatch(student, internship, studentVector, internshipVector);
  const embeddingScore = semantic.similarity;
  const requiredRequirements = internship.requirements.filter((item) => item.weight >= 0.5);
  const preferredRequirements = internship.requirements.filter((item) => item.weight < 0.5);
  const requiredCoverage = requiredRequirements.length ? matchedRequired.length / requiredRequirements.length : 0.6;
  const preferredCoverage = preferredRequirements.length ? matchedPreferred.length / preferredRequirements.length : 0.4;
  const categoryFit = student.industryPreference && internship.company.industry
    ? Math.max(
        0.35,
        internship.company.industry
          .split(",")
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean)
          .filter((item) => normalize(student.industryPreference).includes(item)).length /
          Math.max(1, internship.company.industry.split(",").filter(Boolean).length),
      )
    : 0.35;
  const locationFit = student.locationPreference && normalize(student.locationPreference).includes(normalize(internship.location)) ? 1 : 0;
  const availabilityFit = !student.availability || student.availability <= internship.deadline ? 0.85 : 0.45;
  const modeFit = internship.workMode === "hybrid" ? 0.6 : 0;
  const overlap = weightedOverlap(studentVector, internshipVector);
  const ruleBasedScore = percentage(
    (
      ((requiredCoverage * 0.7) + (preferredCoverage * 0.3)) * 0.5 +
      categoryFit * 0.25 +
      ((locationFit * 0.5) + (availabilityFit * 0.35) + (modeFit * 0.15)) * 0.25
    ) * 100,
  );
  return {
    matchedRequired,
    matchedPreferred,
    missing,
    embeddingScore,
    overlap,
    ruleBasedScore,
    scores: {
      embedding: percentage(embeddingScore * 100),
      skills: percentage(((requiredCoverage * 0.7) + (preferredCoverage * 0.3)) * 100),
      preferences: percentage(categoryFit * 100),
      availability: percentage(((locationFit * 0.5) + (availabilityFit * 0.35) + (modeFit * 0.15)) * 100),
      ruleBased: ruleBasedScore,
    },
    provider: semantic.provider,
  };
}

function explain(student, internship, analysis) {
  const signals = [...new Set([...analysis.matchedRequired, ...analysis.matchedPreferred, ...analysis.overlap])].slice(0, 4);
  return `Strong fit because the semantic profile aligns on ${signals.join(", ") || "adjacent capabilities"}. ${analysis.missing.length ? `Main growth area: ${analysis.missing.join(", ")}.` : "All required skills are covered."}`;
}

async function maybeExplainWithProvider(student, internship, analysis) {
  if (config.explanationProvider !== "openai") {
    return explain(student, internship, analysis);
  }
  try {
    return await generateMatchExplanation({
      studentSummary: `${student.firstName} ${student.lastName}, ${student.degreeProgram}, skills: ${student.skills.map((item) => item.skill.name).join(", ")}`,
      internshipSummary: `${internship.title} at ${internship.company.name}, requirements: ${internship.requirements.map((item) => item.skill.name).join(", ")}`,
      scoreBreakdown: analysis,
    });
  } catch {
    return explain(student, internship, analysis);
  }
}

export async function rankInternshipsForStudent(studentId) {
  const student = await prisma.studentProfile.findUniqueOrThrow({
    where: { id: studentId },
    include: { skills: { include: { skill: true } }, projects: true },
  });
  const internships = await prisma.internship.findMany({
    where: { status: "open" },
    include: { company: true, sources: true, requirements: { include: { skill: true } } },
  });

  const ranked = await Promise.all(internships.map(async (internship) => {
      const analysis = await analyzeMatch(student, internship);
      const scores = analysis.scores;
      const matchScore = combineMatchScores(scores.ruleBased, scores.embedding);
      return {
        internship,
        matchScore,
        explanation: null,
        matchingProvider: analysis.provider,
        scores,
        analysis,
      };
    }));

  const withExplanations = await Promise.all(
    ranked.map(async (item) => ({
      ...item,
      explanation: await maybeExplainWithProvider(student, item.internship, item.analysis),
    })),
  );

  return withExplanations.sort((a, b) => b.matchScore - a.matchScore);
}
