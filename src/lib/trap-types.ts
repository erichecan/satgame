// SAT 干扰项分类学(权威 8 类 + 兼容旧值)。read_the_green / trap_spotter / inference / insights 共用。
export type TrapType =
  | "same-word"
  | "opposite"
  | "out-of-scope"
  | "too-narrow"
  | "too-extreme"
  | "fictitious-comparison"
  | "non-sequitur"
  | "tone-mismatch"
  | "wrong-logic"; // 旧数据遗留值，保留可显示

export const TRAP_LABEL: Record<TrapType, string> = {
  "same-word": "同词复述",
  opposite: "与原文相反",
  "out-of-scope": "未提及 / 需外部知识",
  "too-narrow": "以偏概全",
  "too-extreme": "极端措辞",
  "fictitious-comparison": "虚假比较",
  "non-sequitur": "不当推理",
  "tone-mismatch": "基调不符",
  "wrong-logic": "逻辑不符",
};

// 每类一句应对提示(复盘卡 / 错误 DNA 用)
export const TRAP_TIP: Record<TrapType, string> = {
  "same-word": "和原文用词一样≠对。正确答案是换词说法，原词照搬常是陷阱。",
  opposite: "和原文直接相反。读懂原文的方向就能一眼排除。",
  "out-of-scope": "原文根本没提。别用常识补，也别做假设——没说就不选。",
  "too-narrow": "一个细节冒充主旨。问主旨时，覆盖全文的才对。",
  "too-extreme": "will / all / never / certainly 这类绝对词。原文多用 likely / some，警惕极端化。",
  "fictitious-comparison": "选项造出一个原文没有的 A 比 B。看着'更学术'，其实原文根本没比较。",
  "non-sequitur": "前提到结论跳了步，虚假等价。逻辑接不上就排除。",
  "tone-mismatch": "词面对了，情感色调反了。先给原文定基调，答案基调要一致。",
  "wrong-logic": "逻辑与原文不符。",
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
