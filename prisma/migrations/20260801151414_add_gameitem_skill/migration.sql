-- AlterTable
ALTER TABLE "GameItem" ADD COLUMN     "skill" TEXT;

-- CreateIndex
CREATE INDEX "GameItem_skill_isActive_idx" ON "GameItem"("skill", "isActive");
