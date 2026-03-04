-- Coach V2 Migration : 7 dimensions, nouveaux modèles coach
-- IMPORTANT : RENAME au lieu de DROP+ADD pour conserver les données existantes

-- ============================================
-- 1. STATS : Renommer les colonnes existantes + ajouter les nouvelles
-- ============================================

-- Renommer health → body
ALTER TABLE "stats" RENAME COLUMN "health" TO "body";

-- Renommer energy → mind
ALTER TABLE "stats" RENAME COLUMN "energy" TO "mind";

-- Renommer wealth → finance
ALTER TABLE "stats" RENAME COLUMN "wealth" TO "finance";

-- Ajouter les nouvelles dimensions
ALTER TABLE "stats" ADD COLUMN "love" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "stats" ADD COLUMN "career" INTEGER NOT NULL DEFAULT 50;

-- ============================================
-- 2. QUESTCATEGORY ENUM : Ajouter les nouvelles valeurs
-- ============================================

ALTER TYPE "QuestCategory" ADD VALUE 'BODY';
ALTER TYPE "QuestCategory" ADD VALUE 'MIND';
ALTER TYPE "QuestCategory" ADD VALUE 'LOVE';
ALTER TYPE "QuestCategory" ADD VALUE 'CAREER';
ALTER TYPE "QuestCategory" ADD VALUE 'FINANCE';

-- ============================================
-- 3. COACHPROFILE : Mettre à jour vers V2
-- ============================================

-- Supprimer les anciennes colonnes V1
ALTER TABLE "coach_profiles" DROP COLUMN IF EXISTS "beliefs";
ALTER TABLE "coach_profiles" DROP COLUMN IF EXISTS "coachNotes";
ALTER TABLE "coach_profiles" DROP COLUMN IF EXISTS "habitPatterns";
ALTER TABLE "coach_profiles" DROP COLUMN IF EXISTS "ikigai";
ALTER TABLE "coach_profiles" DROP COLUMN IF EXISTS "keyHabits";
ALTER TABLE "coach_profiles" DROP COLUMN IF EXISTS "lastSessionAt";
ALTER TABLE "coach_profiles" DROP COLUMN IF EXISTS "totalSessions";
ALTER TABLE "coach_profiles" DROP COLUMN IF EXISTS "vision1y";
ALTER TABLE "coach_profiles" DROP COLUMN IF EXISTS "vision3m";
ALTER TABLE "coach_profiles" DROP COLUMN IF EXISTS "vision5y";
ALTER TABLE "coach_profiles" DROP COLUMN IF EXISTS "wheelOfLife";

-- Ajouter les nouvelles colonnes V2
ALTER TABLE "coach_profiles" ADD COLUMN "chaosOrder" JSONB;
ALTER TABLE "coach_profiles" ADD COLUMN "onboardingDone" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "coach_profiles" ADD COLUMN "shadows" JSONB;
ALTER TABLE "coach_profiles" ADD COLUMN "summary" TEXT;
ALTER TABLE "coach_profiles" ADD COLUMN "unclearZones" JSONB;
ALTER TABLE "coach_profiles" ADD COLUMN "vision" JSONB;

-- ============================================
-- 4. COACHSESSION : Mettre à jour vers V2
-- ============================================

-- Supprimer l'ancien index
DROP INDEX IF EXISTS "coach_sessions_userId_createdAt_idx";

-- Supprimer les anciennes colonnes
ALTER TABLE "coach_sessions" DROP COLUMN IF EXISTS "actions";
ALTER TABLE "coach_sessions" DROP COLUMN IF EXISTS "createdAt";
ALTER TABLE "coach_sessions" DROP COLUMN IF EXISTS "insights";
ALTER TABLE "coach_sessions" DROP COLUMN IF EXISTS "messages";
ALTER TABLE "coach_sessions" DROP COLUMN IF EXISTS "summary";

-- Ajouter les nouvelles colonnes
ALTER TABLE "coach_sessions" ADD COLUMN "endedAt" TIMESTAMP(3);
ALTER TABLE "coach_sessions" ADD COLUMN "profileSnapshot" JSONB;
ALTER TABLE "coach_sessions" ADD COLUMN "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "coach_sessions" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "coach_sessions" ADD COLUMN "topic" TEXT;
ALTER TABLE "coach_sessions" ADD COLUMN "wisdomGained" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "coach_sessions" ALTER COLUMN "phase" SET DEFAULT 1;

-- ============================================
-- 5. COACHMESSAGE : Créer la nouvelle table
-- ============================================

CREATE TABLE "coach_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "insightScore" INTEGER,
    "zone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coach_messages_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- 6. COACHPROJECTPROPOSAL : Créer la nouvelle table
-- ============================================

CREATE TABLE "coach_project_proposals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "why" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "statsImpact" JSONB,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "questId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coach_project_proposals_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- 7. INDEX ET FOREIGN KEYS
-- ============================================

CREATE INDEX "coach_messages_sessionId_createdAt_idx" ON "coach_messages"("sessionId", "createdAt");
CREATE INDEX "coach_project_proposals_userId_status_idx" ON "coach_project_proposals"("userId", "status");
CREATE INDEX "coach_sessions_userId_status_idx" ON "coach_sessions"("userId", "status");

ALTER TABLE "coach_messages" ADD CONSTRAINT "coach_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "coach_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "coach_project_proposals" ADD CONSTRAINT "coach_project_proposals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
