import { prisma } from "@/lib/db";
import { nextSrsState } from "@/lib/srs";
import { recordXp } from "@/lib/gamification";
import { markGamePlayed } from "@/lib/daily";
import { addToReview } from "@/lib/learning";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const gameType = searchParams.get("gameType");
  const due = await prisma.progress.findMany({
    where: {
      ...(gameType ? { gameType } : {}),
      nextReview: { lte: new Date() },
    },
    orderBy: { nextReview: "asc" },
    take: 50,
  });
  return Response.json({ due });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { gameType, skill, itemId, wordId, result, errorTag } = body as {
      gameType: string;
      skill: string;
      itemId?: string;
      wordId?: string;
      result: "correct" | "incorrect";
      errorTag?: string;
    };

    if (!gameType || !skill || !result) {
      return Response.json(
        { error: true, message: "缺少必填字段 gameType/skill/result" },
        { status: 400 }
      );
    }

    const existing = itemId
      ? await prisma.progress.findFirst({ where: { gameType, itemId } })
      : null;

    const srs = nextSrsState(
      {
        masteryScore: existing?.masteryScore ?? 0,
        consecutiveCorrect: existing?.consecutiveCorrect ?? 0,
      },
      result === "correct"
    );

    // 答对清空 errorTag，答错记录掉进的陷阱类型
    const tag = result === "incorrect" ? errorTag ?? null : null;

    const progress = existing
      ? await prisma.progress.update({
          where: { id: existing.id },
          data: {
            result,
            attempts: existing.attempts + 1,
            masteryScore: srs.masteryScore,
            consecutiveCorrect: srs.consecutiveCorrect,
            nextReview: srs.nextReview,
            errorTag: tag,
          },
        })
      : await prisma.progress.create({
          data: {
            gameType,
            itemId,
            skill,
            result,
            masteryScore: srs.masteryScore,
            consecutiveCorrect: srs.consecutiveCorrect,
            nextReview: srs.nextReview,
            errorTag: tag,
          },
        });

    if (wordId && result === "incorrect") {
      await addToReview(wordId, "wrong", gameType);
    }

    const stats = await recordXp(result);
    await markGamePlayed(gameType);

    return Response.json({ progress, stats });
  } catch (error) {
    console.error("[API Route Error]", error);
    return Response.json(
      {
        error: true,
        message: error instanceof Error ? error.message : "未知错误",
        ...(process.env.NODE_ENV === "development" && {
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
      { status: 500 }
    );
  }
}
