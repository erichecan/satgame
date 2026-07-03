import { prisma } from "@/lib/db";
import { getRecentWordIds, rankByWordOverlap } from "@/lib/daily";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const gameType = searchParams.get("gameType");
  const take = Math.min(Number(searchParams.get("take")) || 20, 100);

  if (!gameType) {
    return Response.json({ error: true, message: "缺少 gameType 参数" }, { status: 400 });
  }

  const pool = await prisma.gameItem.findMany({
    where: { gameType, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  const recentWordIds = await getRecentWordIds();
  const ranked = rankByWordOverlap(pool, recentWordIds);

  return Response.json({ items: ranked.slice(0, take) });
}
