import type { TrapType } from "./trap-types";

export type PracticeOption = { t: string; correct?: boolean; trap?: string; trapType?: TrapType };

export type Chart = {
  title: string;
  unit?: string;
  bars: { label: string; value: number }[];
};

// 统一的练习题形状：所有来源（QuizItem / 各游戏 GameItem / 新生成的 lesson 题）都归一到这里
export type PracticeItem = {
  id: string;
  source: string; // 归一前的来源 gameType，便于排查
  passage?: string;
  question: string;
  options: PracticeOption[];
  why?: string;
  chart?: Chart;
  difficulty: number;
};

export type LessonStep = { title: string; detail: string };

export type WorkedExample = {
  passage?: string;
  chart?: Chart;
  question: string;
  options: PracticeOption[];
  // 分步 reveal。step 指向 steps 里的策略下标；省略时按位置对应。
  // 一道例题演示不完所有策略时（如 form-structure-sense），必须显式指定，否则标签会错位。
  walkthrough: { label: string; text: string; step?: number }[];
};

// 练习题来源配置：优先复用已审核的存量题库，不够才补新题
export type PracticeSource = {
  gameTypes?: string[]; // 从这些 gameType 的 GameItem 抽取并归一
  gateKinds?: string[]; // gate_run 专用：只取指定 kind
  rtgDomains?: string[]; // read_the_green 专用：只取指定 domain（文体专项课用）
  quizDomains?: string[]; // 从 QuizItem 抽取
};

export type Lesson = {
  slug: string;
  unit: number;
  order: number;
  title: string;
  blurb: string;
  domain: string;
  stems: string[]; // 该题型的典型题干措辞
  steps: LessonStep[];
  signals?: { label: string; items: string[] }[];
  traps: TrapType[];
  workedExample: WorkedExample;
  practice: PracticeSource;
  trainWith?: { href: string; label: string }[];
};

export type Unit = { unit: number; title: string; blurb: string };

export const UNITS: Unit[] = [
  { unit: 0, title: "The Reading Engine", blurb: "The one routine that every reading question runs on." },
  { unit: 1, title: "Craft and Structure", blurb: "Word meaning, purpose, and how two texts talk to each other." },
  { unit: 2, title: "Information and Ideas", blurb: "Main ideas, evidence, data, and inference." },
  { unit: 3, title: "Expression of Ideas", blurb: "Transitions and building a sentence that does a job." },
  { unit: 4, title: "Standard English Conventions", blurb: "Punctuation boundaries, and sentence form." },
  { unit: 5, title: "Passage-Type Playbook", blurb: "What to expect when the subject changes on you." },
];

export type Mastery = "not-started" | "familiar" | "proficient" | "mastered";

export const MASTERY_LABEL: Record<Mastery, string> = {
  "not-started": "Not started",
  familiar: "Familiar",
  proficient: "Proficient",
  mastered: "Mastered",
};

// masteryScore 由 srs.ts 维护（0–1）；这里把它翻译成 KA 式四档
export function masteryOf(score: number | null | undefined, attempted: boolean): Mastery {
  if (!attempted) return "not-started";
  if (score == null) return "familiar";
  if (score >= 0.85) return "mastered";
  if (score >= 0.5) return "proficient";
  return "familiar";
}
