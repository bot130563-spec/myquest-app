-- CreateEnum
CREATE TYPE "QuestCategory" AS ENUM ('HEALTH', 'ENERGY', 'WISDOM', 'SOCIAL', 'WEALTH', 'GENERAL');

-- CreateEnum
CREATE TYPE "QuestDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EPIC');

-- CreateEnum
CREATE TYPE "QuestStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'FAILED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "HabitFrequency" AS ENUM ('DAILY', 'WEEKLY', 'WEEKDAYS', 'WEEKENDS');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avatars" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Hero',
    "level" INTEGER NOT NULL DEFAULT 1,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "avatarType" TEXT NOT NULL DEFAULT 'warrior',
    "appearance" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "avatars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "health" INTEGER NOT NULL DEFAULT 50,
    "energy" INTEGER NOT NULL DEFAULT 50,
    "wisdom" INTEGER NOT NULL DEFAULT 50,
    "social" INTEGER NOT NULL DEFAULT 50,
    "wealth" INTEGER NOT NULL DEFAULT 50,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "QuestCategory" NOT NULL DEFAULT 'GENERAL',
    "difficulty" "QuestDifficulty" NOT NULL DEFAULT 'MEDIUM',
    "xpReward" INTEGER NOT NULL DEFAULT 25,
    "statBoost" INTEGER NOT NULL DEFAULT 2,
    "status" "QuestStatus" NOT NULL DEFAULT 'ACTIVE',
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT NOT NULL DEFAULT '⭐',
    "category" "QuestCategory" NOT NULL DEFAULT 'GENERAL',
    "frequency" "HabitFrequency" NOT NULL DEFAULT 'DAILY',
    "targetDays" JSONB NOT NULL DEFAULT '[]',
    "targetCount" INTEGER NOT NULL DEFAULT 1,
    "xpReward" INTEGER NOT NULL DEFAULT 10,
    "statBoost" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "totalCompletions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "habits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_logs" (
    "id" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "completedDate" DATE NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "habit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entryDate" DATE NOT NULL,
    "mood" INTEGER NOT NULL DEFAULT 3,
    "content" TEXT,
    "gratitudes" JSONB NOT NULL DEFAULT '[]',
    "dailyGoal" TEXT,
    "reflection" TEXT,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "xpAwarded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "avatars_userId_key" ON "avatars"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "stats_userId_key" ON "stats"("userId");

-- CreateIndex
CREATE INDEX "quests_userId_status_idx" ON "quests"("userId", "status");

-- CreateIndex
CREATE INDEX "habits_userId_isActive_idx" ON "habits"("userId", "isActive");

-- CreateIndex
CREATE INDEX "habit_logs_habitId_completedDate_idx" ON "habit_logs"("habitId", "completedDate");

-- CreateIndex
CREATE UNIQUE INDEX "habit_logs_habitId_completedDate_key" ON "habit_logs"("habitId", "completedDate");

-- CreateIndex
CREATE INDEX "journal_entries_userId_entryDate_idx" ON "journal_entries"("userId", "entryDate");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_userId_entryDate_key" ON "journal_entries"("userId", "entryDate");

-- AddForeignKey
ALTER TABLE "avatars" ADD CONSTRAINT "avatars_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stats" ADD CONSTRAINT "stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quests" ADD CONSTRAINT "quests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
