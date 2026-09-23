import fs from "node:fs/promises";
import pdf from "pdf-parse";

const knownSkills = ["Python", "SQL", "Power BI", "Data Analysis", "AI", "React", "TypeScript", "UX", "CRM", "Excel"];

export async function parseCvFile(filePath) {
  const buffer = await fs.readFile(filePath);
  const parsed = await pdf(buffer);
  const text = parsed.text || "";
  const lower = text.toLowerCase();
  const skills = knownSkills.filter((skill) => lower.includes(skill.toLowerCase()));

  return {
    textPreview: text.slice(0, 1000),
    skills,
    experience: extractSection(text, "experience"),
    education: extractSection(text, "education"),
  };
}

function extractSection(text, keyword) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const index = lines.findIndex((line) => line.toLowerCase().includes(keyword));
  return index >= 0 ? lines.slice(index, index + 5) : [];
}
