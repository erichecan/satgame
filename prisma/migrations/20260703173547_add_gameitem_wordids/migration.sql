-- AlterTable
ALTER TABLE "GameItem" ADD COLUMN     "wordIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
