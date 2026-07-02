import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const gameType = searchParams.get("gameType");
  const take = Math.min(Number(searchParams.get("take")) || 20, 100);

  if (!gameType) {
    return Response.json({ error: true, message: "缺少 gameType 参数" }, { status: 400 });
  }

  const items = await prisma.gameItem.findMany({
    where: { gameType, isActive: true },
    take,
    orderBy: { createdAt: "asc" },
  });
  return Response.json({ items });
}
