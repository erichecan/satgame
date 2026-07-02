import { prisma } from "@/lib/db";

const XP_CORRECT = 10;
const XP_INCORRECT = 2;

const BADGE_DEFS = [
  { code: "first_correct", name: "初次答对", description: "答对第一题" },
  { code: "streak_3", name: "三日连击", description: "连续 3 天打卡" },
  { code: "streak_7", name: "一周不断", description: "连续 7 天打卡" },
  { code: "xp_100", name: "百分新手", description: "累计 100 XP" },
  { code: "xp_500", name: "五百达人", description: "累计 500 XP" },
] as const;

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export async function recordActivity(result: "correct" | "incorrect") {
  const now = new Date();
  const stats = await prisma.userStats.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", xp: 0, streak: 0 },
    update: {},
  });

  const xpGain = result === "correct" ? XP_CORRECT : XP_INCORRECT;

  let streak = stats.streak;
  if (!stats.lastActiveDate) {
    streak = 1;
  } else if (isSameDay(stats.lastActiveDate, now)) {
    streak = stats.streak;
  } else {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    streak = isSameDay(stats.lastActiveDate, yesterday) ? stats.streak + 1 : 1;
  }

  const updated = await prisma.userStats.update({
    where: { id: "singleton" },
    data: { xp: stats.xp + xpGain, streak, lastActiveDate: now },
  });

  const newBadges: string[] = [];
  if (result === "correct") newBadges.push("first_correct");
  if (streak >= 3) newBadges.push("streak_3");
  if (streak >= 7) newBadges.push("streak_7");
  if (updated.xp >= 100) newBadges.push("xp_100");
  if (updated.xp >= 500) newBadges.push("xp_500");

  for (const code of newBadges) {
    const def = BADGE_DEFS.find((b) => b.code === code)!;
    await prisma.badge.upsert({
      where: { code },
      create: def,
      update: {},
    });
  }

  return updated;
}

export async function getStats() {
  const stats = await prisma.userStats.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", xp: 0, streak: 0 },
    update: {},
  });
  const badges = await prisma.badge.findMany({ orderBy: { earnedAt: "asc" } });
  return { ...stats, badges };
}
