-- CreateTable
CREATE TABLE "Word" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "partOfSpeech" TEXT,
    "definitionEn" TEXT NOT NULL,
    "definitionCn" TEXT,
    "exampleEn" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameItem" (
    "id" TEXT NOT NULL,
    "gameType" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "payload" JSONB NOT NULL,
    "explanation" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Progress" (
    "id" TEXT NOT NULL,
    "gameType" TEXT NOT NULL,
    "itemId" TEXT,
    "skill" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "masteryScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "consecutiveCorrect" INTEGER NOT NULL DEFAULT 0,
    "nextReview" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VocabNote" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "addedFrom" TEXT NOT NULL,
    "sourceGame" TEXT,
    "masteryLevel" INTEGER NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "nextReview" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VocabNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStats" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "xp" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Word_word_key" ON "Word"("word");

-- CreateIndex
CREATE INDEX "GameItem_gameType_isActive_idx" ON "GameItem"("gameType", "isActive");

-- CreateIndex
CREATE INDEX "Progress_skill_nextReview_idx" ON "Progress"("skill", "nextReview");

-- CreateIndex
CREATE INDEX "VocabNote_nextReview_idx" ON "VocabNote"("nextReview");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_code_key" ON "Badge"("code");

-- AddForeignKey
ALTER TABLE "VocabNote" ADD CONSTRAINT "VocabNote_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
