import { prisma } from "@/lib/db";
import { nextVocabularyReview, VOCAB_SKILLS, type VocabSkill } from "@/lib/vocab-srs";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    wordId?: string;
    skill?: string;
    correct?: boolean;
  };
  if (!body.wordId || !VOCAB_SKILLS.includes(body.skill as VocabSkill) || typeof body.correct !== "boolean") {
    return Response.json({ error: true, message: "Invalid vocabulary progress" }, { status: 400 });
  }

  const skill = body.skill as VocabSkill;
  const current = await prisma.vocabularySkillProgress.findUnique({
    where: { wordId_skill: { wordId: body.wordId, skill } },
  });
  const state = nextVocabularyReview(
    { masteryLevel: current?.masteryLevel ?? 0, consecutiveCorrect: current?.consecutiveCorrect ?? 0 },
    body.correct
  );
  const progress = await prisma.vocabularySkillProgress.upsert({
    where: { wordId_skill: { wordId: body.wordId, skill } },
    create: {
      wordId: body.wordId,
      skill,
      masteryLevel: state.masteryLevel,
      consecutiveCorrect: state.consecutiveCorrect,
      reviewCount: 1,
      correctCount: body.correct ? 1 : 0,
      nextReview: state.nextReview,
    },
    update: {
      masteryLevel: state.masteryLevel,
      consecutiveCorrect: state.consecutiveCorrect,
      reviewCount: { increment: 1 },
      correctCount: body.correct ? { increment: 1 } : undefined,
      nextReview: state.nextReview,
    },
  });

  return Response.json({ progress, correct: body.correct, intervalDays: state.intervalDays });
}
