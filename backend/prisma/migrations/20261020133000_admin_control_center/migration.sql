-- Administrative control center: preserve existing company visibility during rollout,
-- then make newly created companies pending human verification by default.
CREATE TYPE "AccountStatus" AS ENUM ('active', 'suspended');
CREATE TYPE "CompanyVerificationStatus" AS ENUM ('pending', 'verified', 'rejected', 'suspended');
CREATE TYPE "InternshipModerationStatus" AS ENUM ('active', 'flagged', 'removed');
CREATE TYPE "AuditOutcome" AS ENUM ('success', 'failed');
CREATE TYPE "MatchingRunStatus" AS ENUM ('success', 'failed');

ALTER TABLE "User"
  ADD COLUMN "status" "AccountStatus" NOT NULL DEFAULT 'active',
  ADD COLUMN "displayName" TEXT,
  ADD COLUMN "lastActiveAt" TIMESTAMP(3),
  ADD COLUMN "suspendedAt" TIMESTAMP(3);

ALTER TABLE "Company"
  ADD COLUMN "verificationStatus" "CompanyVerificationStatus" NOT NULL DEFAULT 'verified',
  ADD COLUMN "verificationNotes" TEXT,
  ADD COLUMN "rejectionReason" TEXT,
  ADD COLUMN "reviewedById" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3);

ALTER TABLE "Company" ALTER COLUMN "verificationStatus" SET DEFAULT 'pending';

ALTER TABLE "Internship"
  ADD COLUMN "moderationStatus" "InternshipModerationStatus" NOT NULL DEFAULT 'active',
  ADD COLUMN "moderationReason" TEXT,
  ADD COLUMN "moderatedById" TEXT,
  ADD COLUMN "moderatedAt" TIMESTAMP(3);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "outcome" "AuditOutcome" NOT NULL DEFAULT 'success',
  "reason" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MatchingRun" (
  "id" TEXT NOT NULL,
  "status" "MatchingRunStatus" NOT NULL,
  "provider" TEXT NOT NULL,
  "algorithmVersion" TEXT NOT NULL,
  "jobsProcessed" INTEGER NOT NULL DEFAULT 0,
  "durationMs" INTEGER,
  "errorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MatchingRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");
CREATE INDEX "MatchingRun_createdAt_idx" ON "MatchingRun"("createdAt");
CREATE INDEX "MatchingRun_status_createdAt_idx" ON "MatchingRun"("status", "createdAt");

ALTER TABLE "Company" ADD CONSTRAINT "Company_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Internship" ADD CONSTRAINT "Internship_moderatedById_fkey"
  FOREIGN KEY ("moderatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
