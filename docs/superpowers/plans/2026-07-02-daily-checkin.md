# Daily Checkin Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the daily main-line flow (背 50 词 → 做 10 道仿真 SAT 题 → 5 个游戏各玩一遍) that gates streak/badge checkin on all three, per the approved design in `docs/superpowers/specs/2026-07-01-daily-checkin-design.md`.

**Architecture:** A new `DailyAssignment` row (one per calendar date, singleton app — no per-user key) snapshots today's 50 word ids + 10 quiz item ids and tracks progress against them. A pure-logic module (`src/lib/daily.ts`) owns selection and completion-check functions (unit tested), wrapped by thin async functions that read/write Prisma. Three new API routes expose this to the frontend; the existing `/api/progress` route is extended to log game completions into the same daily row. `gamification.ts` is split so XP still accrues per game answer, but streak/badges only fire once via the new `completeCheckin()`, called when the daily row's three sections are all complete.

**Tech Stack:** Next.js 16 App Router, Prisma 7 (`@prisma/adapter-pg`), Neon Postgres, Vitest (new — for pure-function unit tests), Tailwind CSS.

## Global Constraints

- Prisma client is generated to `src/generated/prisma` and imported as `import { PrismaClient } from "@/generated/prisma/client"` — never `@prisma/client` directly (see `src/lib/db.ts`).
- All Prisma models use `String @id @default(cuid())` except `UserStats` (`@default("singleton")`) — follow this pattern for any new model unless a natural unique key exists (`DailyAssignment.date` is that natural key here).
- All API routes are already protected by `src/proxy.ts` (everything except `/login` and `POST /api/auth/login` requires a valid JWT cookie) — no new auth code needed in the routes this plan adds.
- Route handlers return `Response.json({ error: true, message }, { status })` on failure and log with `console.error("[API Route Error]", error)` — match this exact shape (see `src/app/api/vocab-notebook/route.ts` for the reference pattern).
- No `any` types (project rule from global CLAUDE.md).
- Single-user app: no `userId` field anywhere, no login/signup flow beyond the existing shared passcode.
- This plan does not generate the real reviewed 1500-word / 500-700-quiz content batches (design doc §4.4) — that is a separate human-review content workflow. This plan seeds a small labeled **sample/test batch** (see Task 7) sufficient to exercise the feature end-to-end.

---

### Task 1: Extend Prisma schema (Word fields, QuizItem, DailyAssignment) + migrate

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: `Word.tier: String`, `Word.rank: Int`, `Word.synonymGroup: String | null`; new models `QuizItem` and `DailyAssignment` with the fields below, used by every later task.

- [ ] **Step 1: Add fields to `Word` and the two new models**

Edit `prisma/schema.prisma`. In the existing `model Word { ... }` block, add three fields right after `difficulty Int @default(1)` (keep every existing field as-is):

```prisma
  tier          String     @default("sat_core") // "foundation" | "sat_core"
  rank          Int        @default(9999)        // order within tier for daily new-word selection
  synonymGroup  String?                           // optional key linking words for discrimination display
```

Then append these two new models at the end of the file:

```prisma
// 每日测验题库：SAT 短文题结构，独立于 GameItem（生命周期和复用逻辑不同）
model QuizItem {
  id          String   @id @default(cuid())
  passage     String
  question    String
  options     Json     // [{ t: string, correct?: boolean }], 四选一
  wordIds     String[] // 关联 Word.id，用于和当天 50 词做交集匹配
  domain      String   // craft_structure | words_in_context | info_ideas | expression_conventions
  difficulty  Int      @default(2)
  explanation String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  @@index([isActive])
}

// 每日任务快照：一天一行，支持中途退出继续；三项（词/题/游戏）齐了才算打卡完成
model DailyAssignment {
  id          String    @id @default(cuid())
  date        String    @unique // "YYYY-MM-DD"，服务器本地日期
  wordIds     String[]
  quizItemIds String[]
  wordsViewed String[]  @default([])
  quizAnswers Json      @default("{}") // { [quizItemId]: "correct" | "incorrect" }
  gamesPlayed String[]  @default([])
  completedAt DateTime?
  createdAt   DateTime  @default(now())
}
```

- [ ] **Step 2: Run the migration**

```bash
npx prisma migrate dev --name daily_checkin
```

Expected output ends with `Your database is now in sync with your schema.` and a new folder under `prisma/migrations/` whose name ends in `_daily_checkin`.

- [ ] **Step 3: Regenerate the client and confirm it compiles**

```bash
npx prisma generate
npx tsc --noEmit
```

Expected: both commands exit 0 with no errors (existing `Word.upsert(...)` calls in `prisma/seed.ts` remain valid because the three new fields all have defaults).

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): add Word tier/rank/synonymGroup, QuizItem, DailyAssignment models"
```

---

### Task 2: Install Vitest for pure-function unit tests

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

**Interfaces:**
- Produces: `npm run test` command used by Task 3.

- [ ] **Step 1: Install**

```bash
npm install -D vitest
```

- [ ] **Step 2: Add the config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 3: Add the script**

In `package.json`, add `"test": "vitest run"` to the `"scripts"` block (alongside the existing `"dev"`, `"build"`, `"start"`, `"lint"`).

- [ ] **Step 4: Verify the runner works with a throwaway test**

Create `src/lib/__smoke.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `npm run test`
Expected: `1 passed`

Delete `src/lib/__smoke.test.ts` after confirming (it was only to verify the runner).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest for pure-function unit tests"
```

---

### Task 3: Pure logic functions in `src/lib/daily.ts` (TDD)

**Files:**
- Create: `src/lib/daily.ts`
- Test: `src/lib/daily.test.ts`

**Interfaces:**
- Produces:
  - `GAMES_PER_DAY: readonly string[]` = `["clusters", "closer", "read_the_green", "gate_run", "dissector"]`
  - `WORDS_PER_DAY = 50`, `NEW_WORDS_PER_DAY = 40`, `REVIEW_WORDS_PER_DAY = 10`, `QUIZ_PER_DAY = 10`
  - `todayKey(now?: Date): string` — `"YYYY-MM-DD"`
  - `selectQuizItemIds(quizPool: { id: string; wordIds: string[] }[], targetWordIds: string[], count: number): string[]`
  - `isDailyComplete(assignment: { wordIds: string[]; wordsViewed: string[]; quizItemIds: string[]; quizAnswers: Record<string, string>; gamesPlayed: string[] }): boolean`
- Consumes: nothing (pure, no Prisma import in this file).

- [ ] **Step 1: Write the failing tests**

Create `src/lib/daily.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test`
Expected: FAIL — `daily.ts` does not exist yet (`Cannot find module './daily'`).

- [ ] **Step 3: Implement the pure functions**

Create `src/lib/daily.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test`
Expected: `9 passed` (2 `todayKey` + 3 `selectQuizItemIds` + 4 `isDailyComplete`)

- [ ] **Step 5: Commit**

```bash
git add src/lib/daily.ts src/lib/daily.test.ts
git commit -m "feat: add pure daily-assignment selection and completion logic"
```

---

### Task 4: Async DB-backed functions in `daily.ts` (get/create + mark* + checkin trigger)

**Files:**
- Modify: `src/lib/daily.ts`
- Modify: `src/lib/learning.ts` (extend `AddToReviewReason`)
- Modify: `src/lib/gamification.ts` (split `recordActivity` → `recordXp` + new `completeCheckin`)

**Interfaces:**
- Consumes: `prisma` from `@/lib/db` (see `src/lib/db.ts`); `addToReview` from `@/lib/learning`; `nextSrsState` is NOT used here (that's for `Progress`, not `DailyAssignment`).
- Produces (appended to `src/lib/daily.ts`, importable by API routes in Tasks 8-11):
  - `getOrCreateDailyAssignment(now?: Date): Promise<DailyAssignment>` (the Prisma model type)
  - `markWordViewed(wordId: string, unknown: boolean, now?: Date): Promise<DailyAssignment>`
  - `markQuizAnswered(quizItemId: string, result: "correct" | "incorrect", now?: Date): Promise<DailyAssignment>`
  - `markGamePlayed(gameType: string, now?: Date): Promise<DailyAssignment>`

- [ ] **Step 1: Extend `AddToReviewReason`**

In `src/lib/learning.ts`, change line 3 from:

```ts
export type AddToReviewReason = "wrong" | "asked_hint" | "gave_up" | "manual";
```

to:

```ts
export type AddToReviewReason = "wrong" | "asked_hint" | "gave_up" | "manual" | "self_reported_unknown";
```

- [ ] **Step 2: Split `gamification.ts` into `recordXp` and `completeCheckin`**

Replace the entire contents of `src/lib/gamification.ts` with:

```ts
import { prisma } from "@/lib/db";

const XP_CORRECT = 10;
const XP_INCORRECT = 2;

const BADGE_DEFS = [
  { code: "first_correct", name: "初次答对", description: "答对第一题" },
  { code: "first_checkin", name: "今日打卡", description: "完成一次完整的每日打卡" },
  { code: "streak_3", name: "三日连击", description: "连续 3 天打卡" },
  { code: "streak_7", name: "一周不断", description: "连续 7 天打卡" },
  { code: "xp_100", name: "百分新手", description: "累计 100 XP" },
  { code: "xp_500", name: "五百达人", description: "累计 500 XP" },
] as const;

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

async function awardBadges(codes: string[]) {
  for (const code of codes) {
    const def = BADGE_DEFS.find((b) => b.code === code)!;
    await prisma.badge.upsert({ where: { code }, create: def, update: {} });
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
```

This removes the old `recordActivity` export — its one caller (`src/app/api/progress/route.ts`) is updated later in this same task (Step 4), so the project stays type-check-clean at the end of the task.

- [ ] **Step 3: Append the DB-backed functions to `src/lib/daily.ts`**

Add these imports at the top of `src/lib/daily.ts` (above the existing pure-function code from Task 3):

```ts
import { prisma } from "@/lib/db";
import { addToReview } from "@/lib/learning";
import { completeCheckin } from "@/lib/gamification";
```

Then append at the bottom of the file:

```ts
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
```

- [ ] **Step 4: Update `/api/progress` to use the new function names (keeps the whole project type-checking green)**

`src/app/api/progress/route.ts` still imports the now-removed `recordActivity` — fix it in this same task so `tsc` passes before moving on. Change line 3 from:

```ts
import { recordActivity } from "@/lib/gamification";
```

to:

```ts
import { recordXp } from "@/lib/gamification";
import { markGamePlayed } from "@/lib/daily";
```

Then change the two lines near the end of the `POST` handler from:

```ts
    if (wordId && result === "incorrect") {
      await addToReview(wordId, "wrong", gameType);
    }

    const stats = await recordActivity(result);

    return Response.json({ progress, stats });
```

to:

```ts
    if (wordId && result === "incorrect") {
      await addToReview(wordId, "wrong", gameType);
    }

    const stats = await recordXp(result);
    await markGamePlayed(gameType);

    return Response.json({ progress, stats });
```

- [ ] **Step 5: Type-check and re-run the pure-function tests (must both be green — no regressions)**

```bash
npx tsc --noEmit
npm run test
```

Expected: `tsc` exits 0; `npm run test` still shows `9 passed` (Task 3's tests import only the pure functions, unaffected by the new Prisma-backed ones).

- [ ] **Step 6: Commit**

```bash
git add src/lib/daily.ts src/lib/learning.ts src/lib/gamification.ts src/app/api/progress/route.ts
git commit -m "feat: wire daily assignment get/create and mark-progress functions to checkin"
```

---

### Task 5: Manually verify `/api/progress` logs game completion into today's daily assignment

**Files:** none (verification only — the code change already landed in Task 4 Step 4)

- [ ] **Step 1: Start the dev server and log in**

Start the dev server if not already running: `npm run dev` (or use the existing `.claude/launch.json` `satgame-dev` config via the preview tool).

```bash
COOKIE=$(mktemp)
curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"passcode":"783458"}' -c "$COOKIE" -o /dev/null
curl -s -X POST http://localhost:3000/api/progress -b "$COOKIE" -H "Content-Type: application/json" \
  -d '{"gameType":"clusters","skill":"craft_structure","result":"correct"}'
```

Expected: JSON response with `progress` and `stats`, no `error` field.

- [ ] **Step 2: Confirm the daily assignment row was updated**

```bash
npx prisma studio
```

Open the `DailyAssignment` table in the browser Prisma Studio opens and confirm today's row has `"clusters"` in `gamesPlayed`. Close Prisma Studio (Ctrl+C) when done.

---

### Task 6: Sample word + quiz content batch (test fixtures, not the real reviewed batch)

**Files:**
- Modify: `prisma/seed.ts`

**Interfaces:**
- Consumes: none new.
- Produces: ~24 `Word` rows with `tier`/`rank`/`synonymGroup` set, ~10 `QuizItem` rows referencing some of those words by id, inserted by `main()`.

- [ ] **Step 1: Add the sample word and quiz data**

In `prisma/seed.ts`, add this new constant block right before the existing `async function main() {` line. This is clearly a **sample batch for exercising the daily-checkin feature**, not the real reviewed 1500-word content (see design doc §4.4):

```ts
// 每日打卡功能的测试样本数据（非正式审核过的完整词库，仅用于验证功能链路）
const DAILY_SAMPLE_WORDS: {
  word: string;
  pos: string;
  def: string;
  ex: string;
  tier: "foundation" | "sat_core";
  rank: number;
  synonymGroup?: string;
}[] = [
  { word: "indicate", pos: "verb", def: "To point out or show something.", ex: "The data seem to {word} a clear trend.", tier: "foundation", rank: 1, synonymGroup: "show" },
  { word: "suggest", pos: "verb", def: "To indicate indirectly, without stating outright.", ex: "Her tone seemed to {word} disappointment.", tier: "foundation", rank: 2, synonymGroup: "show" },
  { word: "demonstrate", pos: "verb", def: "To show clearly through evidence or example.", ex: "The experiment helped {word} the theory.", tier: "foundation", rank: 3, synonymGroup: "show" },
  { word: "significant", pos: "adjective", def: "Important enough to be worth noting.", ex: "There was a {word} increase in attendance.", tier: "foundation", rank: 4, synonymGroup: "important" },
  { word: "substantial", pos: "adjective", def: "Considerable in amount or degree.", ex: "They made {word} progress this year.", tier: "foundation", rank: 5, synonymGroup: "important" },
  { word: "consequently", pos: "adverb", def: "As a result; therefore.", ex: "It rained heavily; {word}, the game was postponed.", tier: "foundation", rank: 6 },
  { word: "furthermore", pos: "adverb", def: "In addition; moreover.", ex: "The plan is costly; {word}, it is untested.", tier: "foundation", rank: 7 },
  { word: "assess", pos: "verb", def: "To evaluate or estimate the nature of something.", ex: "Teachers {word} student progress regularly.", tier: "foundation", rank: 8 },
  { word: "acquire", pos: "verb", def: "To gain possession of something.", ex: "She hopes to {word} new skills this summer.", tier: "foundation", rank: 9 },
  { word: "component", pos: "noun", def: "A part of a larger whole.", ex: "Trust is a key {word} of any friendship.", tier: "foundation", rank: 10 },
  { word: "coherent", pos: "adjective", def: "Logical and consistent; easy to follow.", ex: "He gave a {word} explanation of the plan.", tier: "foundation", rank: 11 },
  { word: "elaborate", pos: "verb", def: "To explain in further detail.", ex: "Could you {word} on that point?", tier: "foundation", rank: 12 },
  { word: "ambivalent", pos: "adjective", def: "Having mixed or contradictory feelings.", ex: "She felt {word} about the new job offer.", tier: "sat_core", rank: 1, synonymGroup: "unclear-feeling" },
  { word: "equivocal", pos: "adjective", def: "Open to more than one interpretation; ambiguous.", ex: "His {word} answer left everyone confused.", tier: "sat_core", rank: 2, synonymGroup: "unclear-feeling" },
  { word: "meticulous", pos: "adjective", def: "Showing great attention to detail.", ex: "Her {word} notes covered every step.", tier: "sat_core", rank: 3 },
  { word: "pragmatic", pos: "adjective", def: "Practical rather than idealistic.", ex: "They took a {word} approach to the budget.", tier: "sat_core", rank: 4 },
  { word: "undermine", pos: "verb", def: "To weaken gradually.", ex: "Doubt can {word} even a strong plan.", tier: "sat_core", rank: 5 },
  { word: "scrutinize", pos: "verb", def: "To examine closely and critically.", ex: "Editors {word} every sentence before publishing.", tier: "sat_core", rank: 6 },
  { word: "mitigate", pos: "verb", def: "To make less severe.", ex: "New rules helped {word} the risk of injury.", tier: "sat_core", rank: 7 },
  { word: "arbitrary", pos: "adjective", def: "Based on random choice, not reason.", ex: "The fine felt {word}, with no clear rule behind it.", tier: "sat_core", rank: 8 },
  { word: "nuanced", pos: "adjective", def: "Marked by subtle distinctions.", ex: "Her {word} reading caught details others missed.", tier: "sat_core", rank: 9 },
  { word: "tenuous", pos: "adjective", def: "Weak or flimsy; barely valid.", ex: "The link between the two events was {word} at best.", tier: "sat_core", rank: 10 },
  { word: "candid", pos: "adjective", def: "Truthful and straightforward.", ex: "Her {word} feedback was hard to hear but useful.", tier: "sat_core", rank: 11, synonymGroup: "honest" },
  { word: "forthright", pos: "adjective", def: "Direct and outspoken.", ex: "He gave a {word} account of what happened.", tier: "sat_core", rank: 12, synonymGroup: "honest" },
];

const DAILY_SAMPLE_QUIZZES: {
  passage: string;
  question: string;
  options: { t: string; correct?: boolean }[];
  words: string[]; // Word.word values this quiz is tagged with
  domain: string;
  explanation: string;
}[] = [
  {
    passage:
      "The committee's report did not clearly state whether the project should continue. Its conclusion was so equivocal that both supporters and critics claimed it backed their position.",
    question: "As used in the passage, \"equivocal\" most nearly means",
    options: [
      { t: "ambiguous" },
      { t: "unambiguous" },
      { t: "enthusiastic" },
      { t: "equivocal", correct: true },
    ],
    words: ["equivocal"],
    domain: "words_in_context",
    explanation: "The sentence explains both sides read the conclusion differently — that's the definition of equivocal (open to more than one interpretation).",
  },
  {
    passage:
      "Before publishing, the magazine's editors scrutinize every article, checking each fact against at least two independent sources.",
    question: "The passage indicates that the editors' review process is best described as",
    options: [
      { t: "meticulous", correct: true },
      { t: "arbitrary" },
      { t: "occasional" },
      { t: "informal" },
    ],
    words: ["scrutinize", "meticulous"],
    domain: "info_ideas",
    explanation: "Checking every article against two sources is a close, careful (meticulous) process — the opposite of arbitrary or informal.",
  },
  {
    passage:
      "New evidence has not fully confirmed the hypothesis, but it has not disproven it either; researchers describe their confidence in the theory as ambivalent.",
    question: "Which choice best states the main idea of the passage?",
    options: [
      { t: "The hypothesis has been conclusively disproven." },
      { t: "Researchers hold mixed feelings about the theory given incomplete evidence.", correct: true },
      { t: "The evidence strongly supports the hypothesis." },
      { t: "Researchers have stopped studying the theory." },
    ],
    words: ["ambivalent"],
    domain: "info_ideas",
    explanation: "\"Not fully confirmed... not disproven either\" plus \"ambivalent\" directly supports mixed feelings from incomplete evidence.",
  },
  {
    passage:
      "The mayor's plan was costly and untested. Furthermore, it required approval from three separate agencies before work could begin.",
    question: "Which choice best describes the function of \"Furthermore\" in the passage?",
    options: [
      { t: "It introduces a contrasting idea." },
      { t: "It adds another drawback to the ones already mentioned.", correct: true },
      { t: "It signals the passage's conclusion." },
      { t: "It introduces an example." },
    ],
    words: ["furthermore"],
    domain: "expression_conventions",
    explanation: "\"Furthermore\" adds a second problem (agency approval) on top of the first (cost, being untested) — addition, not contrast.",
  },
  {
    passage:
      "Rather than pursue an idealistic redesign, the engineers took a pragmatic approach, reusing existing parts wherever the budget was tight.",
    question: "As used in the passage, \"pragmatic\" most nearly means",
    options: [
      { t: "impractical" },
      { t: "expensive" },
      { t: "practical", correct: true },
      { t: "idealistic" },
    ],
    words: ["pragmatic"],
    domain: "words_in_context",
    explanation: "The passage sets \"pragmatic\" directly against \"idealistic,\" and reusing parts to save money is a practical choice.",
  },
  {
    passage:
      "A single skeptical comment, repeated often enough, can undermine even a team that started out confident.",
    question: "As used in the passage, \"undermine\" most nearly means",
    options: [
      { t: "strengthen" },
      { t: "weaken gradually", correct: true },
      { t: "ignore" },
      { t: "celebrate" },
    ],
    words: ["undermine"],
    domain: "words_in_context",
    explanation: "A repeated skeptical comment eroding a confident team's spirit is a gradual weakening, not a sudden change.",
  },
  {
    passage:
      "The panel's decision to reject every proposal without explanation struck applicants as arbitrary rather than principled.",
    question: "Which choice best supports the idea that the applicants distrusted the panel's process?",
    options: [
      { t: "\"The panel's decision to reject every proposal\"" },
      { t: "\"without explanation struck applicants as arbitrary\"", correct: true },
      { t: "\"rather than principled.\"" },
      { t: "None of the choices provide support." },
    ],
    words: ["arbitrary"],
    domain: "info_ideas",
    explanation: "\"Without explanation\" and \"arbitrary\" together are the clause that shows why applicants distrusted the process.",
  },
  {
    passage:
      "The reviewer's comments were candid to the point of bluntness, but every writer on the team said the feedback made their drafts stronger.",
    question: "As used in the passage, \"candid\" most nearly means",
    options: [
      { t: "vague" },
      { t: "flattering" },
      { t: "honest and direct", correct: true },
      { t: "hesitant" },
    ],
    words: ["candid", "forthright"],
    domain: "words_in_context",
    explanation: "\"Candid to the point of bluntness\" describes very honest, direct feedback.",
  },
  {
    passage:
      "The lab's notes were so coherent that a new researcher could follow the entire experiment without asking a single question.",
    question: "As used in the passage, \"coherent\" most nearly means",
    options: [
      { t: "logical and easy to follow", correct: true },
      { t: "handwritten" },
      { t: "incomplete" },
      { t: "brief" },
    ],
    words: ["coherent"],
    domain: "words_in_context",
    explanation: "Notes that let a newcomer follow the whole experiment without questions are, by definition, coherent — logical and easy to follow.",
  },
  {
    passage:
      "Sales figures alone cannot demonstrate why the product succeeded; interviews with customers are needed to assess the reasons behind their choices.",
    question: "The passage suggests that understanding why the product succeeded requires",
    options: [
      { t: "only sales figures" },
      { t: "customer interviews in addition to sales figures", correct: true },
      { t: "no additional research" },
      { t: "discontinuing the product" },
    ],
    words: ["demonstrate", "assess"],
    domain: "info_ideas",
    explanation: "The passage explicitly says sales figures alone are not enough and interviews are needed — i.e., both together.",
  },
];
```

- [ ] **Step 2: Insert the data in `main()`**

In `prisma/seed.ts`, add this block right before the final `console.log("Seed complete.");` line inside `main()`:

```ts
  // Daily-checkin sample content
  const wordIdByWord = new Map<string, string>();
  for (const w of DAILY_SAMPLE_WORDS) {
    const created = await prisma.word.upsert({
      where: { word: w.word },
      create: {
        word: w.word,
        partOfSpeech: w.pos,
        definitionEn: w.def,
        exampleEn: w.ex.replace("{word}", w.word),
        difficulty: w.tier === "sat_core" ? 2 : 1,
        tier: w.tier,
        rank: w.rank,
        synonymGroup: w.synonymGroup,
      },
      update: {
        tier: w.tier,
        rank: w.rank,
        synonymGroup: w.synonymGroup,
      },
    });
    wordIdByWord.set(w.word, created.id);
  }

  await prisma.quizItem.deleteMany({});
  for (const q of DAILY_SAMPLE_QUIZZES) {
    await prisma.quizItem.create({
      data: {
        passage: q.passage,
        question: q.question,
        options: q.options,
        wordIds: q.words.map((w) => wordIdByWord.get(w)!),
        domain: q.domain,
        difficulty: 2,
        explanation: q.explanation,
      },
    });
  }
```

- [ ] **Step 3: Run the seed and verify**

```bash
npx prisma db seed
```

Expected: ends with `Seed complete.` and no errors.

```bash
COOKIE=$(mktemp)
curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"passcode":"783458"}' -c "$COOKIE" -o /dev/null
npx prisma studio
```

In Prisma Studio, confirm the `Word` table has 24 new rows with `tier`/`rank` set, and `QuizItem` has 10 rows with non-empty `wordIds` (except none are expected to be fully empty in this sample set). Close Prisma Studio when done.

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: seed sample word/quiz content for daily-checkin testing"
```

---

### Task 7: `GET /api/daily` route

**Files:**
- Create: `src/app/api/daily/route.ts`

**Interfaces:**
- Consumes: `getOrCreateDailyAssignment` from `@/lib/daily` (Task 4).
- Produces: `GET /api/daily` → `{ assignment: DailyAssignment, words: Word[], quizItems: QuizItem[] }`, where `words`/`quizItems` are in the same order as `assignment.wordIds`/`assignment.quizItemIds`. Consumed by `/study` (Task 9) and `/daily-quiz` (Task 10) and the home page (Task 11).

- [ ] **Step 1: Implement the route**

Create `src/app/api/daily/route.ts`:

```ts
import { prisma } from "@/lib/db";
import { getOrCreateDailyAssignment } from "@/lib/daily";

export async function GET() {
  try {
    const assignment = await getOrCreateDailyAssignment();

    const words = await prisma.word.findMany({ where: { id: { in: assignment.wordIds } } });
    const wordById = new Map(words.map((w) => [w.id, w]));
    const orderedWords = assignment.wordIds.map((id) => wordById.get(id)).filter((w) => w !== undefined);

    const quizItems = await prisma.quizItem.findMany({ where: { id: { in: assignment.quizItemIds } } });
    const quizById = new Map(quizItems.map((q) => [q.id, q]));
    const orderedQuiz = assignment.quizItemIds.map((id) => quizById.get(id)).filter((q) => q !== undefined);

    return Response.json({ assignment, words: orderedWords, quizItems: orderedQuiz });
  } catch (error) {
    console.error("[API Route Error]", error);
    return Response.json(
      { error: true, message: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Type-check and manually verify**

```bash
npx tsc --noEmit
```

```bash
COOKIE=$(mktemp)
curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"passcode":"783458"}' -c "$COOKIE" -o /dev/null
curl -s http://localhost:3000/api/daily -b "$COOKIE" | python3 -m json.tool | head -30
```

Expected: JSON with `assignment.wordIds` having up to 24 entries (sample data only has 24 words, so fewer than 50 is correct for this test batch), `words` array populated, `quizItems` array populated (up to 10).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/daily/route.ts
git commit -m "feat: add GET /api/daily route"
```

---

### Task 8: `POST /api/daily/word-viewed` and `POST /api/daily/quiz-answer` routes

**Files:**
- Create: `src/app/api/daily/word-viewed/route.ts`
- Create: `src/app/api/daily/quiz-answer/route.ts`

**Interfaces:**
- Consumes: `markWordViewed`, `markQuizAnswered` from `@/lib/daily` (Task 4).
- Produces: `POST /api/daily/word-viewed` body `{ wordId: string, unknown?: boolean }` → `{ assignment }`. `POST /api/daily/quiz-answer` body `{ quizItemId: string, result: "correct" | "incorrect" }` → `{ assignment }`. Consumed by `/study` (Task 9) and `/daily-quiz` (Task 10).

- [ ] **Step 1: Implement `word-viewed`**

Create `src/app/api/daily/word-viewed/route.ts`:

```ts
import { markWordViewed } from "@/lib/daily";

export async function POST(req: Request) {
  try {
    const { wordId, unknown } = (await req.json()) as { wordId: string; unknown?: boolean };
    if (!wordId) {
      return Response.json({ error: true, message: "缺少 wordId" }, { status: 400 });
    }
    const assignment = await markWordViewed(wordId, !!unknown);
    return Response.json({ assignment });
  } catch (error) {
    console.error("[API Route Error]", error);
    return Response.json(
      { error: true, message: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Implement `quiz-answer`**

Create `src/app/api/daily/quiz-answer/route.ts`:

```ts
import { markQuizAnswered } from "@/lib/daily";

export async function POST(req: Request) {
  try {
    const { quizItemId, result } = (await req.json()) as {
      quizItemId: string;
      result: "correct" | "incorrect";
    };
    if (!quizItemId || !result) {
      return Response.json({ error: true, message: "缺少 quizItemId/result" }, { status: 400 });
    }
    const assignment = await markQuizAnswered(quizItemId, result);
    return Response.json({ assignment });
  } catch (error) {
    console.error("[API Route Error]", error);
    return Response.json(
      { error: true, message: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Type-check and manually verify both routes**

```bash
npx tsc --noEmit
```

```bash
COOKIE=$(mktemp)
curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"passcode":"783458"}' -c "$COOKIE" -o /dev/null
WORD_ID=$(curl -s http://localhost:3000/api/daily -b "$COOKIE" | python3 -c "import json,sys; print(json.load(sys.stdin)['assignment']['wordIds'][0])")
curl -s -X POST http://localhost:3000/api/daily/word-viewed -b "$COOKIE" -H "Content-Type: application/json" -d "{\"wordId\":\"$WORD_ID\",\"unknown\":false}"
QUIZ_ID=$(curl -s http://localhost:3000/api/daily -b "$COOKIE" | python3 -c "import json,sys; print(json.load(sys.stdin)['assignment']['quizItemIds'][0])")
curl -s -X POST http://localhost:3000/api/daily/quiz-answer -b "$COOKIE" -H "Content-Type: application/json" -d "{\"quizItemId\":\"$QUIZ_ID\",\"result\":\"correct\"}"
```

Expected: both `curl` calls return `{"assignment": {... "wordsViewed": ["<the id>", ...] ...}}` / `{"assignment": {... "quizAnswers": {"<id>":"correct"} ...}}` with no `error` field.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/daily/word-viewed/route.ts src/app/api/daily/quiz-answer/route.ts
git commit -m "feat: add POST /api/daily/word-viewed and /api/daily/quiz-answer routes"
```

---

### Task 9: `/study` flashcard page

**Files:**
- Create: `src/app/study/page.tsx`

**Interfaces:**
- Consumes: `GET /api/daily`, `POST /api/daily/word-viewed` (Tasks 7-8).

- [ ] **Step 1: Implement the page**

Create `src/app/study/page.tsx`:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type WordData = {
  id: string;
  word: string;
  partOfSpeech: string | null;
  definitionEn: string;
  definitionCn: string | null;
  exampleEn: string | null;
  synonymGroup: string | null;
};

export default function StudyPage() {
  const [words, setWords] = useState<WordData[]>([]);
  const [viewed, setViewed] = useState<string[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/daily")
      .then((r) => r.json())
      .then((d) => {
        setWords(d.words);
        setViewed(d.assignment.wordsViewed);
        setLoading(false);
      });
  }, []);

  const remaining = useMemo(() => words.filter((w) => !viewed.includes(w.id)), [words, viewed]);
  const current = remaining[0];

  const discriminationWords = useMemo(() => {
    if (!current?.synonymGroup) return [];
    return words.filter((w) => w.synonymGroup === current.synonymGroup && w.id !== current.id);
  }, [current, words]);

  async function respond(unknown: boolean) {
    if (!current) return;
    await fetch("/api/daily/word-viewed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId: current.id, unknown }),
    });
    setViewed((v) => [...v, current.id]);
    setFlipped(false);
  }

  if (loading) {
    return <main className="mx-auto max-w-lg flex-1 px-4 py-8 text-slate-500">加载中…</main>;
  }

  if (!current) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 text-center lg:max-w-3xl">
        <h1 className="text-2xl font-bold text-slate-900">今天的词都翻完了</h1>
        <p className="mt-2 text-slate-500">
          {viewed.length} / {words.length} 词完成
        </p>
        <Link
          href="/daily-quiz"
          className="mt-6 inline-block rounded-full bg-slate-900 px-6 py-2 font-semibold text-white"
        >
          去做题 →
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 lg:max-w-4xl">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
        <span>背单词</span>
        <span>
          {viewed.length} / {words.length}
        </span>
      </div>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Study</h1>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900">{current.word}</span>
            {current.partOfSpeech && (
              <span className="text-sm italic text-slate-400">{current.partOfSpeech}</span>
            )}
          </div>

          {!flipped ? (
            <button
              onClick={() => setFlipped(true)}
              className="mt-6 w-full rounded-lg bg-slate-100 py-3 font-semibold text-slate-700"
            >
              翻面看词义
            </button>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-slate-700">{current.definitionEn}</p>
              {current.exampleEn && (
                <p className="rounded-lg bg-slate-50 p-3 text-sm italic text-slate-500">
                  {current.exampleEn}
                </p>
              )}
              {discriminationWords.length > 0 && (
                <div className="rounded-lg bg-amber-50 p-3 text-sm text-slate-600">
                  <div className="mb-1 font-semibold text-amber-700">辨析对比</div>
                  {discriminationWords.map((w) => (
                    <p key={w.id}>
                      <b>{w.word}</b> — {w.definitionEn}
                    </p>
                  ))}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => respond(false)}
                  className="flex-1 rounded-lg bg-emerald-600 py-3 font-semibold text-white"
                >
                  认识
                </button>
                <button
                  onClick={() => respond(true)}
                  className="flex-1 rounded-lg bg-rose-500 py-3 font-semibold text-white"
                >
                  不认识
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="hidden rounded-xl border border-slate-200 bg-white p-4 lg:block">
          <div className="text-sm font-semibold text-slate-900">今天的进度</div>
          <ul className="mt-2 space-y-1 text-sm text-slate-500">
            {words.map((w) => (
              <li key={w.id} className={viewed.includes(w.id) ? "text-slate-300 line-through" : ""}>
                {w.word}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: exits 0.

- [ ] **Step 3: Manual browser verification (mobile + desktop widths)**

Use the preview tools (per project convention — see `DEV-REPORT.md` for the existing pattern): start the dev server via `mcp__Claude_Preview__preview_start` with the `satgame-dev` config, log in (`preview_eval` posting to `/api/auth/login` with passcode `783458`), navigate to `/study`, and:
- At default desktop width: click "翻面看词义", then "认识", confirm the counter increments and the next word loads; use `preview_screenshot` to confirm the two-column desktop layout (card + progress list) renders.
- Call `preview_resize` with `preset: "mobile"`, reload `/study`, confirm the single-column layout looks correct (no progress list, since it's `hidden lg:block`).
- Click through all remaining words for the sample batch (24 words) until the "去做题 →" completion screen appears.

- [ ] **Step 4: Commit**

```bash
git add src/app/study/page.tsx
git commit -m "feat: add /study flashcard page"
```

---

### Task 10: `/daily-quiz` page

**Files:**
- Create: `src/app/daily-quiz/page.tsx`

**Interfaces:**
- Consumes: `GET /api/daily`, `POST /api/daily/quiz-answer` (Tasks 7-8).

- [ ] **Step 1: Implement the page**

Create `src/app/daily-quiz/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type QuizOption = { t: string; correct?: boolean };
type QuizData = {
  id: string;
  passage: string;
  question: string;
  options: QuizOption[];
  explanation: string | null;
};

export default function DailyQuizPage() {
  const [quizItems, setQuizItems] = useState<QuizData[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [dailyComplete, setDailyComplete] = useState(false);

  useEffect(() => {
    fetch("/api/daily")
      .then((r) => r.json())
      .then((d) => {
        setQuizItems(d.quizItems);
        setAnswers(d.assignment.quizAnswers ?? {});
        setDailyComplete(!!d.assignment.completedAt);
        setLoading(false);
      });
  }, []);

  const remaining = quizItems.filter((q) => !(q.id in answers));
  const current = remaining[0];

  async function pick(index: number) {
    if (!current || picked !== null) return;
    setPicked(index);
    const correct = !!current.options[index].correct;
    const res = await fetch("/api/daily/quiz-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizItemId: current.id, result: correct ? "correct" : "incorrect" }),
    });
    const data = await res.json();
    setDailyComplete(!!data.assignment?.completedAt);
  }

  function next() {
    if (!current) return;
    const correct = current.options[picked!].correct ? "correct" : "incorrect";
    setAnswers((a) => ({ ...a, [current.id]: correct }));
    setPicked(null);
  }

  if (loading) {
    return <main className="mx-auto max-w-lg flex-1 px-4 py-8 text-slate-500">加载中…</main>;
  }

  if (!current) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 text-center lg:max-w-3xl">
        <h1 className="text-2xl font-bold text-slate-900">今天的测验做完了</h1>
        <p className="mt-2 text-slate-500">
          {Object.keys(answers).length} / {quizItems.length} 题完成
        </p>
        {dailyComplete ? (
          <p className="mt-4 rounded-lg bg-emerald-50 p-3 font-semibold text-emerald-700">
            今日打卡成功 ✦
          </p>
        ) : (
          <p className="mt-4 text-sm text-slate-500">还差游戏没玩完，去首页看看今日任务吧。</p>
        )}
        <Link href="/" className="mt-6 inline-block rounded-full bg-slate-900 px-6 py-2 font-semibold text-white">
          回首页
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 lg:max-w-3xl">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
        <span>每日测验</span>
        <span>
          {Object.keys(answers).length} / {quizItems.length}
        </span>
      </div>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Daily Quiz</h1>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 leading-relaxed">
        {current.passage}
      </div>

      <p className="mt-4 font-semibold text-slate-900">{current.question}</p>
      <div className="mt-2 space-y-2">
        {current.options.map((o, i) => (
          <button
            key={i}
            onClick={() => pick(i)}
            disabled={picked !== null}
            className={`w-full rounded-lg border p-3 text-left text-sm transition ${
              picked === i
                ? o.correct
                  ? "border-emerald-400 bg-emerald-50 font-semibold text-emerald-700"
                  : "border-rose-300 bg-rose-50"
                : picked !== null
                ? "opacity-40"
                : "border-slate-200 bg-slate-50 hover:border-slate-400"
            }`}
          >
            {o.t}
          </button>
        ))}
      </div>

      {picked !== null && (
        <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          {current.explanation}
        </div>
      )}

      {picked !== null && (
        <button onClick={next} className="mt-4 w-full rounded-lg bg-slate-900 py-2 font-semibold text-white">
          下一题
        </button>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: exits 0.

- [ ] **Step 3: Manual browser verification**

Using the preview tools, navigate to `/daily-quiz`, answer through all 10 sample quiz items (mix of correct/incorrect clicks), confirm the explanation shows after each pick and "下一题" advances. After the last one, confirm the summary screen shows the count and (if the 5 games and all words were already completed in earlier manual testing) the "今日打卡成功" message. Also verify at `preset: "mobile"`.

- [ ] **Step 4: Commit**

```bash
git add src/app/daily-quiz/page.tsx
git commit -m "feat: add /daily-quiz page"
```

---

### Task 11: Home page redesign — "今日任务" card

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `getOrCreateDailyAssignment` from `@/lib/daily` (Task 4), `GAMES_PER_DAY` from `@/lib/daily` (Task 3).

- [ ] **Step 1: Replace the file**

Replace the entire contents of `src/app/page.tsx` with:

```tsx
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getStats } from "@/lib/gamification";
import { getOrCreateDailyAssignment } from "@/lib/daily";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const GAMES = [
  { href: "/vocab/clusters", title: "Clusters", domain: "词义辨析", gameType: "clusters" },
  { href: "/rw/closer", title: "Closer", domain: "词在语境", gameType: "closer" },
  { href: "/rw/read-the-green", title: "Read the Green", domain: "阅读理解 / 证据", gameType: "read_the_green" },
  { href: "/rw/gate-run", title: "Gate Run", domain: "标点 / 过渡词", gameType: "gate_run" },
  { href: "/math/dissector", title: "Dissector", domain: "数学读题", gameType: "dissector" },
];

export default async function Home() {
  const stats = await getStats();
  const daily = await getOrCreateDailyAssignment();
  const dueCount = await prisma.progress.count({
    where: { nextReview: { lte: new Date() } },
  });
  const notebookDueCount = await prisma.vocabNote.count({
    where: { nextReview: { lte: new Date() } },
  });

  const wordsDone = daily.wordsViewed.length;
  const wordsTotal = daily.wordIds.length;
  const quizDone = Object.keys(daily.quizAnswers as Record<string, string>).length;
  const quizTotal = daily.quizItemIds.length;
  const gamesDone = daily.gamesPlayed.length;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <Card className="mb-8 border-slate-900">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>今日任务</span>
            {daily.completedAt && <Badge variant="secondary">✦ 今日打卡成功</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link href="/study" className="rounded-lg border border-slate-200 p-3 hover:border-slate-400">
            <div className="text-sm text-slate-500">背单词</div>
            <div className="text-lg font-semibold text-slate-900">
              {wordsDone} / {wordsTotal}
            </div>
          </Link>
          <Link href="/daily-quiz" className="rounded-lg border border-slate-200 p-3 hover:border-slate-400">
            <div className="text-sm text-slate-500">测验</div>
            <div className="text-lg font-semibold text-slate-900">
              {quizDone} / {quizTotal}
            </div>
          </Link>
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="text-sm text-slate-500">游戏</div>
            <div className="text-lg font-semibold text-slate-900">{gamesDone} / 5</div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">XP</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.xp}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">连续打卡</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.streak} 天</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">今日待复习</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{dueCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">生词待复习</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            <Link href="/notebook" className="hover:underline">
              {notebookDueCount}
            </Link>
          </CardContent>
        </Card>
      </div>

      {stats.badges.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {stats.badges.map((b) => (
            <Badge key={b.id} variant="secondary" title={b.description}>
              🏅 {b.name}
            </Badge>
          ))}
        </div>
      )}

      <h2 className="mb-4 text-lg font-semibold text-slate-900">今日任务 · 游戏</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((g) => (
          <Link key={g.href} href={g.href}>
            <Card className="h-full transition hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{g.title}</span>
                  {daily.gamesPlayed.includes(g.gameType) && <span className="text-emerald-600">✓</span>}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-500">{g.domain}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: exits 0.

- [ ] **Step 3: Manual browser verification**

Using the preview tools, reload `/`, confirm the "今日任务" card shows at the top with three counts, and that game cards previously played today show a green checkmark. Verify at both mobile and desktop widths.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: redesign home page with today's-task card"
```

---

### Task 12: Nav links for `/study` and `/daily-quiz`

**Files:**
- Modify: `src/components/nav.tsx`

- [ ] **Step 1: Add the two links**

In `src/components/nav.tsx`, change the `<Link href="/" ...>SAT Game</Link>` block's sibling structure by inserting two new links immediately after it and before the `{GAMES.map(...)}` block:

```tsx
        <Link href="/" className="font-semibold text-slate-900 shrink-0">
          SAT Game
        </Link>
        <Link
          href="/study"
          className={`shrink-0 rounded-full px-3 py-1 ${
            pathname === "/study" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          背单词
        </Link>
        <Link
          href="/daily-quiz"
          className={`shrink-0 rounded-full px-3 py-1 ${
            pathname === "/daily-quiz" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          测验
        </Link>
        {GAMES.map((g) => (
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: exits 0.

- [ ] **Step 3: Manual verification**

Using the preview tools, confirm "背单词" and "测验" appear in the nav bar right after "SAT Game" on every page, and clicking them navigates correctly with the active-state highlight.

- [ ] **Step 4: Commit**

```bash
git add src/components/nav.tsx
git commit -m "feat: add nav links for /study and /daily-quiz"
```

---

### Task 13: Full end-to-end verification + build

**Files:** none (verification only)

- [ ] **Step 1: Production build**

```bash
npm run build
```

Expected: exits 0, no type errors, all new routes (`/api/daily`, `/api/daily/word-viewed`, `/api/daily/quiz-answer`, `/study`, `/daily-quiz`) listed in the route table.

- [ ] **Step 2: Full day-in-the-life walkthrough via curl**

```bash
COOKIE=$(mktemp)
curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"passcode":"783458"}' -c "$COOKIE" -o /dev/null

# Fetch today's assignment and mark all words viewed
python3 - "$COOKIE" <<'EOF'
import json, subprocess, sys
cookie = sys.argv[1]
data = json.loads(subprocess.check_output(["curl", "-s", "http://localhost:3000/api/daily", "-b", cookie]))
for w in data["assignment"]["wordIds"]:
    subprocess.run(["curl", "-s", "-X", "POST", "http://localhost:3000/api/daily/word-viewed",
                     "-b", cookie, "-H", "Content-Type: application/json",
                     "-d", json.dumps({"wordId": w, "unknown": False})], stdout=subprocess.DEVNULL)
for q in data["assignment"]["quizItemIds"]:
    subprocess.run(["curl", "-s", "-X", "POST", "http://localhost:3000/api/daily/quiz-answer",
                     "-b", cookie, "-H", "Content-Type: application/json",
                     "-d", json.dumps({"quizItemId": q, "result": "correct"})], stdout=subprocess.DEVNULL)
for game in ["clusters", "closer", "read_the_green", "gate_run", "dissector"]:
    subprocess.run(["curl", "-s", "-X", "POST", "http://localhost:3000/api/progress",
                     "-b", cookie, "-H", "Content-Type: application/json",
                     "-d", json.dumps({"gameType": game, "skill": "test", "result": "correct"})], stdout=subprocess.DEVNULL)
final = json.loads(subprocess.check_output(["curl", "-s", "http://localhost:3000/api/daily", "-b", cookie]))
assert final["assignment"]["completedAt"] is not None, "expected completedAt to be set"
print("OK: daily checkin completed at", final["assignment"]["completedAt"])
EOF
```

Expected: prints `OK: daily checkin completed at <timestamp>` with no assertion error.

- [ ] **Step 3: Confirm streak and badge side effects**

```bash
curl -s http://localhost:3000/api/stats -b "$COOKIE" | python3 -m json.tool
```

Expected: `stats.streak >= 1` and `stats.badges` includes an entry with `"code": "first_checkin"`.

- [ ] **Step 4: Browser pass on the home page after full completion**

Using the preview tools, reload `/`, confirm the "今日任务" card shows `24/24 · 10/10 · 5/5` (sample batch has 24 words) and the "✦ 今日打卡成功" badge next to the card title. Screenshot at both mobile and desktop widths.

- [ ] **Step 5: Update DEV-REPORT.md**

Add a new row to the "功能完成情况" table in `DEV-REPORT.md` for "每日打卡（50词+10题+5游戏）", status ✅, noting the sample content batch size (24 words / 10 quiz items) is a test fixture, not the real reviewed 1500-word batch from the design doc.

- [ ] **Step 6: Final commit**

```bash
git add DEV-REPORT.md
git commit -m "docs: record daily-checkin feature completion in DEV-REPORT"
```

---

## Self-Review Notes

- **Spec coverage:** §1 data model → Task 1. §2 API + checkin logic → Tasks 3-5. §3 pages → Tasks 9-11 (nav in Task 12). §4 content → Task 6 (explicitly scoped as sample/test data, not the real batch — per spec §4.4 that's a separate human-review workflow, not an engineering task). §5 YAGNI exclusions are respected: no multi-user, no Electron, no live LLM quiz generation.
- **Type consistency checked:** `markGamePlayed(gameType: string)` (Task 4 Step 3) matches the call added to `/api/progress/route.ts` in Task 4 Step 4. `AddToReviewReason` gains `"self_reported_unknown"` (Task 4 Step 1) before `daily.ts` uses it (Task 4 Step 3). `recordActivity` is removed and replaced by `recordXp` + `completeCheckin` (Task 4 Step 2), and its only caller is fixed in the same task (Step 4) — so `npx tsc --noEmit` in Task 4 Step 5 is green for the whole project, not just the new files. Task 5 is verification-only against the already-landed code.
