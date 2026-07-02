import { prisma } from "@/lib/db";

export type AddToReviewReason = "wrong" | "asked_hint" | "gave_up" | "manual";

export async function addToReview(
  wordId: string,
  reason: AddToReviewReason,
  sourceGame?: string
) {
  const existing = await prisma.vocabNote.findFirst({ where: { wordId } });
  if (existing) {
    return prisma.vocabNote.update({
      where: { id: existing.id },
      data: {
        addedFrom: reason,
        sourceGame: sourceGame ?? existing.sourceGame,
        nextReview: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
    });
  }
  return prisma.vocabNote.create({
    data: {
      wordId,
      addedFrom: reason,
      sourceGame,
      nextReview: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  });
}
