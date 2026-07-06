// P5 内容脚本:graphic(图表题) + connotation(褒贬极速) 两个新游戏,
// 以及 gate_run 深化(追加冗余/所有格题,用 [p5] 标识,不清空既有 274 条)。幂等。
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type TrapType = "same-word" | "opposite" | "out-of-scope" | "too-narrow" | "too-extreme" | "fictitious-comparison" | "non-sequitur" | "tone-mismatch";
type GOpt = { t: string; correct?: boolean; trap?: string; trapType?: TrapType };
type GraphicItem = { title: string; unit?: string; bars: { label: string; value: number }[]; blurb: string; question: string; options: GOpt[]; why: string; difficulty: number };

const GRAPHIC: GraphicItem[] = [
  { title: "各年龄段日均娱乐屏幕时间", unit: "小时", bars: [{ label: "青少年", value: 7.2 }, { label: "成人 30–49", value: 4.1 }, { label: "成人 65+", value: 2.3 }],
    blurb: "A survey measured daily recreational screen time. The researchers noted that usage ___",
    question: "Which choice best completes the text with data from the graph?",
    options: [
      { t: "declined steadily as age increased.", correct: true },
      { t: "was highest among adults 65 and older.", trap: "65+ 组最低,与图相反。", trapType: "opposite" },
      { t: "was nearly identical across all groups.", trap: "各组差异明显。", trapType: "opposite" },
      { t: "proves that screens are harming teenagers.", trap: "图表没有关于危害的信息。", trapType: "out-of-scope" },
    ], why: "7.2→4.1→2.3 随年龄递减,正确概括要覆盖全部三组的下降趋势。", difficulty: 2 },
  { title: "四种作物每公顷产量", unit: "吨", bars: [{ label: "玉米", value: 9.4 }, { label: "小麦", value: 3.5 }, { label: "水稻", value: 4.7 }, { label: "大豆", value: 2.8 }],
    blurb: "The yields varied widely by crop. For example, ___",
    question: "Which choice best illustrates the claim about wide variation?",
    options: [
      { t: "corn yielded 9.4 tons while soybeans yielded only 2.8.", correct: true },
      { t: "wheat yielded 3.5 tons per hectare.", trap: "只给一个作物,看不出'差异大'。", trapType: "too-narrow" },
      { t: "rice and wheat yielded almost the same amount.", trap: "接近的两个反而说明差异小。", trapType: "opposite" },
      { t: "corn is a more nutritious crop than soybeans.", trap: "图表不含营养信息。", trapType: "out-of-scope" },
    ], why: "'varied widely' 要举差距最大的一对(玉米 vs 大豆),不只是'不同'。", difficulty: 3 },
  { title: "某湖泊溶解氧含量(按月)", unit: "mg/L", bars: [{ label: "一月", value: 11 }, { label: "四月", value: 9 }, { label: "七月", value: 5 }, { label: "十月", value: 8 }],
    blurb: "Dissolved oxygen fell to its lowest point in the warmest month, suggesting that oxygen levels ___",
    question: "Which choice best completes the text?",
    options: [
      { t: "reached their minimum in July.", correct: true },
      { t: "were lowest in January.", trap: "一月最高。", trapType: "opposite" },
      { t: "stayed constant all year.", trap: "各月明显变化。", trapType: "opposite" },
      { t: "were higher than in any other lake.", trap: "图表未与其他湖比较。", trapType: "fictitious-comparison" },
    ], why: "七月 5 mg/L 为最低,与'最热月'吻合。", difficulty: 2 },
  { title: "三国太阳能装机增长(2015→2020)", unit: "GW", bars: [{ label: "A 国 2015", value: 12 }, { label: "A 国 2020", value: 48 }, { label: "B 国 2015", value: 20 }, { label: "B 国 2020", value: 26 }],
    blurb: "Between 2015 and 2020, one country's capacity grew far faster than the other's, since ___",
    question: "Which choice best completes the text?",
    options: [
      { t: "Country A quadrupled while Country B rose only slightly.", correct: true },
      { t: "both countries grew by the same amount.", trap: "A 增 36,B 只增 6。", trapType: "opposite" },
      { t: "Country B started at a lower level than A.", trap: "B 起点其实更高。", trapType: "opposite" },
      { t: "Country A now has the cleanest air on Earth.", trap: "图表不含空气质量。", trapType: "out-of-scope" },
    ], why: "A 从 12→48(翻两番),B 从 20→26(微增),故 A 增长远快。", difficulty: 3 },
  { title: "图书馆各时段到访人数", unit: "人", bars: [{ label: "上午", value: 40 }, { label: "下午", value: 120 }, { label: "傍晚", value: 210 }, { label: "深夜", value: 30 }],
    blurb: "Attendance peaked in one part of the day, which implies the library was busiest ___",
    question: "Which choice best completes the text?",
    options: [
      { t: "in the evening.", correct: true },
      { t: "at night.", trap: "深夜 30 人最少。", trapType: "opposite" },
      { t: "in the morning.", trap: "上午仅 40 人。", trapType: "opposite" },
      { t: "at exactly the same rate all day.", trap: "各时段差异明显。", trapType: "opposite" },
    ], why: "傍晚 210 人为峰值。", difficulty: 1 },
  { title: "四种材料抗拉强度", unit: "MPa", bars: [{ label: "铝", value: 310 }, { label: "钛", value: 900 }, { label: "碳钢", value: 500 }, { label: "铜", value: 220 }],
    blurb: "The strongest material tested was far stronger than the weakest, as shown when ___",
    question: "Which choice best supports the claim?",
    options: [
      { t: "titanium reached 900 MPa versus copper's 220.", correct: true },
      { t: "aluminum measured 310 MPa.", trap: "只一个数据,看不出'远强于'。", trapType: "too-narrow" },
      { t: "carbon steel and aluminum were about equal.", trap: "它们并不接近,且非最强最弱。", trapType: "opposite" },
      { t: "titanium is cheaper than copper.", trap: "图表不含价格。", trapType: "out-of-scope" },
    ], why: "对比最强(钛 900)与最弱(铜 220)才体现'远强于'。", difficulty: 2 },
  { title: "某城市年降雨量", unit: "mm", bars: [{ label: "2016", value: 820 }, { label: "2017", value: 760 }, { label: "2018", value: 690 }, { label: "2019", value: 640 }],
    blurb: "Over these four years, annual rainfall ___",
    question: "Which choice best describes the overall trend?",
    options: [
      { t: "decreased each year from 2016 to 2019.", correct: true },
      { t: "increased sharply after 2016.", trap: "实际逐年下降。", trapType: "opposite" },
      { t: "dropped only between 2018 and 2019.", trap: "只覆盖一段,概括不完整。", trapType: "too-narrow" },
      { t: "will certainly keep falling forever.", trap: "对未来的绝对断言。", trapType: "too-extreme" },
    ], why: "概括趋势要覆盖完整区间:820→640 连年下降。", difficulty: 2 },
  { title: "四种鸟每日觅食时长", unit: "小时", bars: [{ label: "麻雀", value: 6 }, { label: "鹰", value: 3 }, { label: "蜂鸟", value: 8 }, { label: "猫头鹰", value: 4 }],
    blurb: "The bird that spent the most time foraging did so for ___",
    question: "Which choice best completes the text with data from the graph?",
    options: [
      { t: "eight hours a day.", correct: true },
      { t: "three hours a day.", trap: "3 小时是最少的鹰。", trapType: "opposite" },
      { t: "the same time as the owl.", trap: "蜂鸟 8、猫头鹰 4,不同。", trapType: "opposite" },
      { t: "longer than any bird ever recorded.", trap: "图表未与所有鸟比较。", trapType: "fictitious-comparison" },
    ], why: "蜂鸟 8 小时最长。", difficulty: 1 },
  { title: "在线课程完成率(按时长)", unit: "%", bars: [{ label: "<1 小时", value: 74 }, { label: "1–3 小时", value: 52 }, { label: "3–6 小时", value: 33 }, { label: ">6 小时", value: 18 }],
    blurb: "As course length increased, completion rates ___",
    question: "Which choice best completes the text?",
    options: [
      { t: "fell steadily.", correct: true },
      { t: "rose steadily.", trap: "实际随时长下降。", trapType: "opposite" },
      { t: "stayed above 70% throughout.", trap: "多数组远低于 70%。", trapType: "opposite" },
      { t: "prove longer courses are worthless.", trap: "图表不支持价值判断。", trapType: "out-of-scope" },
    ], why: "74→52→33→18 随时长递减。", difficulty: 2 },
  { title: "三种通勤方式平均耗时", unit: "分钟", bars: [{ label: "自行车", value: 22 }, { label: "公交", value: 35 }, { label: "地铁", value: 18 }],
    blurb: "The fastest commute option in the data was ___",
    question: "Which choice best completes the text?",
    options: [
      { t: "the subway, at 18 minutes.", correct: true },
      { t: "the bus, at 35 minutes.", trap: "公交最慢。", trapType: "opposite" },
      { t: "the bicycle, at 18 minutes.", trap: "自行车是 22 分钟,不是 18。", trapType: "same-word" },
      { t: "faster than any car trip.", trap: "图表没有汽车数据。", trapType: "out-of-scope" },
    ], why: "地铁 18 分钟最快。", difficulty: 1 },
  { title: "实验组与对照组存活率", unit: "%", bars: [{ label: "对照组", value: 45 }, { label: "低剂量", value: 62 }, { label: "高剂量", value: 88 }],
    blurb: "Survival rose as dosage increased, indicating that the treatment ___",
    question: "Which choice best completes the text?",
    options: [
      { t: "improved survival relative to the control group.", correct: true },
      { t: "had no effect on survival.", trap: "存活率明显上升。", trapType: "opposite" },
      { t: "guaranteed survival for every subject.", trap: "最高也只有 88%。", trapType: "too-extreme" },
      { t: "worked better than all other drugs.", trap: "未与其他药比较。", trapType: "fictitious-comparison" },
    ], why: "45→62→88 随剂量上升,说明治疗相对对照组提升存活。", difficulty: 2 },
  { title: "四个季度销售额", unit: "万元", bars: [{ label: "Q1", value: 120 }, { label: "Q2", value: 150 }, { label: "Q3", value: 90 }, { label: "Q4", value: 200 }],
    blurb: "The single strongest quarter for sales was ___",
    question: "Which choice best completes the text?",
    options: [
      { t: "Q4, at 200.", correct: true },
      { t: "Q3, at 90.", trap: "Q3 最低。", trapType: "opposite" },
      { t: "Q1, the highest of the year.", trap: "Q1 并非最高。", trapType: "opposite" },
      { t: "every quarter equally.", trap: "各季度差异明显。", trapType: "opposite" },
    ], why: "Q4 = 200 为全年最高。", difficulty: 1 },
  { title: "三片森林物种丰富度", unit: "种", bars: [{ label: "原始林", value: 240 }, { label: "次生林", value: 130 }, { label: "人工林", value: 60 }],
    blurb: "Species richness was greatest where forests were least disturbed, so ___",
    question: "Which choice best completes the text?",
    options: [
      { t: "old-growth forest held the most species.", correct: true },
      { t: "plantations held the most species.", trap: "人工林最少。", trapType: "opposite" },
      { t: "all three forests were equally rich.", trap: "差异很大。", trapType: "opposite" },
      { t: "old-growth forest is the oldest on Earth.", trap: "图表不含树龄比较。", trapType: "out-of-scope" },
    ], why: "原始林 240 种最多,与'扰动最少'吻合。", difficulty: 2 },
  { title: "手机电池循环后容量", unit: "%", bars: [{ label: "0 次", value: 100 }, { label: "300 次", value: 88 }, { label: "600 次", value: 76 }, { label: "900 次", value: 61 }],
    blurb: "As charge cycles accumulated, battery capacity ___",
    question: "Which choice best completes the text?",
    options: [
      { t: "gradually declined.", correct: true },
      { t: "increased with more cycles.", trap: "容量随循环下降。", trapType: "opposite" },
      { t: "dropped only after 600 cycles.", trap: "300 次已开始下降。", trapType: "too-narrow" },
      { t: "fell to zero by 900 cycles.", trap: "900 次仍有 61%。", trapType: "too-extreme" },
    ], why: "100→88→76→61 随循环递减。", difficulty: 2 },
  { title: "两种教学法测验均分", unit: "分", bars: [{ label: "讲授前测", value: 54 }, { label: "讲授后测", value: 61 }, { label: "探究前测", value: 55 }, { label: "探究后测", value: 78 }],
    blurb: "Compared with the lecture group, the inquiry group's scores ___",
    question: "Which choice best completes the text?",
    options: [
      { t: "improved much more from pre-test to post-test.", correct: true },
      { t: "improved less than the lecture group.", trap: "探究提升 23,讲授仅 7。", trapType: "opposite" },
      { t: "started far higher on the pre-test.", trap: "两组前测接近(54 vs 55)。", trapType: "opposite" },
      { t: "prove inquiry is the only good method.", trap: "图表不支持这种绝对结论。", trapType: "too-extreme" },
    ], why: "探究组 55→78(+23)远高于讲授组 54→61(+7)。", difficulty: 3 },
  { title: "城市绿化前后街道气温", unit: "°C", bars: [{ label: "无树街道", value: 34 }, { label: "少量树", value: 31 }, { label: "浓密树荫", value: 27 }],
    blurb: "More tree cover was associated with ___",
    question: "Which choice best completes the text?",
    options: [
      { t: "lower street temperatures.", correct: true },
      { t: "higher street temperatures.", trap: "树越多气温越低。", trapType: "opposite" },
      { t: "no change in temperature.", trap: "34→27 有明显差异。", trapType: "opposite" },
      { t: "cooling the whole planet by itself.", trap: "夸大到全球尺度。", trapType: "too-extreme" },
    ], why: "34→31→27,树荫越密街道越凉。", difficulty: 1 },
];

type ConnItem = { word: string; sentence: string; answer: "+" | "-" | "0"; difficulty: number };
const CONNOTATION: ConnItem[] = [
  { word: "meticulous", sentence: "Her meticulous notes recorded every detail without error.", answer: "+", difficulty: 2 },
  { word: "stubborn", sentence: "He was too stubborn to ever admit he was wrong.", answer: "-", difficulty: 1 },
  { word: "resolute", sentence: "She stayed resolute even when everyone doubted her.", answer: "+", difficulty: 2 },
  { word: "cheap", sentence: "The furniture felt cheap and fell apart within a week.", answer: "-", difficulty: 1 },
  { word: "affordable", sentence: "The new model is affordable without sacrificing quality.", answer: "+", difficulty: 1 },
  { word: "average", sentence: "The average rainfall this month was about 40 millimeters.", answer: "0", difficulty: 1 },
  { word: "gregarious", sentence: "A gregarious host, she made every guest feel welcome.", answer: "+", difficulty: 3 },
  { word: "notorious", sentence: "The neighborhood was notorious for its crime.", answer: "-", difficulty: 2 },
  { word: "renowned", sentence: "The renowned scientist drew crowds to every lecture.", answer: "+", difficulty: 2 },
  { word: "shrewd", sentence: "Her shrewd investments doubled the fund in a year.", answer: "+", difficulty: 3 },
  { word: "cunning", sentence: "The cunning swindler tricked dozens of trusting clients.", answer: "-", difficulty: 2 },
  { word: "modest", sentence: "They lived in a modest house on a quiet street.", answer: "0", difficulty: 2 },
  { word: "arrogant", sentence: "His arrogant remarks alienated the entire team.", answer: "-", difficulty: 1 },
  { word: "confident", sentence: "She gave a confident, well-rehearsed presentation.", answer: "+", difficulty: 1 },
  { word: "reckless", sentence: "His reckless driving endangered everyone on the road.", answer: "-", difficulty: 1 },
  { word: "cautious", sentence: "A cautious planner, she prepared for every setback.", answer: "+", difficulty: 2 },
  { word: "frugal", sentence: "Being frugal, she saved enough to buy the house outright.", answer: "+", difficulty: 2 },
  { word: "stingy", sentence: "He was so stingy he refused to tip even good service.", answer: "-", difficulty: 2 },
  { word: "ordinary", sentence: "It was an ordinary Tuesday, nothing unusual happened.", answer: "0", difficulty: 1 },
  { word: "innovative", sentence: "Their innovative design won every award that year.", answer: "+", difficulty: 2 },
  { word: "obsolete", sentence: "The software is obsolete and no longer supported.", answer: "-", difficulty: 2 },
  { word: "ambitious", sentence: "Her ambitious plan inspired the whole community.", answer: "+", difficulty: 3 },
  { word: "ambitious", sentence: "The ambitious politician trampled anyone in his way.", answer: "-", difficulty: 3 },
  { word: "childlike", sentence: "She looked at the snow with childlike wonder.", answer: "+", difficulty: 3 },
  { word: "childish", sentence: "His childish sulking embarrassed the whole table.", answer: "-", difficulty: 2 },
  { word: "curious", sentence: "The curious student asked question after question.", answer: "+", difficulty: 1 },
  { word: "nosy", sentence: "Their nosy neighbor read everyone's mail.", answer: "-", difficulty: 1 },
  { word: "slender", sentence: "The dancer had a slender, graceful frame.", answer: "+", difficulty: 2 },
  { word: "scrawny", sentence: "The scrawny stray looked as if it hadn't eaten in days.", answer: "-", difficulty: 2 },
  { word: "thrifty", sentence: "A thrifty shopper, he compared prices before buying.", answer: "+", difficulty: 2 },
  { word: "gaudy", sentence: "The gaudy decorations clashed with everything in the room.", answer: "-", difficulty: 3 },
  { word: "quiet", sentence: "The library was quiet at that hour of the morning.", answer: "0", difficulty: 1 },
  { word: "meddlesome", sentence: "Her meddlesome relatives criticized every decision she made.", answer: "-", difficulty: 3 },
  { word: "diplomatic", sentence: "His diplomatic reply calmed both sides of the dispute.", answer: "+", difficulty: 2 },
  { word: "evasive", sentence: "The witness gave evasive, unhelpful answers.", answer: "-", difficulty: 2 },
  { word: "steady", sentence: "The patient's heartbeat held at a steady rhythm.", answer: "0", difficulty: 1 },
  { word: "vigilant", sentence: "The vigilant guard noticed the smoke at once.", answer: "+", difficulty: 2 },
  { word: "paranoid", sentence: "He grew paranoid, suspecting even his oldest friends.", answer: "-", difficulty: 2 },
  { word: "candid", sentence: "In a rare candid moment, she admitted her mistake.", answer: "+", difficulty: 2 },
  { word: "blunt", sentence: "His blunt criticism left the new writer in tears.", answer: "-", difficulty: 2 },
];

type GateItem = { kind: "redundancy" | "apostrophe"; before: string; after: string; doors: [string, string]; correctIndex: 0 | 1; why: string; difficulty: number };
const GATE_P5: GateItem[] = [
  { kind: "redundancy", before: "They agreed to meet at", after: "in the town square.", doors: ["12 noon", "noon"], correctIndex: 1, why: "noon 本身就是 12:00,'12 noon' 冗余。", difficulty: 2 },
  { kind: "redundancy", before: "Please", after: "the two files before sending.", doors: ["combine together", "combine"], correctIndex: 1, why: "combine 已含'一起','combine together' 冗余。", difficulty: 2 },
  { kind: "redundancy", before: "The result was a", after: "surprise to everyone.", doors: ["unexpected surprise", "surprise"], correctIndex: 1, why: "surprise 本就意外,'unexpected surprise' 冗余。", difficulty: 2 },
  { kind: "redundancy", before: "We need to", after: "the plan in advance.", doors: ["plan ahead", "plan"], correctIndex: 1, why: "plan 已含'提前',加 ahead/in advance 冗余。", difficulty: 3 },
  { kind: "redundancy", before: "She gave a brief", after: "of the main points.", doors: ["summary", "short summary"], correctIndex: 0, why: "summary 本就是简短概括,'short summary' 冗余。", difficulty: 2 },
  { kind: "redundancy", before: "The events happened at the", after: ".", doors: ["same identical time", "same time"], correctIndex: 1, why: "same 与 identical 同义,叠用冗余。", difficulty: 2 },
  { kind: "redundancy", before: "He returned the book and then", after: "it again later.", doors: ["revisited", "revisited again"], correctIndex: 0, why: "re- 已含'再','revisited again' 冗余。", difficulty: 3 },
  { kind: "redundancy", before: "The two designs are", after: "in every way.", doors: ["exactly identical", "identical"], correctIndex: 1, why: "identical 已是完全相同,'exactly identical' 冗余。", difficulty: 2 },
  { kind: "redundancy", before: "The final", after: "will be announced Friday.", doors: ["outcome", "end outcome"], correctIndex: 0, why: "outcome 本就是最终结果,'end outcome' 冗余。", difficulty: 2 },
  { kind: "redundancy", before: "Each student must", after: "cooperate with the group.", doors: ["mutually cooperate", "cooperate"], correctIndex: 1, why: "cooperate 已含'相互','mutually cooperate' 冗余。", difficulty: 3 },
  { kind: "redundancy", before: "They will", after: "the meeting to next week.", doors: ["postpone", "postpone until later"], correctIndex: 0, why: "postpone 已含'推迟到以后',加 until later 冗余。", difficulty: 3 },
  { kind: "redundancy", before: "A", after: "of history repeats itself here.", doors: ["past history", "history"], correctIndex: 1, why: "history 本就属于过去,'past history' 冗余。", difficulty: 2 },
  { kind: "apostrophe", before: "The", after: "tails wagged as they ran.", doors: ["dogs", "dogs'"], correctIndex: 1, why: "复数名词的所有格:多只狗的尾巴 → dogs'。", difficulty: 2 },
  { kind: "apostrophe", before: "That is the", after: "office at the end of the hall.", doors: ["manager's", "managers"], correctIndex: 0, why: "单数所有格:一位经理的办公室 → manager's。", difficulty: 1 },
  { kind: "apostrophe", before: "The two", after: "cars were both blue.", doors: ["sister's", "sisters'"], correctIndex: 1, why: "复数所有格:两个姐妹的车 → sisters'。", difficulty: 2 },
  { kind: "apostrophe", before: "The cat licked", after: "paw.", doors: ["its", "it's"], correctIndex: 0, why: "its 是所有格;it's = it is。这里指'它的爪子'。", difficulty: 2 },
  { kind: "apostrophe", before: "The", after: "decision surprised the whole class.", doors: ["teacher's", "teachers"], correctIndex: 0, why: "单数所有格:老师的决定 → teacher's。", difficulty: 1 },
  { kind: "apostrophe", before: "All the", after: "desks were cleaned overnight.", doors: ["student's", "students'"], correctIndex: 1, why: "复数所有格:所有学生的课桌 → students'。", difficulty: 2 },
  { kind: "apostrophe", before: "I think", after: "going to rain later.", doors: ["its", "it's"], correctIndex: 1, why: "it's = it is,'快要下雨了'。", difficulty: 2 },
  { kind: "apostrophe", before: "The", after: "wings were spread wide.", doors: ["bird's", "birds"], correctIndex: 0, why: "单数所有格:那只鸟的翅膀 → bird's。", difficulty: 1 },
  { kind: "apostrophe", before: "The", after: "uniforms were navy blue.", doors: ["players'", "players"], correctIndex: 0, why: "复数所有格:队员们的队服 → players'。", difficulty: 2 },
  { kind: "apostrophe", before: "This is my", after: "house, not mine.", doors: ["parents'", "parents"], correctIndex: 0, why: "复数所有格:父母的房子 → parents'。", difficulty: 2 },
  { kind: "apostrophe", before: "The company changed", after: "logo last year.", doors: ["its", "it's"], correctIndex: 0, why: "所有格 its:公司的标志。", difficulty: 2 },
  { kind: "apostrophe", before: "The", after: "handle had broken off.", doors: ["kettle's", "kettles"], correctIndex: 0, why: "单数所有格:水壶的把手 → kettle's。", difficulty: 1 },
];

async function main() {
  await prisma.gameItem.deleteMany({ where: { gameType: "graphic" } });
  for (const g of GRAPHIC) {
    const { difficulty, ...payload } = g;
    await prisma.gameItem.create({ data: { gameType: "graphic", domain: "info_ideas", difficulty, payload, explanation: g.why } });
  }
  console.log(`graphic: ${GRAPHIC.length}`);

  await prisma.gameItem.deleteMany({ where: { gameType: "connotation" } });
  for (const c of CONNOTATION) {
    const { difficulty, ...payload } = c;
    await prisma.gameItem.create({ data: { gameType: "connotation", domain: "words_in_context", difficulty, payload } });
  }
  console.log(`connotation: ${CONNOTATION.length}`);

  // Gate Run 深化:追加(不清空既有),用 [p5] 标识以便幂等
  await prisma.gameItem.deleteMany({ where: { gameType: "gate_run", explanation: { startsWith: "[p5]" } } });
  for (const g of GATE_P5) {
    const { difficulty, ...payload } = g;
    await prisma.gameItem.create({ data: { gameType: "gate_run", domain: "expression_conventions", difficulty, payload, explanation: `[p5] ${g.why}` } });
  }
  console.log(`gate_run +${GATE_P5.length} (redundancy/apostrophe)`);

  console.log("P5 seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
