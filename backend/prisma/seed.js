import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const skillCatalog = [
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
  ["Node.js", "technical"],
  ["UX", "product"],
  ["CRM", "business"],
  ["Excel", "analytics"],
  ["Sustainability", "business"],
  ["Testing", "technical"],
  ["Automation", "technical"],
];

const studentSeeds = [
  {
    email: "mira.keller@students.fhnw.ch",
    firstName: "Mira",
    lastName: "Keller",
    degreeProgram: "BSc Business Information Technology",
    semester: 5,
    locationPreference: "Basel",
    industryPreference: "AI, Finance, Consulting",
    availability: "2026-08-01",
    cvUrl: "/uploads/mira-keller-cv.pdf",
    cvSummary: "Business IT student with analytics, SQL, Power BI, and sustainability reporting experience.",
    skills: ["Python", "SQL", "Power BI", "Data Analysis", "Sustainability"],
    projects: [
      {
        title: "Sustainability Analytics Dashboard",
        description: "FHNW semester project using SQL and Power BI to analyze ESG indicators.",
        technologiesUsed: "Python, SQL, Power BI",
      },
      {
        title: "Business Analysis Support",
        description: "Part-time role supporting reporting and process analysis.",
        technologiesUsed: "Excel, Presentation, Data Analysis",
      },
    ],
  },
  {
    email: "jonas.meier@students.fhnw.ch",
    firstName: "Jonas",
    lastName: "Meier",
    degreeProgram: "BSc Computer Science",
    semester: 4,
    locationPreference: "Windisch",
    industryPreference: "Software, Product, Healthtech",
    availability: "2026-07-01",
    cvUrl: "/uploads/jonas-meier-cv.pdf",
    cvSummary: "Frontend-focused student with React, TypeScript, testing, and UX project work.",
    skills: ["React", "TypeScript", "Node.js", "UX", "Testing"],
    projects: [
      {
        title: "Product Prototype Studio",
        description: "Built and tested a frontend product prototype for a student studio.",
        technologiesUsed: "React, TypeScript, UX",
      },
      {
        title: "Frontend Student Assistant",
        description: "Supported UI delivery and QA workflows.",
        technologiesUsed: "Testing, Node.js, Presentation",
      },
    ],
  },
  {
    email: "lea.baumann@students.fhnw.ch",
    firstName: "Lea",
    lastName: "Baumann",
    degreeProgram: "BSc International Management",
    semester: 6,
    locationPreference: "Olten",
    industryPreference: "Marketing, Sales, Mobility",
    availability: "2026-09-01",
    cvUrl: "/uploads/lea-baumann-cv.pdf",
    cvSummary: "International Management student with CRM, market research, sales operations, and presentation experience.",
    skills: ["Market Research", "CRM", "Excel", "Presentation", "Project Management"],
    projects: [
      {
        title: "CRM Migration Project",
        description: "Supported customer data migration and reporting.",
        technologiesUsed: "CRM, Excel, Project Management",
      },
      {
        title: "Sales Operations Internship",
        description: "Supported pipeline analysis and campaign coordination.",
        technologiesUsed: "Market Research, Presentation, Excel",
      },
    ],
  },
];

const internshipSeeds = [
  {
    companyName: "Novaterra Analytics",
    companyEmail: "careers@novaterra.example",
    industry: "Sustainability Analytics",
    location: "Basel",
    description: "Swiss analytics company focused on ESG reporting and sustainability intelligence.",
    title: "Sustainability Data Intern",
    roleDescription: "Support sustainability reporting, SQL analysis, and dashboard delivery.",
    workMode: "hybrid",
    duration: "6 months",
    salaryRange: "CHF 1,800-2,200 / month",
    deadline: "2026-08-15",
    duplicateKey: "sustainability-data-basel",
    source: {
      platformName: "Company career page",
      sourceUrl: "https://example.com/novaterra/sustainability-data-intern",
      sourceType: "company_site",
      externalPostingId: "novaterra-2026-sdi",
    },
    required: ["Python", "SQL", "Data Analysis"],
    preferred: ["Power BI", "Sustainability", "Presentation"],
  },
  {
    companyName: "Medflow Digital",
    companyEmail: "careers@medflow.example",
    industry: "Healthtech Product",
    location: "Zurich",
    description: "Digital product company building software for healthcare workflows.",
    title: "Frontend Product Intern",
    roleDescription: "Build product UI components and support prototype delivery.",
    workMode: "remote",
    duration: "6 months",
    salaryRange: "CHF 2,000-2,400 / month",
    deadline: "2026-07-31",
    duplicateKey: "frontend-product-zurich",
    source: {
      platformName: "LinkedIn",
      sourceUrl: "https://www.linkedin.com/jobs/view/frontend-product-intern-medflow-digital",
      sourceType: "job_board",
      externalPostingId: "li-medflow-frontend-2026",
    },
    required: ["React", "TypeScript", "UX"],
    preferred: ["Node.js", "Testing", "Presentation"],
  },
  {
    companyName: "SwissMove Services",
    companyEmail: "careers@swissmove.example",
    industry: "Mobility Operations",
    location: "Olten",
    description: "Mobility services provider with a growing CRM and sales operations team.",
    title: "Growth & CRM Intern",
    roleDescription: "Support CRM workflows, reporting, and growth operations.",
    workMode: "onsite",
    duration: "5 months",
    salaryRange: "CHF 1,700-2,100 / month",
    deadline: "2026-09-01",
    duplicateKey: "growth-crm-olten",
    source: {
      platformName: "Indeed",
      sourceUrl: "https://www.indeed.com/viewjob?jk=swissmove-growth-crm",
      sourceType: "job_board",
      externalPostingId: "indeed-swissmove-crm-2026",
    },
    required: ["CRM", "Excel", "Market Research"],
    preferred: ["Project Management", "Presentation", "SQL"],
  },
  {
    companyName: "Helio Consult",
    companyEmail: "careers@helio-consult.example",
    industry: "Consulting",
    location: "Bern",
    description: "Consulting firm focused on digital transformation and process design.",
    title: "Digital Transformation Intern",
    roleDescription: "Support project teams with analysis and presentation work.",
    workMode: "hybrid",
    duration: "6 months",
    salaryRange: "CHF 1,900-2,300 / month",
    deadline: "2026-08-20",
    duplicateKey: "digital-transformation-bern",
    source: {
      platformName: "Glassdoor",
      sourceUrl: "https://www.glassdoor.com/job-listing/digital-transformation-intern-helio",
      sourceType: "job_board",
      externalPostingId: "gd-helio-dti-2026",
    },
    required: ["Project Management", "Data Analysis", "Presentation"],
    preferred: ["Power BI", "UX", "Market Research"],
  },
  {
    companyName: "Zurich FinAI Lab",
    companyEmail: "careers@zurich-finai.example",
    industry: "Finance AI",
    location: "Zurich",
    description: "Swiss fintech lab building AI products for financial operations.",
    title: "AI Business Analyst Intern",
    roleDescription: "Analyze AI use cases, translate business requirements, and support product delivery.",
    workMode: "hybrid",
    duration: "6 months",
    salaryRange: "CHF 1,800-2,400 / month",
    deadline: "2026-08-10",
    duplicateKey: "ai-business-analyst-zurich",
    source: {
      platformName: "LinkedIn",
      sourceUrl: "https://www.linkedin.com/jobs/view/ai-business-analyst-intern-zurich-finai-lab",
      sourceType: "job_board",
      externalPostingId: "li-finai-analyst-2026",
    },
    required: ["AI", "Data Analysis", "Business Strategy"],
    preferred: ["Python", "Presentation", "Market Research"],
  },
  {
    companyName: "Basel Pharma Insights",
    companyEmail: "careers@basel-pharma.example",
    industry: "Pharma Operations",
    location: "Basel",
    description: "Operations and analytics partner for pharmaceutical teams.",
    title: "Data Science Operations Intern",
    roleDescription: "Support operational reporting and analytics workflows.",
    workMode: "onsite",
    duration: "6 months",
    salaryRange: "CHF 1,850-2,250 / month",
    deadline: "2026-09-12",
    duplicateKey: "data-science-operations-basel",
    source: {
      platformName: "Company career page",
      sourceUrl: "https://example.com/basel-pharma-insights/careers/data-science-operations-intern",
      sourceType: "company_site",
      externalPostingId: "bpi-dso-2026",
    },
    required: ["Python", "SQL", "Project Management"],
    preferred: ["Power BI", "Data Analysis", "Presentation"],
  },
  {
    companyName: "Alpine Consulting Group",
    companyEmail: "careers@alpine-consulting.example",
    industry: "Consulting Strategy",
    location: "Zurich",
    description: "Consulting group focused on business technology transformation.",
    title: "Business Technology Consulting Intern",
    roleDescription: "Support client work in strategy, PMO, and discovery research.",
    workMode: "hybrid",
    duration: "6 months",
    salaryRange: "CHF 1,900-2,300 / month",
    deadline: "2026-07-28",
    duplicateKey: "business-technology-consulting-zurich",
    source: {
      platformName: "Indeed",
      sourceUrl: "https://www.indeed.com/viewjob?jk=alpine-business-technology-consulting",
      sourceType: "job_board",
      externalPostingId: "indeed-alpine-btc-2026",
    },
    required: ["Business Strategy", "Presentation", "Project Management"],
    preferred: ["Data Analysis", "Market Research", "CRM"],
  },
  {
    companyName: "FinBridge Systems",
    companyEmail: "careers@finbridge.example",
    industry: "Finance Product Analytics",
    location: "Zurich",
    description: "Finance software company investing in product analytics and BI.",
    title: "Product Analytics Intern",
    roleDescription: "Support analytics, reporting, and product insight generation.",
    workMode: "remote",
    duration: "6 months",
    salaryRange: "CHF 1,850-2,300 / month",
    deadline: "2026-08-22",
    duplicateKey: "product-analytics-zurich",
    source: {
      platformName: "Company career page",
      sourceUrl: "https://example.com/finbridge/jobs/product-analytics-intern",
      sourceType: "company_site",
      externalPostingId: "finbridge-product-analytics-2026",
    },
    required: ["SQL", "Excel", "Data Analysis"],
    preferred: ["UX", "Power BI", "Presentation"],
  },
  {
    companyName: "Museum Basel",
    companyEmail: "careers@museum-basel.example",
    industry: "History Culture",
    location: "Basel",
    description: "Cultural institution modernizing its archive and public programming systems.",
    title: "Digital Archive and History Intern",
    roleDescription: "Support digital archive work and research-oriented content preparation.",
    workMode: "onsite",
    duration: "4 months",
    salaryRange: "CHF 1,500-1,900 / month",
    deadline: "2026-08-05",
    duplicateKey: "digital-archive-history-basel",
    source: {
      platformName: "Company career page",
      sourceUrl: "https://example.com/museum-basel/digital-archive-history-intern",
      sourceType: "company_site",
      externalPostingId: "museum-basel-history-2026",
    },
    required: ["Market Research", "Presentation", "Excel"],
    preferred: ["Project Management", "Data Analysis", "CRM"],
  },
  {
    companyName: "AgriFuture Schweiz",
    companyEmail: "careers@agrifuture.example",
    industry: "Agriculture Innovation",
    location: "Aarau",
    description: "Smart farming and agricultural innovation partner in Switzerland.",
    title: "Smart Farming Innovation Intern",
    roleDescription: "Support innovation projects in AI-enabled agriculture workflows.",
    workMode: "hybrid",
    duration: "6 months",
    salaryRange: "CHF 1,800-2,200 / month",
    deadline: "2026-07-20",
    duplicateKey: "smart-farming-aarau",
    source: {
      platformName: "LinkedIn",
      sourceUrl: "https://www.linkedin.com/jobs/view/smart-farming-innovation-intern-agrifuture",
      sourceType: "job_board",
      externalPostingId: "li-agrifuture-farming-2026",
    },
    required: ["AI", "Data Analysis", "Project Management"],
    preferred: ["Python", "Excel", "Business Strategy"],
  },
];

async function upsertSkill(name, category) {
  return prisma.skill.upsert({
    where: { name },
    update: { category },
    create: { name, category },
  });
}

async function resetDatabase() {
  await prisma.notification.deleteMany();
  await prisma.application.deleteMany();
  await prisma.matchRecommendation.deleteMany();
  await prisma.internshipSkillRequirement.deleteMany();
  await prisma.internshipSource.deleteMany();
  await prisma.internship.deleteMany();
  await prisma.studentSkill.deleteMany();
  await prisma.project.deleteMany();
  await prisma.cvDocument.deleteMany();
  await prisma.recruiter.deleteMany();
  await prisma.adminAnalytics.deleteMany();
  await prisma.company.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.skill.deleteMany();
}

async function main() {
  await resetDatabase();

  const passwordHash = await bcrypt.hash("Password123!", 10);
  const skillRecords = Object.fromEntries(
    await Promise.all(skillCatalog.map(async ([name, category]) => [name, await upsertSkill(name, category)])),
  );

  const studentRecords = [];
  for (const studentSeed of studentSeeds) {
    const user = await prisma.user.create({
      data: {
        email: studentSeed.email,
        passwordHash,
        role: "student",
      },
    });

    const student = await prisma.studentProfile.create({
      data: {
        userId: user.id,
        firstName: studentSeed.firstName,
        lastName: studentSeed.lastName,
        degreeProgram: studentSeed.degreeProgram,
        semester: studentSeed.semester,
        locationPreference: studentSeed.locationPreference,
        industryPreference: studentSeed.industryPreference,
        availability: new Date(studentSeed.availability),
        cvUrl: studentSeed.cvUrl,
        cvSummary: studentSeed.cvSummary,
        skills: {
          create: studentSeed.skills.map((name) => ({
            skillId: skillRecords[name].id,
            proficiency: 4,
            yearsExperience: 1.5,
          })),
        },
        projects: {
          create: studentSeed.projects,
        },
      },
    });

    studentRecords.push(student);
  }

  const recruiterCompanySeed = internshipSeeds.find((item) => item.companyName === "Zurich FinAI Lab");
  const recruiterCompany = await prisma.company.create({
    data: {
      name: recruiterCompanySeed.companyName,
      email: recruiterCompanySeed.companyEmail,
      industry: recruiterCompanySeed.industry,
      location: recruiterCompanySeed.location,
      description: recruiterCompanySeed.description,
    },
  });

  const recruiterUser = await prisma.user.create({
    data: {
      email: "recruiter@zurich-finai.example",
      passwordHash,
      role: "recruiter",
    },
  });

  await prisma.recruiter.create({
    data: {
      userId: recruiterUser.id,
      companyId: recruiterCompany.id,
      firstName: "Nina",
      lastName: "Fischer",
      role: "Talent Acquisition",
    },
  });

  await prisma.user.create({
    data: {
      email: "admin@lycan-demo.example",
      passwordHash,
      role: "admin",
    },
  });

  const companyCache = new Map([[recruiterCompany.name, recruiterCompany]]);

  for (const internshipSeed of internshipSeeds) {
    let company = companyCache.get(internshipSeed.companyName);
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: internshipSeed.companyName,
          email: internshipSeed.companyEmail,
          industry: internshipSeed.industry,
          location: internshipSeed.location,
          description: internshipSeed.description,
        },
      });
      companyCache.set(company.name, company);
    }

    await prisma.internship.create({
      data: {
        companyId: company.id,
        title: internshipSeed.title,
        description: internshipSeed.roleDescription,
        location: internshipSeed.location,
        workMode: internshipSeed.workMode,
        duration: internshipSeed.duration,
        salaryRange: internshipSeed.salaryRange,
        deadline: new Date(internshipSeed.deadline),
        duplicateKey: internshipSeed.duplicateKey,
        sources: {
          create: internshipSeed.source,
        },
        requirements: {
          create: [
            ...internshipSeed.required.map((name) => ({
              skillId: skillRecords[name].id,
              requiredLevel: 3,
              weight: 0.65,
            })),
            ...internshipSeed.preferred.map((name) => ({
              skillId: skillRecords[name].id,
              requiredLevel: 2,
              weight: 0.35,
            })),
          ],
        },
      },
    });
  }

  await prisma.adminAnalytics.create({
    data: {
      capturedAt: new Date(),
      totalStudents: studentRecords.length,
      totalRecruiters: 1,
      totalInternships: internshipSeeds.length,
      totalApplications: 0,
      totalNotifications: 0,
      topIndustry: "AI / Consulting",
      topLocation: "Zurich",
      companyId: recruiterCompany.id,
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
