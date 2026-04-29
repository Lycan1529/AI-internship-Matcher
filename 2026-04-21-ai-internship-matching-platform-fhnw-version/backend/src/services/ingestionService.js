import { prisma } from "../db.js";

export async function ingestApprovedPostings(sourceName, postings) {
  const results = [];
  for (const posting of postings) {
    const duplicateKey = normalizeDuplicateKey(posting);
    const company = await prisma.company.upsert({
      where: { email: posting.companyEmail },
      update: { name: posting.companyName, industry: posting.industry, location: posting.location },
      create: {
        name: posting.companyName,
        email: posting.companyEmail,
        industry: posting.industry,
        location: posting.location,
      },
    });

    const internship = await prisma.internship.create({
      data: {
        companyId: company.id,
        title: posting.title,
        description: posting.description,
        location: posting.location,
        workMode: posting.workMode,
        duration: posting.duration,
        salaryRange: posting.salaryRange,
        deadline: new Date(posting.deadline),
        duplicateKey,
        sources: {
          create: {
            platformName: sourceName,
            sourceUrl: posting.sourceUrl,
            sourceType: posting.sourceType,
            externalPostingId: posting.externalPostingId,
            isActive: true,
          },
        },
      },
      include: { sources: true },
    });
    results.push(internship);
  }
  return results;
}

function normalizeDuplicateKey(posting) {
  return [posting.title, posting.companyName, posting.location]
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
