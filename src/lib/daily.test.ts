import { describe, it, expect } from "vitest";
import { todayKey, selectQuizItemIds, isDailyComplete, GAMES_PER_DAY } from "./daily";

describe("todayKey", () => {
  it("formats as YYYY-MM-DD", () => {
    expect(todayKey(new Date(2026, 6, 2))).toBe("2026-07-02");
  });

  it("pads single-digit month and day", () => {
    expect(todayKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("selectQuizItemIds", () => {
  const pool = [
    { id: "q1", wordIds: ["w1", "w2"] },
    { id: "q2", wordIds: [] },
    { id: "q3", wordIds: ["w3"] },
    { id: "q4", wordIds: ["w1"] },
  ];

  it("prioritizes items whose wordIds overlap the target set", () => {
    const result = selectQuizItemIds(pool, ["w1", "w2"], 2);
    expect(result).toEqual(["q1", "q4"]);
  });

  it("falls back to items with no overlap when not enough matches exist", () => {
    const result = selectQuizItemIds(pool, ["w1"], 3);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe("q4");
    expect(result.slice(1)).toEqual(expect.arrayContaining(["q1", "q2", "q3"].filter((id) => id !== "q4")));
  });

  it("never returns more than count items", () => {
    const result = selectQuizItemIds(pool, ["w1"], 2);
    expect(result).toHaveLength(2);
  });
});

describe("isDailyComplete", () => {
  const base = {
    wordIds: ["w1", "w2"],
    quizItemIds: ["q1"],
    gamesPlayed: [] as string[],
  };

  it("is false when words are unviewed", () => {
    expect(
      isDailyComplete({ ...base, wordsViewed: [], quizAnswers: { q1: "correct" }, gamesPlayed: [...GAMES_PER_DAY] })
    ).toBe(false);
  });

  it("is false when quiz items are unanswered", () => {
    expect(
      isDailyComplete({ ...base, wordsViewed: ["w1", "w2"], quizAnswers: {}, gamesPlayed: [...GAMES_PER_DAY] })
    ).toBe(false);
  });

  it("is false when not all 5 games have been played", () => {
    expect(
      isDailyComplete({
        ...base,
        wordsViewed: ["w1", "w2"],
        quizAnswers: { q1: "correct" },
        gamesPlayed: ["clusters"],
      })
    ).toBe(false);
  });

  it("is true when words, quiz, and all games are complete, regardless of quiz correctness", () => {
    expect(
      isDailyComplete({
        ...base,
        wordsViewed: ["w1", "w2"],
        quizAnswers: { q1: "incorrect" },
        gamesPlayed: [...GAMES_PER_DAY],
      })
    ).toBe(true);
  });
});
