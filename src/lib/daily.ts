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
