// SAT distractor taxonomy (canonical 8 types + legacy value). Shared by read_the_green / trap_spotter / inference / insights.
export type TrapType =
  | "same-word"
  | "opposite"
  | "out-of-scope"
  | "too-narrow"
  | "too-extreme"
  | "fictitious-comparison"
  | "non-sequitur"
  | "tone-mismatch"
  | "wrong-logic"; // legacy value, still displayable

export const TRAP_LABEL: Record<TrapType, string> = {
  "same-word": "Repeats wording",
  opposite: "Opposite",
  "out-of-scope": "Not stated",
  "too-narrow": "Too narrow",
  "too-extreme": "Too extreme",
  "fictitious-comparison": "False comparison",
  "non-sequitur": "Doesn't follow",
  "tone-mismatch": "Wrong tone",
  "wrong-logic": "Faulty logic",
};

// One coaching line per type (used in review cards / error DNA)
export const TRAP_TIP: Record<TrapType, string> = {
  "same-word": "Matching the passage's words isn't the same as being right. The correct answer paraphrases; word-for-word echoes are often traps.",
  opposite: "It states the reverse of the passage. Get the direction of the text and you can rule it out at a glance.",
  "out-of-scope": "The passage never says this. Don't fill it in with outside knowledge, and don't assume—if it isn't stated, don't pick it.",
  "too-narrow": "One detail posing as the main idea. When the question asks for the main point, the answer has to cover the whole passage.",
  "too-extreme": "Absolute words like will / all / never / certainly. The passage usually hedges with likely / some—beware of overstatement.",
  "fictitious-comparison": "The option invents an A-beats-B comparison the passage never makes. It sounds 'academic,' but the text drew no such comparison.",
  "non-sequitur": "It jumps from premise to conclusion—a false equivalence. If the logic doesn't connect, rule it out.",
  "tone-mismatch": "The words fit but the emotional tone is reversed. Fix the passage's tone first; the answer's tone must match.",
  "wrong-logic": "The logic conflicts with the passage.",
};

export const TRAP_TYPES: TrapType[] = [
  "same-word",
  "opposite",
  "out-of-scope",
  "too-narrow",
  "too-extreme",
  "fictitious-comparison",
  "non-sequitur",
  "tone-mismatch",
];
