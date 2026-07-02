import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CLUSTERS_PUZZLES = [
  [
    { theme: "Praise", words: [["laud", "praise highly"], ["extol", "praise enthusiastically"], ["commend", "praise formally"], ["applaud", "express approval of"]] },
    { theme: "Criticize", words: [["censure", "criticize formally"], ["rebuke", "scold sharply"], ["denounce", "condemn publicly"], ["disparage", "belittle, run down"]] },
    { theme: "Unclear", words: [["ambiguous", "open to two readings"], ["vague", "not precise"], ["nebulous", "hazy, ill-defined"], ["obscure", "hard to understand"]] },
    { theme: "Short-lived", words: [["fleeting", "passing quickly"], ["transient", "lasting briefly"], ["ephemeral", "gone almost at once"], ["momentary", "lasting a moment"]] },
  ],
  [
    { theme: "Very angry", words: [["furious", "extremely angry"], ["livid", "furiously angry"], ["irate", "very angry"], ["incensed", "made very angry"]] },
    { theme: "Very happy", words: [["elated", "thrilled, overjoyed"], ["jubilant", "triumphantly happy"], ["ecstatic", "overwhelmingly joyful"], ["overjoyed", "extremely pleased"]] },
    { theme: "Stingy", words: [["miserly", "hoarding money"], ["parsimonious", "unwilling to spend"], ["frugal", "sparing, economical"], ["thrifty", "careful with money"]] },
    { theme: "Stubborn", words: [["obstinate", "refusing to budge"], ["headstrong", "willful"], ["intransigent", "unwilling to compromise"], ["adamant", "firmly unyielding"]] },
  ],
  [
    { theme: "Generous", words: [["benevolent", "kindly, giving"], ["magnanimous", "generous in spirit"], ["altruistic", "selflessly caring"], ["charitable", "giving to others"]] },
    { theme: "Brave", words: [["intrepid", "fearless"], ["valiant", "courageous"], ["dauntless", "not discouraged"], ["audacious", "boldly daring"]] },
    { theme: "Cautious", words: [["prudent", "careful, wise"], ["wary", "on guard"], ["circumspect", "watchful of risk"], ["tentative", "hesitant, unsure"]] },
    { theme: "Honest / direct", words: [["candid", "frank"], ["forthright", "straight-talking"], ["blunt", "bluntly direct"], ["frank", "open, plain-spoken"]] },
  ],
] as const;

const CLOSER_WORDS = [
  { word: "ambivalent", pos: "adjective", def: "Having mixed or contradictory feelings about something.", ex: "She felt {word} about leaving home — excited and anxious at once." },
  { word: "meticulous", pos: "adjective", def: "Showing great, careful attention to detail.", ex: "His {word} yardage book left nothing to chance." },
  { word: "pragmatic", pos: "adjective", def: "Dealing with things in a practical way rather than an idealistic one.", ex: "A {word} coach cares about what works, not what sounds nice." },
  { word: "undermine", pos: "verb", def: "To weaken or damage something gradually.", ex: "Constant criticism can {word} a player's confidence." },
  { word: "scrutinize", pos: "verb", def: "To examine or inspect closely and critically.", ex: "The judges {word}d every swing for the smallest flaw." },
  { word: "mitigate", pos: "verb", def: "To make something less severe or harmful.", ex: "A proper warm-up can {word} the risk of injury." },
  { word: "prudent", pos: "adjective", def: "Acting with care and forethought; sensibly cautious.", ex: "It was {word} to lay up rather than risk the water." },
  { word: "arbitrary", pos: "adjective", def: "Based on random choice or whim, not on reason.", ex: "The penalty felt {word}, with no rule to back it up." },
  { word: "nuanced", pos: "adjective", def: "Marked by subtle distinctions or shades of meaning.", ex: "Her {word} reading of the passage caught what others missed." },
  { word: "tenuous", pos: "adjective", def: "Very weak, thin, or flimsy; lacking substance.", ex: "The whole argument rested on {word} evidence." },
  { word: "candid", pos: "adjective", def: "Truthful and straightforward; frank.", ex: "Her {word} feedback was hard to hear but genuinely useful." },
  { word: "resilient", pos: "adjective", def: "Able to recover quickly from difficulty or setbacks.", ex: "{word} golfers shake off a bad hole and move on." },
];

const READ_THE_GREEN_ITEMS = [
  {
    sentences: [
      "Sea otters feed on sea urchins, which themselves graze on kelp.",
      "Where otters are abundant, kelp forests grow thick and shelter hundreds of species.",
      "When otters vanish, urchins multiply and strip the kelp bare.",
      "For this reason, ecologists call the sea otter a keystone species.",
    ],
    question: "What is the main point of the passage?",
    options: [
      { t: "Otters indirectly protect whole kelp forest ecosystems.", correct: true },
      { t: "Sea urchins are the most valuable species in kelp forests.", trap: "Opposite — in the passage urchins damage the kelp." },
      { t: "Kelp can only grow in very cold water.", trap: "Not stated — the passage never mentions temperature." },
      { t: "Otters eat many different sea creatures.", trap: "Too narrow — one detail, not the main idea." },
    ],
    evidenceIndex: 3,
    evidenceWhy: "Calling the otter a “keystone species” sums up the whole chain: more otters means fewer urchins, which means healthy kelp.",
  },
  {
    sentences: [
      "Maya reread the acceptance letter three times before she believed it.",
      "Her hands were still shaking when she finally set it down.",
      "She had applied on a whim, certain she had no real chance.",
    ],
    question: "What can reasonably be inferred about Maya?",
    options: [
      { t: "She did not expect to be accepted.", correct: true },
      { t: "She had applied to many programs.", trap: "Not stated — we only hear about this one." },
      { t: "She was disappointed by the news.", trap: "Opposite — shaking hands and disbelief signal shock, not letdown." },
      { t: "She regretted applying at all.", trap: "Not supported by anything in the text." },
    ],
    evidenceIndex: 2,
    evidenceWhy: "“certain she had no real chance” shows she didn't expect to get in — which is why she had to reread it to believe it.",
  },
  {
    sentences: [
      "A city study followed commuters after a new downtown bike lane opened.",
      "Within a year, the share of trips made by bicycle had nearly doubled.",
      "Car traffic on the same street, however, fell only slightly.",
      "Researchers concluded the lane mainly drew people who had been walking or taking the bus.",
    ],
    question: "The findings most directly suggest that the bike lane:",
    options: [
      { t: "shifted existing non-drivers to cycling rather than cutting car use.", correct: true },
      { t: "eliminated most car traffic downtown.", trap: "Opposite — car traffic fell only slightly." },
      { t: "was used mainly by former drivers.", trap: "Contradicts the conclusion about walkers and bus riders." },
      { t: "had no measurable effect on how people traveled.", trap: "Opposite — cycling nearly doubled." },
    ],
    evidenceIndex: 3,
    evidenceWhy: "The last line says the lane drew people who had been walking or taking the bus — non-drivers — not people who used to drive.",
  },
];

const GATE_RUN_ITEMS = [
  { kind: "punctuation", before: "She was exhausted", after: "she kept running.", doors: [",", ";"], correctIndex: 1, why: "Two complete sentences — a comma would splice them, so use a semicolon." },
  { kind: "punctuation", before: "He packed one thing", after: "his camera.", doors: [":", ";"], correctIndex: 0, why: "A full sentence introduces a single item — that's a colon." },
  { kind: "punctuation", before: "Because it was late", after: "they turned back.", doors: [",", ":"], correctIndex: 0, why: "An intro clause that can't stand alone takes a comma." },
  { kind: "punctuation", before: "The trail was steep", after: "so they rested often.", doors: [",", ";"], correctIndex: 0, why: "Two clauses joined by “so” take a comma before the conjunction." },
  { kind: "punctuation", before: "Her plan was simple", after: "wait and watch.", doors: [":", "."], correctIndex: 0, why: "A complete sentence followed by its explanation — use a colon." },
  { kind: "punctuation", before: "The rain stopped", after: "the sun came out.", doors: [",", "."], correctIndex: 1, why: "Both halves stand alone, so a period (or semicolon) is needed." },
  { kind: "transition", before: "It rained all day.", after: "the match went ahead.", doors: ["However", "Therefore"], correctIndex: 0, why: "The outcome goes against expectation — that's contrast (However)." },
  { kind: "transition", before: "She trained for months.", after: "she won easily.", doors: ["However", "As a result"], correctIndex: 1, why: "The win is the result of training — cause and effect." },
  { kind: "transition", before: "The bike is fast.", after: "it's very light.", doors: ["Moreover", "However"], correctIndex: 0, why: "A second benefit is added on — that's addition (Moreover)." },
  { kind: "transition", before: "He's often careless.", after: "he forgot his keys again.", doors: ["For instance", "Nevertheless"], correctIndex: 0, why: "A specific example of being careless — For instance." },
  { kind: "transition", before: "First, mix the dry ingredients.", after: "add the eggs.", doors: ["Then", "However"], correctIndex: 0, why: "Steps in sequence — Then." },
  { kind: "transition", before: "The forecast was grim.", after: "we set out anyway.", doors: ["Nevertheless", "Therefore"], correctIndex: 0, why: "Acting against the grim forecast — concession/contrast (Nevertheless)." },
];

const DISSECTOR_ITEMS = [
  {
    textEn: "A jacket originally costs $40. A store first raises the price by 25%, then takes 10% off the new price. What is the final sale price?",
    textZh: "一件夹克原价 $40。商店先把价格上调 25%，然后按上调后的价格再打 9 折（便宜 10%）。最终售价是多少？",
    ask: [
      { en: "the final sale price", zh: "最终售价", correct: true },
      { en: "the original price", zh: "原价" },
      { en: "the amount of the markup", zh: "上调的金额" },
      { en: "the overall percent change", zh: "整体涨跌的百分比" },
    ],
    tool: [
      { en: "Successive percent changes", zh: "连续百分比变化", correct: true },
      { en: "Linear equation", zh: "线性方程" },
      { en: "System of equations", zh: "方程组" },
      { en: "Exponential growth", zh: "指数增长" },
    ],
    cueEn: "Two percent changes in a row → multiply by 1.25, then by 0.90. You can't just add +25% and −10% to cancel them.",
    cueZh: "两次连续的百分比变化 → 依次乘以 1.25 再乘以 0.90；不能把 +25% 和 −10% 直接加减抵消。",
    turns: 2,
    steps: [
      { en: "Find the marked-up price (original × 1.25)", zh: "先求上调后的价格（原价 × 1.25）" },
      { en: "Take 10% off that price (× 0.90)", zh: "再对上调后的价格打 9 折（× 0.90）" },
    ],
    workEn: "40 × 1.25 = 50\n50 × 0.90 = 45",
    workZh: "40 × 1.25 = 50\n50 × 0.90 = 45",
    answerEn: "$45",
    answerZh: "$45",
  },
  {
    textEn: "A car travels 180 miles using 6 gallons of gas. At the same rate, how many gallons are needed to travel 300 miles?",
    textZh: "一辆车用 6 加仑汽油行驶了 180 英里。按相同的油耗，行驶 300 英里需要多少加仑？",
    ask: [
      { en: "the gallons needed for 300 miles", zh: "300 英里所需的加仑数", correct: true },
      { en: "the miles per gallon", zh: "每加仑能跑多少英里" },
      { en: "the total miles driven", zh: "总共行驶的英里数" },
      { en: "the cost of the gas", zh: "汽油的花费" },
    ],
    tool: [
      { en: "Ratio / proportion", zh: "比例 / 比率", correct: true },
      { en: "Linear equation with a constant", zh: "带常数项的线性方程" },
      { en: "Percent", zh: "百分比" },
      { en: "Geometry (area)", zh: "几何面积" },
    ],
    cueEn: "“Same rate” = one constant ratio. The problem never gives miles-per-gallon directly — you have to find it first. That's the second turn.",
    cueZh: "“相同的油耗”= 同一比率。题目没直接给每加仑跑多少英里 —— 要先把这个率求出来，这就是第二个弯。",
    turns: 2,
    steps: [
      { en: "Find the fuel rate (total miles ÷ total gallons)", zh: "先求油耗率（总英里 ÷ 总加仑）" },
      { en: "Use the rate to find gallons (target miles ÷ rate)", zh: "用油耗率求所需加仑（目标英里 ÷ 率）" },
    ],
    workEn: "180 ÷ 6 = 30 miles/gallon\n300 ÷ 30 = 10 gallons",
    workZh: "180 ÷ 6 = 30 英里/加仑\n300 ÷ 30 = 10 加仑",
    answerEn: "10 gallons",
    answerZh: "10 加仑",
  },
  {
    textEn: "A gym charges a one-time $30 sign-up fee plus $15 per month. When a member has paid $150 in total, what month is it?",
    textZh: "一家健身房收一次性 $30 注册费，之后每月 $15。当一名会员一共付了 $150 时，是第几个月？",
    ask: [
      { en: "the number of months", zh: "月数", correct: true },
      { en: "the monthly fee", zh: "每月费用" },
      { en: "the total after one year", zh: "一年的总花费" },
      { en: "the sign-up fee", zh: "注册费" },
    ],
    tool: [
      { en: "Linear equation", zh: "线性方程", correct: true },
      { en: "Exponential growth", zh: "指数增长" },
      { en: "Quadratic equation", zh: "二次方程" },
      { en: "Proportion", zh: "比例" },
    ],
    cueEn: "A one-time fixed fee + a fixed amount each month → linear: 30 + 15m = 150.",
    cueZh: "一次性固定费 + 每月固定额 → 线性关系：30 + 15m = 150。",
    turns: 2,
    steps: [
      { en: "Set up the equation (30 + 15m = 150)", zh: "列出方程（30 + 15m = 150）" },
      { en: "Solve for the number of months m", zh: "解出月数 m" },
    ],
    workEn: "30 + 15m = 150\n15m = 120 → m = 8",
    workZh: "30 + 15m = 150\n15m = 120 → m = 8",
    answerEn: "8 months",
    answerZh: "8 个月",
  },
  {
    textEn: "A town has 5,000 residents. Its population grows by 4% each year. About how many residents will there be after 2 years (to the nearest whole number)?",
    textZh: "某镇现有 5,000 名居民，人口每年增长 4%。两年后人口约为多少（取整数）？",
    ask: [
      { en: "the population after 2 years", zh: "两年后的人口", correct: true },
      { en: "the number of people added each year", zh: "每年增加的人数" },
      { en: "the growth percentage", zh: "增长的百分比" },
      { en: "the population after 1 year", zh: "一年后的人口" },
    ],
    tool: [
      { en: "Exponential growth", zh: "指数增长", correct: true },
      { en: "Linear (add a fixed number each year)", zh: "线性（每年加固定人数）" },
      { en: "Percent of a single value", zh: "对单一数值取百分比" },
      { en: "Proportion", zh: "比例" },
    ],
    cueEn: "“Grows by 4% each year” is proportional → exponential: multiply by (1.04) per year. Adding 4 people a year would be linear.",
    cueZh: "“每年增长 4%”是按比例增长 → 指数，乘以 (1.04) 的年数次方；若是“每年增加 4 人”才是线性。",
    turns: 2,
    steps: [
      { en: "Find the year-1 population (× 1.04)", zh: "求第一年人口（× 1.04）" },
      { en: "Multiply by 1.04 again for year 2", zh: "在第一年基础上再 × 1.04 得第二年" },
    ],
    workEn: "5000 × 1.04 = 5200\n5200 × 1.04 ≈ 5408",
    workZh: "5000 × 1.04 = 5200\n5200 × 1.04 ≈ 5408",
    answerEn: "≈ 5,408 residents",
    answerZh: "≈ 5,408 人",
  },
  {
    textEn: "Tickets cost $12 each. A group buys 8 tickets and uses a coupon for $5 off the total. They split the final cost equally among 4 people. How much does each person pay?",
    textZh: "门票每张 $12。一行人买了 8 张票，用优惠券从总价里减 $5，然后把最终费用平摊给 4 个人。每人付多少？",
    ask: [
      { en: "the amount each person pays", zh: "每人付的金额", correct: true },
      { en: "the total before the coupon", zh: "优惠前的总价" },
      { en: "the size of the discount", zh: "优惠的金额" },
      { en: "the price per ticket", zh: "每张票的价格" },
    ],
    tool: [
      { en: "Multi-step arithmetic (mind the order)", zh: "多步四则运算（注意顺序）", correct: true },
      { en: "System of equations", zh: "方程组" },
      { en: "Percent", zh: "百分比" },
      { en: "Proportion", zh: "比例" },
    ],
    cueEn: "Total first, then subtract the coupon, then split — the order can't change. That's three turns.",
    cueZh: "先算总价、再减优惠、最后平摊 —— 三步顺序不能乱，这是三个弯。",
    turns: 3,
    steps: [
      { en: "Find the ticket total (8 × 12)", zh: "求票的总价（8 × 12）" },
      { en: "Subtract the coupon from the total (− 5)", zh: "从总价里减去优惠（− 5）" },
      { en: "Split the result among 4 people (÷ 4)", zh: "把结果平摊给 4 人（÷ 4）" },
    ],
    workEn: "8 × 12 = 96\n96 − 5 = 91\n91 ÷ 4 = 22.75",
    workZh: "8 × 12 = 96\n96 − 5 = 91\n91 ÷ 4 = 22.75",
    answerEn: "$22.75",
    answerZh: "$22.75",
  },
];

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

async function main() {
  // Words from Clusters + Closer
  for (const puzzle of CLUSTERS_PUZZLES) {
    for (const group of puzzle) {
      for (const [word, gloss] of group.words) {
        await prisma.word.upsert({
          where: { word },
          create: { word, definitionEn: gloss, difficulty: 2 },
          update: {},
        });
      }
    }
  }
  for (const w of CLOSER_WORDS) {
    await prisma.word.upsert({
      where: { word: w.word },
      create: {
        word: w.word,
        partOfSpeech: w.pos,
        definitionEn: w.def,
        exampleEn: w.ex.replace("{word}", w.word),
        difficulty: 2,
      },
      update: {},
    });
  }

  // GameItems
  await prisma.gameItem.deleteMany({ where: { gameType: "clusters" } });
  for (const puzzle of CLUSTERS_PUZZLES) {
    await prisma.gameItem.create({
      data: {
        gameType: "clusters",
        domain: "craft_structure",
        difficulty: 2,
        payload: { groups: puzzle.map((g) => ({ theme: g.theme, words: g.words.map(([word, gloss]) => ({ word, gloss })) })) },
      },
    });
  }

  await prisma.gameItem.deleteMany({ where: { gameType: "closer" } });
  for (const w of CLOSER_WORDS) {
    await prisma.gameItem.create({
      data: {
        gameType: "closer",
        domain: "words_in_context",
        difficulty: 2,
        payload: w,
      },
    });
  }

  await prisma.gameItem.deleteMany({ where: { gameType: "read_the_green" } });
  for (const item of READ_THE_GREEN_ITEMS) {
    await prisma.gameItem.create({
      data: {
        gameType: "read_the_green",
        domain: "info_ideas",
        difficulty: 2,
        payload: item,
        explanation: item.evidenceWhy,
      },
    });
  }

  await prisma.gameItem.deleteMany({ where: { gameType: "gate_run" } });
  for (const item of GATE_RUN_ITEMS) {
    await prisma.gameItem.create({
      data: {
        gameType: "gate_run",
        domain: "expression_conventions",
        difficulty: 2,
        payload: item,
        explanation: item.why,
      },
    });
  }

  await prisma.gameItem.deleteMany({ where: { gameType: "dissector" } });
  for (const item of DISSECTOR_ITEMS) {
    await prisma.gameItem.create({
      data: {
        gameType: "dissector",
        domain: "math",
        difficulty: 2,
        payload: item,
      },
    });
  }

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

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
