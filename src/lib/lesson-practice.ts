import { prisma } from "./db";
import { TRAP_TYPES, TRAP_LABEL, type TrapType } from "./trap-types";
import type { Lesson, PracticeItem, PracticeOption } from "./lesson-types";

// 每个来源的 payload 形状不同，这里统一归一到 PracticeItem。
// 原则：复用已人工复审过的存量题，不复制行、不改写原数据。

type Row = { id: string; gameType: string; difficulty: number; payload: unknown; explanation: string | null };

// 稳定的 id → 数字，用于确定性洗牌（保证正确项位置不偏，且每次渲染一致）
function seedOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function rotate<T>(arr: T[], id: string): T[] {
  if (arr.length < 2) return arr;
  const k = seedOf(id) % arr.length;
  return [...arr.slice(k), ...arr.slice(0, k)];
}

function normalize(row: Row): PracticeItem | null {
  const p = row.payload as Record<string, unknown>;
  const base = { id: row.id, source: row.gameType, difficulty: row.difficulty };

  switch (row.gameType) {
    case "lesson": {
      const options = p.options as PracticeOption[] | undefined;
      if (!options?.length || typeof p.question !== "string") return null;
      return {
        ...base,
        passage: typeof p.passage === "string" ? p.passage : undefined,
        chart: p.chart as PracticeItem["chart"],
        question: p.question,
        options: rotate(options, row.id),
        why: (p.why as string) ?? row.explanation ?? undefined,
      };
    }

    case "read_the_green": {
      const sentences = p.sentences as string[] | undefined;
      const options = p.options as PracticeOption[] | undefined;
      if (!options?.length || typeof p.question !== "string") return null;
      return {
        ...base,
        passage: sentences?.join(" "),
        question: p.question,
        options: rotate(options, row.id),
        why: (p.evidenceWhy as string) ?? row.explanation ?? undefined,
      };
    }

    case "paraphrase": {
      const options = p.options as (PracticeOption & { why?: string })[] | undefined;
      if (!options?.length || typeof p.source !== "string") return null;
      return {
        ...base,
        passage: p.source as string,
        question: "Which choice most closely restates the sentence above?",
        options: rotate(
          options.map((o) => ({ ...o, trap: o.trap ?? (o.correct ? undefined : o.why) })),
          row.id
        ),
        why: options.find((o) => o.correct)?.why ?? row.explanation ?? undefined,
      };
    }

    case "inference": {
      const options = p.options as PracticeOption[] | undefined;
      if (!options?.length || typeof p.text !== "string") return null;
      return {
        ...base,
        passage: p.text as string,
        question: "Which choice most logically completes the text?",
        options: rotate(options, row.id),
        why: (p.why as string) ?? row.explanation ?? undefined,
      };
    }

    case "graphic": {
      const options = p.options as PracticeOption[] | undefined;
      if (!options?.length || typeof p.question !== "string") return null;
      return {
        ...base,
        passage: p.blurb as string,
        chart: {
          title: p.title as string,
          unit: p.unit as string | undefined,
          bars: p.bars as { label: string; value: number }[],
        },
        question: p.question,
        options: rotate(options, row.id),
        why: (p.why as string) ?? row.explanation ?? undefined,
      };
    }

    case "gate_run": {
      const doors = p.doors as string[] | undefined;
      const correctIndex = p.correctIndex as number | undefined;
      if (!doors?.length || correctIndex == null) return null;
      const kind = p.kind as string;
      const question =
        kind === "punctuation" || kind === "apostrophe"
          ? "Which choice completes the text so that it conforms to the conventions of Standard English?"
          : kind === "redundancy"
            ? "Which choice completes the text without repeating information already given?"
            : "Which choice completes the text with the most logical transition?";
      return {
        ...base,
        passage: `${p.before as string} ______ ${p.after as string}`,
        question,
        options: rotate(
          doors.map((d, i) => ({ t: d, correct: i === correctIndex })),
          row.id
        ),
        why: (p.why as string) ?? row.explanation ?? undefined,
      };
    }

    case "trap_spotter": {
      const verdict = p.verdict as string;
      if (!verdict || verdict === "correct" || !TRAP_TYPES.includes(verdict as TrapType)) return null;
      // 从 8 类里确定性地取 3 个干扰项，凑成四选一
      const others = TRAP_TYPES.filter((t) => t !== verdict);
      const start = seedOf(row.id) % others.length;
      const picked = [0, 1, 2].map((i) => others[(start + i) % others.length]);
      const options: PracticeOption[] = [
        { t: TRAP_LABEL[verdict as TrapType], correct: true },
        ...picked.map((t) => ({ t: TRAP_LABEL[t] })),
      ];
      return {
        ...base,
        passage: [p.passage as string | undefined, `Option under review: “${p.option as string}”`]
          .filter(Boolean)
          .join("\n\n"),
        question: "This option is wrong. Which kind of trap is it?",
        options: rotate(options, row.id),
        why: row.explanation ?? undefined,
      };
    }

    default:
      return null;
  }
}

function normalizeQuiz(q: {
  id: string;
  passage: string;
  question: string;
  options: unknown;
  explanation: string | null;
  difficulty: number;
}): PracticeItem | null {
  const options = q.options as PracticeOption[] | undefined;
  if (!options?.length) return null;
  return {
    id: q.id,
    source: "quiz",
    difficulty: q.difficulty,
    passage: q.passage,
    question: q.question,
    options: rotate(options, q.id),
    why: q.explanation ?? undefined,
  };
}

// 从候选池里按难度分层取题：每档难度均摊，档内用 round 轮换，保证「再练一组」能出新题。
// 结果按难度升序排列（照 DSAT 由易到难的编排）。
function stratifiedPick(pool: PracticeItem[], take: number, round: number): PracticeItem[] {
  const buckets = new Map<number, PracticeItem[]>();
  for (const it of pool) {
    const d = Math.min(4, Math.max(1, it.difficulty));
    const b = buckets.get(d) ?? [];
    b.push(it);
    buckets.set(d, b);
  }
  for (const b of buckets.values()) b.sort((a, c) => seedOf(a.id) - seedOf(c.id));

  const levels = [...buckets.keys()].sort((a, b) => a - b);
  if (!levels.length) return [];

  const perLevel = Math.ceil(take / levels.length);
  const picked: PracticeItem[] = [];
  const seen = new Set<string>();

  // 逐轮在各难度档间轮转取题；round 决定起始偏移，所以「再练一组」会拿到不同的题
  for (let pass = 0; picked.length < take && pass < perLevel * 4; pass++) {
    for (const level of levels) {
      if (picked.length >= take) break;
      const b = buckets.get(level)!;
      const item = b[(round * perLevel + pass) % b.length];
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      picked.push(item);
    }
  }
  return picked.sort((a, b) => a.difficulty - b.difficulty);
}

export async function loadPracticeItems(lesson: Lesson, take = 8, round = 0): Promise<PracticeItem[]> {
  const { practice } = lesson;
  const pool: PracticeItem[] = [];
  const CANDIDATE_CAP = 120; // 候选池上限，避免整表拉取

  // 1) 本课专属新题（gameType=lesson，按 skill 精确匹配）优先
  const own = await prisma.gameItem.findMany({
    where: { gameType: "lesson", skill: lesson.slug, isActive: true },
    orderBy: { createdAt: "asc" },
    take: CANDIDATE_CAP,
  });
  pool.push(...own.map(normalize).filter((x): x is PracticeItem => x !== null));

  // 2) 复用存量游戏题库
  if (practice.gameTypes?.length) {
    const rows = await prisma.gameItem.findMany({
      where: {
        gameType: { in: practice.gameTypes },
        isActive: true,
        ...(practice.rtgDomains ? { domain: { in: practice.rtgDomains } } : {}),
      },
      orderBy: { createdAt: "asc" },
      take: CANDIDATE_CAP * 3,
    });
    for (const row of rows) {
      const p = row.payload as Record<string, unknown>;
      if (row.gameType === "gate_run" && practice.gateKinds && !practice.gateKinds.includes(p.kind as string))
        continue;
      const item = normalize(row);
      if (item) pool.push(item);
    }
  }

  // 3) 每日测验题库（SAT 短文四选一，形状天然吻合）
  if (practice.quizDomains?.length) {
    const quizzes = await prisma.quizItem.findMany({
      where: { domain: { in: practice.quizDomains }, isActive: true },
      orderBy: { createdAt: "asc" },
      take: CANDIDATE_CAP * 3,
    });
    pool.push(...quizzes.map(normalizeQuiz).filter((x): x is PracticeItem => x !== null));
  }

  return stratifiedPick(pool, take, round);
}
