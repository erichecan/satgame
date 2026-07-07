import { markWordViewed } from "@/lib/daily";

export async function POST(req: Request) {
  try {
    const { wordId, unknown } = (await req.json()) as { wordId: string; unknown?: boolean };
    if (!wordId) {
      return Response.json({ error: true, message: "Missing wordId" }, { status: 400 });
    }
    const assignment = await markWordViewed(wordId, !!unknown);
    return Response.json({ assignment });
  } catch (error) {
    console.error("[API Route Error]", error);
    return Response.json(
      { error: true, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
