import { markQuizAnswered } from "@/lib/daily";

export async function POST(req: Request) {
  try {
    const { quizItemId, result } = (await req.json()) as {
      quizItemId: string;
      result: "correct" | "incorrect";
    };
    if (!quizItemId || !result) {
      return Response.json({ error: true, message: "缺少 quizItemId/result" }, { status: 400 });
    }
    const assignment = await markQuizAnswered(quizItemId, result);
    return Response.json({ assignment });
  } catch (error) {
    console.error("[API Route Error]", error);
    return Response.json(
      { error: true, message: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}
