export const VOCAB_SKILLS = [
  "recognition",
  "definition_recall",
  "context_choice",
] as const;

export type VocabSkill = (typeof VOCAB_SKILLS)[number];

const INTERVAL_DAYS = [1, 3, 7, 14, 30, 60, 90];

export function nextVocabularyReview(
  current: { masteryLevel: number; consecutiveCorrect: number },
  correct: boolean,
  now: Date = new Date()
) {
  const masteryLevel = correct
    ? Math.min(INTERVAL_DAYS.length, current.masteryLevel + 1)
    : Math.max(0, current.masteryLevel - 2);
  const consecutiveCorrect = correct ? current.consecutiveCorrect + 1 : 0;
  const intervalDays = correct
    ? INTERVAL_DAYS[masteryLevel - 1] ?? 1
    : 1;
  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + intervalDays);

  return { masteryLevel, consecutiveCorrect, intervalDays, nextReview };
}
