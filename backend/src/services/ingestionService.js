import { prisma } from "../db.js";

export async function ingestApprovedPostings(sourceName, postings) {
  const results = [];
  for (const posting of postings) {
    const duplicateKey = normalizeDuplicateKey(posting);
    const source = normalizeSource(posting, sourceName);
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

    const existingSource = await prisma.internshipSource.findFirst({
      where: {
        platformName: source.platformName,
        OR: [
          { sourceUrl: source.sourceUrl },
          ...(source.externalPostingId ? [{ externalPostingId: source.externalPostingId }] : []),
        ],
      },
      include: { internship: true },
    });
    const existingInternship = existingSource?.internship || await prisma.internship.findFirst({
      where: { duplicateKey },
      orderBy: { updatedAt: "desc" },
    });

    const internshipData = {
      companyId: company.id,
      title: posting.title,
      description: posting.description,
      location: posting.location,
      workMode: posting.workMode,
      duration: posting.duration,
      salaryRange: posting.salaryRange,
      deadline: new Date(posting.deadline),
      duplicateKey,
      status: "open",
    };

    const internship = existingInternship
      ? await prisma.internship.update({
          where: { id: existingInternship.id },
          data: internshipData,
          include: { sources: true },
        })
      : await prisma.internship.create({
          data: internshipData,
          include: { sources: true },
        });

    if (existingSource) {
      await prisma.internshipSource.update({
        where: { id: existingSource.id },
        data: { internshipId: internship.id, isActive: true, lastCheckedAt: new Date() },
      });
    } else {
      await prisma.internshipSource.create({
        data: { ...source, internshipId: internship.id, isActive: true, duplicateGroup: duplicateKey },
      });
    }
    results.push(internship);
  }
  return results;
}

export async function deactivateStalePostings(maxAgeDays = 30) {
  const threshold = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);
  const result = await prisma.internshipSource.updateMany({
    where: { isActive: true, lastCheckedAt: { lt: threshold } },
    data: { isActive: false },
  });
  return { deactivatedSources: result.count, threshold };
}

function normalizeSource(posting, sourceName) {
  if (!posting.sourceUrl) throw new Error("Approved ingestion postings require sourceUrl");
  return {
    platformName: sourceName,
    sourceUrl: posting.sourceUrl,
    sourceType: posting.sourceType || "approved_api",
    externalPostingId: posting.externalPostingId || undefined,
    lastCheckedAt: new Date(),
  };
}

function normalizeDuplicateKey(posting) {
  return [posting.title, posting.companyName, posting.location]
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
