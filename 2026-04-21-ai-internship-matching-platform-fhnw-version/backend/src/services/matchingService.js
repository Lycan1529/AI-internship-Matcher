import { prisma } from "../db.js";
import { config } from "../config.js";
import { createEmbedding, generateMatchExplanation } from "./openaiService.js";

const WEIGHTS = {
  skills: 0.5,
  projects: 0.25,
  preferences: 0.15,
  availability: 0.1,
};

function normalize(value) {
  return String(value || "").toLowerCase();
}

function percentage(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function skillScore(student, internship) {
  const studentSkills = new Map(student.skills.map((item) => [item.skill.id, item]));
  const requirements = internship.requirements;
  if (!requirements.length) return 40;

  const weighted = requirements.reduce((sum, requirement) => {
    const studentSkill = studentSkills.get(requirement.skillId);
    if (!studentSkill) return sum;
    const proficiencyFit = Math.min(1, studentSkill.proficiency / requirement.requiredLevel);
    return sum + proficiencyFit * requirement.weight;
  }, 0);
  const maxWeight = requirements.reduce((sum, requirement) => sum + requirement.weight, 0) || 1;
  return percentage((weighted / maxWeight) * 100);
}

function projectScore(student, internship) {
  const terms = [
    internship.title,
    internship.description,
    ...internship.requirements.map((item) => item.skill.name),
  ]
    .map(normalize)
    .join(" ");
  const matches = student.projects.filter((project) => terms.includes(normalize(project.technologiesUsed)) || terms.includes(normalize(project.title)));
  return percentage(matches.length ? 80 : student.projects.length ? 55 : 25);
}

function preferenceScore(student, internship) {
  let score = 0;
  if (student.locationPreference && normalize(student.locationPreference).includes(normalize(internship.location))) score += 50;
  if (student.industryPreference && normalize(student.industryPreference).includes(normalize(internship.company.industry))) score += 50;
  return score || 35;
}

function availabilityScore(student, internship) {
  if (!student.availability) return 50;
  return student.availability <= internship.deadline ? 85 : 45;
}

function explain(student, internship, scores) {
  const matchedSkills = internship.requirements
    .filter((requirement) => student.skills.some((item) => item.skillId === requirement.skillId))
    .map((requirement) => requirement.skill.name);
  const skills = matchedSkills.length ? matchedSkills.join(", ") : "adjacent project evidence";
  return `Strong fit because the profile matches ${skills}. Score combines skills, project relevance, preferences, and availability.`;
}

async function maybeExplainWithProvider(student, internship, scores) {
  if (config.explanationProvider !== "openai") {
    return explain(student, internship, scores);
  }

  return generateMatchExplanation({
    studentSummary: `${student.firstName} ${student.lastName}, ${student.degreeProgram}, skills: ${student.skills.map((item) => item.skill.name).join(", ")}`,
    internshipSummary: `${internship.title} at ${internship.company.name}, requirements: ${internship.requirements.map((item) => item.skill.name).join(", ")}`,
    scoreBreakdown: scores,
  });
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

  const ranked = internships.map((internship) => {
      const scores = {
        skills: skillScore(student, internship),
        projects: projectScore(student, internship),
        preferences: preferenceScore(student, internship),
        availability: availabilityScore(student, internship),
      };
      const matchScore = percentage(
        scores.skills * WEIGHTS.skills +
          scores.projects * WEIGHTS.projects +
          scores.preferences * WEIGHTS.preferences +
          scores.availability * WEIGHTS.availability,
      );
      return {
        internship,
        matchScore,
        explanation: null,
        scores,
      };
    });

  if (config.matchingProvider === "openai" && config.openaiApiKey) {
    await Promise.all(
      ranked.slice(0, 10).map(async (item) => {
        const text = `${item.internship.title} ${item.internship.description} ${item.internship.requirements.map((r) => r.skill.name).join(" ")}`;
        item.embedding = await createEmbedding(text);
      }),
    );
  }

  const withExplanations = await Promise.all(
    ranked.map(async (item) => ({
      ...item,
      explanation: await maybeExplainWithProvider(student, item.internship, item.scores),
    })),
  );

  return withExplanations.sort((a, b) => b.matchScore - a.matchScore);
}
