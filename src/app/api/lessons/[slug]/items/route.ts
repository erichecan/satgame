import { getLesson } from "@/content/lessons";
import { loadPracticeItems } from "@/lib/lesson-practice";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const lesson = getLesson(slug);
    if (!lesson) {
      return Response.json({ error: true, message: `Unknown lesson: ${slug}` }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const take = Math.min(Math.max(Number(searchParams.get("take")) || 8, 1), 20);
    const round = Math.max(Number(searchParams.get("round")) || 0, 0);

    const items = await loadPracticeItems(lesson, take, round);
    return Response.json({ items });
  } catch (error) {
    console.error("[API Route Error]", error);
    return Response.json(
      {
        error: true,
        message: error instanceof Error ? error.message : "Unknown error",
        ...(process.env.NODE_ENV === "development" && {
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
      { status: 500 }
    );
  }
}
