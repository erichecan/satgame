ALTER TABLE "Word"
  ADD COLUMN "synonyms" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "sourceTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "qbankQuestionCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "qbankMentionCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "qbankWicAnswerCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "VocabularySkillProgress" (
  "id" TEXT NOT NULL,
  "wordId" TEXT NOT NULL,
  "skill" TEXT NOT NULL,
  "masteryLevel" INTEGER NOT NULL DEFAULT 0,
  "consecutiveCorrect" INTEGER NOT NULL DEFAULT 0,
  "reviewCount" INTEGER NOT NULL DEFAULT 0,
  "correctCount" INTEGER NOT NULL DEFAULT 0,
  "nextReview" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VocabularySkillProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VocabularySkillProgress_wordId_skill_key"
  ON "VocabularySkillProgress"("wordId", "skill");
CREATE INDEX "VocabularySkillProgress_skill_nextReview_idx"
  ON "VocabularySkillProgress"("skill", "nextReview");
ALTER TABLE "VocabularySkillProgress"
  ADD CONSTRAINT "VocabularySkillProgress_wordId_fkey"
  FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;
