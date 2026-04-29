import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const skills = [
  ["Python", "technical"],
  ["SQL", "technical"],
  ["Power BI", "analytics"],
  ["Data Analysis", "analytics"],
  ["AI", "technical"],
  ["Business Strategy", "business"],
  ["Presentation", "business"],
  ["Market Research", "business"],
  ["Project Management", "business"],
  ["React", "technical"],
  ["TypeScript", "technical"],
  ["UX", "product"],
  ["CRM", "business"],
  ["Excel", "analytics"],
];

async function upsertSkill(name, category) {
  return prisma.skill.upsert({
    where: { name },
    update: { category },
    create: { name, category },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 10);
  const skillRecords = Object.fromEntries(
    await Promise.all(skills.map(async ([name, category]) => [name, await upsertSkill(name, category)])),
  );

  const studentUser = await prisma.user.upsert({
    where: { email: "mira.keller@students.fhnw.ch" },
    update: {},
    create: { email: "mira.keller@students.fhnw.ch", passwordHash, role: "student" },
  });

  const student = await prisma.studentProfile.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      firstName: "Mira",
      lastName: "Keller",
      degreeProgram: "BSc Business Information Technology",
      semester: 5,
      locationPreference: "Basel",
      industryPreference: "AI, Finance, Consulting",
      availability: new Date("2026-08-01"),
      cvUrl: "/uploads/mira-keller-cv.pdf",
      cvSummary: "Business IT student with analytics, SQL, Power BI, and sustainability reporting experience.",
      skills: {
        create: ["Python", "SQL", "Power BI", "Data Analysis"].map((name) => ({
          skillId: skillRecords[name].id,
          proficiency: 4,
          yearsExperience: 1.5,
        })),
      },
      projects: {
        create: {
          title: "Sustainability Analytics Dashboard",
          description: "FHNW semester project using SQL and Power BI to analyze ESG indicators.",
          technologiesUsed: "Python, SQL, Power BI",
        },
      },
    },
  });

  const company = await prisma.company.upsert({
    where: { email: "careers@zurich-finai.example" },
    update: {},
    create: {
      name: "Zurich FinAI Lab",
      email: "careers@zurich-finai.example",
      industry: "Finance AI",
      location: "Zurich",
      description: "Swiss fintech lab building AI products for financial operations.",
    },
  });

  const recruiterUser = await prisma.user.upsert({
    where: { email: "recruiter@zurich-finai.example" },
    update: {},
    create: { email: "recruiter@zurich-finai.example", passwordHash, role: "recruiter" },
  });

  await prisma.recruiter.upsert({
    where: { userId: recruiterUser.id },
    update: {},
    create: {
      userId: recruiterUser.id,
      companyId: company.id,
      firstName: "Nina",
      lastName: "Fischer",
      role: "Talent Acquisition",
    },
  });

  const internship = await prisma.internship.create({
    data: {
      companyId: company.id,
      title: "AI Business Analyst Intern",
      description: "Analyze AI use cases, translate business requirements, and support product delivery.",
      location: "Zurich",
      workMode: "hybrid",
      duration: "6 months",
      salaryRange: "CHF 1,800-2,400 / month",
      deadline: new Date("2026-06-30"),
      duplicateKey: "ai-business-analyst-zurich",
      sources: {
        create: {
          platformName: "LinkedIn",
          sourceUrl: "https://www.linkedin.com/jobs/view/ai-business-analyst-intern-zurich-finai-lab",
          sourceType: "job_board",
          externalPostingId: "li-finai-analyst-2026",
        },
      },
      requirements: {
        create: ["AI", "Data Analysis", "Business Strategy"].map((name, index) => ({
          skillId: skillRecords[name].id,
          requiredLevel: index === 0 ? 4 : 3,
          weight: index === 0 ? 0.5 : 0.25,
        })),
      },
    },
  });

  await prisma.matchRecommendation.upsert({
    where: { studentId_internshipId: { studentId: student.id, internshipId: internship.id } },
    update: {},
    create: {
      studentId: student.id,
      internshipId: internship.id,
      matchScore: 86,
      explanation: "Strong analytics profile with Python and data analysis experience. Business strategy is the main growth area.",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
