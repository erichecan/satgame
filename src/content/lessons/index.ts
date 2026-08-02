import type { Lesson } from "@/lib/lesson-types";
import { answerEngine } from "./answer-engine";
import { wordsInContext } from "./words-in-context";
import { textStructurePurpose } from "./text-structure-purpose";
import { crossTextConnections } from "./cross-text-connections";
import { centralIdeasDetails } from "./central-ideas-details";
import { evidenceTextual } from "./evidence-textual";
import { evidenceQuantitative } from "./evidence-quantitative";
import { inferences } from "./inferences";
import { transitions } from "./transitions";
import { rhetoricalSynthesis } from "./rhetorical-synthesis";
import { boundaries } from "./boundaries";
import { formStructureSense } from "./form-structure-sense";
import { sciencePassages } from "./science-passages";
import { historySocialStudies } from "./history-social-studies";
import { humanitiesPassages } from "./humanities-passages";
import { literaturePoetry } from "./literature-poetry";

// 课程目录对齐 College Board 官方 R&W 四域 11 个 skill（Unit 1–4），
// Unit 0 是通用引擎，Unit 5 是按官方四个 subject area 自建的文体专项。
// 内容源：docs/20260801-sat-strategy-compendium.md
export const LESSONS: Lesson[] = [
  answerEngine,
  wordsInContext,
  textStructurePurpose,
  crossTextConnections,
  centralIdeasDetails,
  evidenceTextual,
  evidenceQuantitative,
  inferences,
  transitions,
  rhetoricalSynthesis,
  boundaries,
  formStructureSense,
  sciencePassages,
  historySocialStudies,
  humanitiesPassages,
  literaturePoetry,
];

const BY_SLUG = new Map(LESSONS.map((l) => [l.slug, l]));

export function getLesson(slug: string): Lesson | undefined {
  return BY_SLUG.get(slug);
}
