import { prisma } from "@/lib/db";
import { getOrCreateDailyAssignment } from "@/lib/daily";

export async function GET() {
  try {
    const assignment = await getOrCreateDailyAssignment();

    const words = await prisma.word.findMany({ where: { id: { in: assignment.wordIds } } });
    const wordById = new Map(words.map((w) => [w.id, w]));
    const orderedWords = assignment.wordIds.map((id) => wordById.get(id)).filter((w) => w !== undefined);

    const quizItems = await prisma.quizItem.findMany({ where: { id: { in: assignment.quizItemIds } } });
    const quizById = new Map(quizItems.map((q) => [q.id, q]));
    const orderedQuiz = assignment.quizItemIds.map((id) => quizById.get(id)).filter((q) => q !== undefined);

    return Response.json({ assignment, words: orderedWords, quizItems: orderedQuiz });
  } catch (error) {
    console.error("[API Route Error]", error);
    return Response.json(
      { error: true, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
