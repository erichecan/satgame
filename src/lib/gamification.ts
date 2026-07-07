import { prisma } from "@/lib/db";

const XP_CORRECT = 10;
const XP_INCORRECT = 2;

const BADGE_DEFS = [
  { code: "first_correct", name: "First correct", description: "Answered your first question right" },
  { code: "first_checkin", name: "Daily check-in", description: "Completed a full daily check-in" },
  { code: "streak_3", name: "3-day streak", description: "Checked in 3 days in a row" },
  { code: "streak_7", name: "7-day streak", description: "Checked in 7 days in a row" },
  { code: "xp_100", name: "100 XP", description: "Earned 100 XP total" },
  { code: "xp_500", name: "500 XP", description: "Earned 500 XP total" },
] as const;

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

async function awardBadges(codes: string[]) {
  for (const code of codes) {
    const def = BADGE_DEFS.find((b) => b.code === code)!;
    await prisma.badge.upsert({ where: { code }, create: def, update: { name: def.name, description: def.description } });
  }
}

export async function recordXp(result: "correct" | "incorrect") {
  const stats = await prisma.userStats.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", xp: 0, streak: 0 },
    update: {},
  });

  const xpGain = result === "correct" ? XP_CORRECT : XP_INCORRECT;
  const updated = await prisma.userStats.update({
    where: { id: "singleton" },
    data: { xp: stats.xp + xpGain },
  });

  const newBadges: string[] = [];
  if (result === "correct") newBadges.push("first_correct");
  if (updated.xp >= 100) newBadges.push("xp_100");
  if (updated.xp >= 500) newBadges.push("xp_500");
  await awardBadges(newBadges);

  return updated;
}

export async function completeCheckin(now: Date = new Date()) {
  const stats = await prisma.userStats.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", xp: 0, streak: 0 },
    update: {},
  });

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
    data: { streak, lastActiveDate: now },
  });

  const newBadges: string[] = ["first_checkin"];
  if (streak >= 3) newBadges.push("streak_3");
  if (streak >= 7) newBadges.push("streak_7");
  await awardBadges(newBadges);

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
