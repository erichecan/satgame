import { prisma } from "@/lib/db";
import questionBankFrequency from "../../../../prisma/content/questionbank-frequency.json";

const SOURCES = new Set(["sat_262", "qbank_wic"]);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get("source") ?? "sat_262";
  if (!SOURCES.has(source)) {
    return Response.json({ error: true, message: "Unknown vocabulary source" }, { status: 400 });
  }

  const words = await prisma.word.findMany({
    where: { isActive: true, sourceTags: { has: source } },
    select: {
      id: true,
      word: true,
      partOfSpeech: true,
      definitionEn: true,
      exampleEn: true,
      synonyms: true,
      rank: true,
      qbankQuestionCount: true,
      qbankMentionCount: true,
      qbankWicAnswerCount: true,
      skillProgress: {
        select: {
          skill: true,
          masteryLevel: true,
          consecutiveCorrect: true,
          reviewCount: true,
          correctCount: true,
          nextReview: true,
        },
      },
    },
    orderBy: [{ qbankWicAnswerCount: "desc" }, { rank: "asc" }, { word: "asc" }],
  });

  return Response.json({ source, words, questionBankSnapshot: questionBankFrequency });
}
