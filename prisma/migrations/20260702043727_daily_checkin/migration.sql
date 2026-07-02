-- AlterTable
ALTER TABLE "Word" ADD COLUMN     "rank" INTEGER NOT NULL DEFAULT 9999,
ADD COLUMN     "synonymGroup" TEXT,
ADD COLUMN     "tier" TEXT NOT NULL DEFAULT 'sat_core';

-- CreateTable
CREATE TABLE "QuizItem" (
    "id" TEXT NOT NULL,
    "passage" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "wordIds" TEXT[],
    "domain" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 2,
    "explanation" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyAssignment" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "wordIds" TEXT[],
    "quizItemIds" TEXT[],
    "wordsViewed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "quizAnswers" JSONB NOT NULL DEFAULT '{}',
    "gamesPlayed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuizItem_isActive_idx" ON "QuizItem"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DailyAssignment_date_key" ON "DailyAssignment"("date");
