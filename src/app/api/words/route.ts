import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const word = searchParams.get("word");

  if (!word) {
    return Response.json({ error: true, message: "缺少 word 参数" }, { status: 400 });
  }

  const found = await prisma.word.findUnique({ where: { word: word.toLowerCase() } });
  if (!found) {
    return Response.json({ error: true, message: "词条不存在" }, { status: 404 });
  }
  return Response.json({ word: found });
}
