import { prisma } from "@/lib/db";
import { addToReview } from "@/lib/learning";
import { completeCheckin } from "@/lib/gamification";

export const GAMES_PER_DAY = ["clusters", "closer", "read_the_green", "gate_run", "dissector"] as const;

export const WORDS_PER_DAY = 50;
export const NEW_WORDS_PER_DAY = 40;
export const REVIEW_WORDS_PER_DAY = 10;
export const QUIZ_PER_DAY = 10;

export function todayKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function selectQuizItemIds(
  quizPool: { id: string; wordIds: string[] }[],
  targetWordIds: string[],
  count: number
): string[] {
  const targetSet = new Set(targetWordIds);
  const scored = quizPool.map((q) => ({
    id: q.id,
    overlap: q.wordIds.filter((w) => targetSet.has(w)).length,
  }));
  scored.sort((a, b) => b.overlap - a.overlap);
  return scored.slice(0, count).map((s) => s.id);
}

export const RECENT_WORD_DAYS = 5;

// 最近 N 天（含今天）每日任务分配到的单词 id 并集，用于游戏内容优先匹配
export async function getRecentWordIds(
  days: number = RECENT_WORD_DAYS,
  now: Date = new Date()
): Promise<string[]> {
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(todayKey(d));
  }
  const assignments = await prisma.dailyAssignment.findMany({
    where: { date: { in: dates } },
    select: { wordIds: true },
  });
  const set = new Set<string>();
  assignments.forEach((a) => a.wordIds.forEach((id) => set.add(id)));
  return [...set];
}

// 按与目标单词集合的重合度给一批带 wordIds 的条目排序（重合越多越靠前），无重合的保持原有相对顺序
export function rankByWordOverlap<T extends { wordIds: string[] }>(
  pool: T[],
  targetWordIds: string[]
): T[] {
  const targetSet = new Set(targetWordIds);
  return [...pool].sort((a, b) => {
    const overlapA = a.wordIds.filter((id) => targetSet.has(id)).length;
    const overlapB = b.wordIds.filter((id) => targetSet.has(id)).length;
    return overlapB - overlapA;
  });
}

export function isDailyComplete(assignment: {
  wordIds: string[];
  wordsViewed: string[];
  quizItemIds: string[];
  quizAnswers: Record<string, string>;
  gamesPlayed: string[];
}): boolean {
  const allWordsViewed = assignment.wordIds.every((id) => assignment.wordsViewed.includes(id));
  const allQuizAnswered = assignment.quizItemIds.every((id) => id in assignment.quizAnswers);
  const allGamesPlayed = GAMES_PER_DAY.every((g) => assignment.gamesPlayed.includes(g));
  return allWordsViewed && allQuizAnswered && allGamesPlayed;
}

export async function getOrCreateDailyAssignment(now: Date = new Date()) {
  const date = todayKey(now);
  const existing = await prisma.dailyAssignment.findUnique({ where: { date } });
  if (existing) return existing;

  const dueReviewNotes = await prisma.vocabNote.findMany({
    where: { nextReview: { lte: now } },
    orderBy: { nextReview: "asc" },
    take: REVIEW_WORDS_PER_DAY,
  });
  const reviewWordIds = dueReviewNotes.map((n) => n.wordId);

  const priorAssignments = await prisma.dailyAssignment.findMany({ select: { wordIds: true } });
  const seenWordIds = new Set(priorAssignments.flatMap((a) => a.wordIds));

  const newWordCandidates = await prisma.word.findMany({
    where: { isActive: true, id: { notIn: [...seenWordIds] } },
    orderBy: [{ tier: "asc" }, { rank: "asc" }],
    take: NEW_WORDS_PER_DAY,
  });

  const wordIds = [...new Set([...newWordCandidates.map((w) => w.id), ...reviewWordIds])].slice(
    0,
    WORDS_PER_DAY
  );

  const quizPool = await prisma.quizItem.findMany({
    where: { isActive: true },
    select: { id: true, wordIds: true },
  });
  const quizItemIds = selectQuizItemIds(quizPool, wordIds, QUIZ_PER_DAY);

  return prisma.dailyAssignment.create({
    data: { date, wordIds, quizItemIds },
  });
}

async function maybeCompleteDaily(assignment: {
  date: string;
  wordIds: string[];
  wordsViewed: string[];
  quizItemIds: string[];
  quizAnswers: unknown;
  gamesPlayed: string[];
  completedAt: Date | null;
}) {
  if (assignment.completedAt) return;
  const complete = isDailyComplete({
    wordIds: assignment.wordIds,
    wordsViewed: assignment.wordsViewed,
    quizItemIds: assignment.quizItemIds,
    quizAnswers: assignment.quizAnswers as Record<string, string>,
    gamesPlayed: assignment.gamesPlayed,
  });
  if (!complete) return;
  await prisma.dailyAssignment.update({
    where: { date: assignment.date },
    data: { completedAt: new Date() },
  });
  await completeCheckin();
}

export async function markWordViewed(wordId: string, unknown: boolean, now: Date = new Date()) {
  const assignment = await getOrCreateDailyAssignment(now);
  const wordsViewed = assignment.wordsViewed.includes(wordId)
    ? assignment.wordsViewed
    : [...assignment.wordsViewed, wordId];
  const updated = await prisma.dailyAssignment.update({
    where: { date: assignment.date },
    data: { wordsViewed },
  });
  if (unknown) {
    await addToReview(wordId, "self_reported_unknown");
  }
  await maybeCompleteDaily(updated);
  return updated;
}

export async function markQuizAnswered(
  quizItemId: string,
  result: "correct" | "incorrect",
  now: Date = new Date()
) {
  const assignment = await getOrCreateDailyAssignment(now);
  const quizAnswers = {
    ...(assignment.quizAnswers as Record<string, string>),
    [quizItemId]: result,
  };
  const updated = await prisma.dailyAssignment.update({
    where: { date: assignment.date },
    data: { quizAnswers },
  });
  await maybeCompleteDaily(updated);
  return updated;
}

export async function markGamePlayed(gameType: string, now: Date = new Date()) {
  const assignment = await getOrCreateDailyAssignment(now);
  if (assignment.gamesPlayed.includes(gameType)) return assignment;
  const updated = await prisma.dailyAssignment.update({
    where: { date: assignment.date },
    data: { gamesPlayed: [...assignment.gamesPlayed, gameType] },
  });
  await maybeCompleteDaily(updated);
  return updated;
}
