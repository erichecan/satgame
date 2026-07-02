import { getStats } from "@/lib/gamification";

export async function GET() {
  const stats = await getStats();
  return Response.json({ stats });
}
