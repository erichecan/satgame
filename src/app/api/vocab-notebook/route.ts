import { prisma } from "@/lib/db";
import { addToReview, type AddToReviewReason } from "@/lib/learning";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dueOnly = searchParams.get("due") === "true";

  const notes = await prisma.vocabNote.findMany({
    where: dueOnly ? { nextReview: { lte: new Date() } } : {},
    include: { word: true },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ notes });
}

export async function POST(req: Request) {
  try {
    const { wordId, reason, sourceGame } = (await req.json()) as {
      wordId: string;
      reason: AddToReviewReason;
      sourceGame?: string;
    };

    if (!wordId || !reason) {
      return Response.json(
        { error: true, message: "Missing required field wordId/reason" },
        { status: 400 }
      );
    }

    const note = await addToReview(wordId, reason, sourceGame);
    return Response.json({ note });
  } catch (error) {
    console.error("[API Route Error]", error);
    return Response.json(
      { error: true, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
