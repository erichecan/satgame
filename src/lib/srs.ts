function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function nextSrsState(
  current: { masteryScore: number; consecutiveCorrect: number },
  correct: boolean,
  now: Date = new Date()
) {
  if (correct) {
    const consecutiveCorrect = current.consecutiveCorrect + 1;
    const masteryScore = Math.min(1, current.masteryScore + 0.3);
    const nextReview =
      consecutiveCorrect >= 3
        ? addDays(now, 7)
        : addDays(now, [1, 3][consecutiveCorrect - 1] ?? 3);
    return { masteryScore, consecutiveCorrect, nextReview };
  }
  return {
    masteryScore: Math.max(0, current.masteryScore - 0.3),
    consecutiveCorrect: 0,
    nextReview: addDays(now, 1),
  };
}
