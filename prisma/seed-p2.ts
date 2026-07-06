// P2 内容脚本:Morphology 拆词游戏。只插入 gameType=morphology。幂等。
// 词法逐一核对:segments 拼接必须 === word。
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type Segment = { text: string; kind: "prefix" | "root" | "suffix"; gloss: string };
type MorphItem = {
  word: string;
  segments: Segment[];
  pos: "noun" | "verb" | "adjective" | "adverb";
  meaning: string;
  distractors: string[];
  connotation: "+" | "-" | "0";
  difficulty: number;
};

const P = (text: string, gloss: string): Segment => ({ text, kind: "prefix", gloss });
const R = (text: string, gloss: string): Segment => ({ text, kind: "root", gloss });
const S = (text: string, gloss: string): Segment => ({ text, kind: "suffix", gloss });

const WORDS: MorphItem[] = [
  { word: "unchangeable", segments: [P("un", "不"), R("change", "改变"), S("able", "能…的(形)")], pos: "adjective", meaning: "无法改变的", distractors: ["容易改变的", "经常变化的", "值得改变的"], connotation: "0", difficulty: 1 },
  { word: "incontrovertible", segments: [P("in", "不"), P("contro", "反对"), R("vert", "转"), S("ible", "能…的(形)")], pos: "adjective", meaning: "无可辩驳的、确凿的", distractors: ["有争议的", "可以反驳的", "含糊不清的"], connotation: "+", difficulty: 4 },
  { word: "metamorphosis", segments: [P("meta", "变"), R("morph", "形状"), S("osis", "过程(名)")], pos: "noun", meaning: "彻底的变形过程", distractors: ["一段短暂的睡眠", "一种昆虫的名字", "形状的测量"], connotation: "0", difficulty: 3 },
  { word: "intolerant", segments: [P("in", "不"), R("toler", "忍受"), S("ant", "…的(形)")], pos: "adjective", meaning: "不能容忍的、狭隘武断的", distractors: ["非常有耐心的", "身体虚弱的", "乐于助人的"], connotation: "-", difficulty: 2 },
  { word: "benevolent", segments: [P("bene", "好"), R("vol", "意愿"), S("ent", "…的(形)")], pos: "adjective", meaning: "仁慈的、乐善好施的", distractors: ["心怀恶意的", "冷漠无情的", "贪得无厌的"], connotation: "+", difficulty: 3 },
  { word: "malevolent", segments: [P("male", "坏"), R("vol", "意愿"), S("ent", "…的(形)")], pos: "adjective", meaning: "恶毒的、心怀恶意的", distractors: ["善良友好的", "无关紧要的", "才华横溢的"], connotation: "-", difficulty: 3 },
  { word: "innovation", segments: [P("in", "进入"), R("nov", "新"), S("ation", "过程(名)")], pos: "noun", meaning: "创新、革新", distractors: ["古老的传统", "一次失败", "重复的动作"], connotation: "+", difficulty: 2 },
  { word: "novice", segments: [R("nov", "新"), S("ice", "人(名)")], pos: "noun", meaning: "新手、初学者", distractors: ["专家、老手", "一种饮料", "领导者"], connotation: "0", difficulty: 2 },
  { word: "retrospect", segments: [P("retro", "向后"), R("spect", "看")], pos: "noun", meaning: "回顾、追溯", distractors: ["对未来的预测", "近距离观察", "一种望远镜"], connotation: "0", difficulty: 2 },
  { word: "introspection", segments: [P("intro", "向内"), R("spect", "看"), S("ion", "名词")], pos: "noun", meaning: "自省、内省", distractors: ["对他人的观察", "户外探险", "公开演讲"], connotation: "0", difficulty: 3 },
  { word: "circumscribe", segments: [P("circum", "环绕"), R("scribe", "写/画")], pos: "verb", meaning: "限制、圈定范围", distractors: ["自由扩张", "大声朗读", "彻底删除"], connotation: "0", difficulty: 3 },
  { word: "inscribe", segments: [P("in", "在…上"), R("scribe", "写/刻")], pos: "verb", meaning: "题写、镌刻", distractors: ["擦除", "翻译", "购买"], connotation: "0", difficulty: 2 },
  { word: "prescribe", segments: [P("pre", "预先"), R("scribe", "写")], pos: "verb", meaning: "开处方、规定", distractors: ["禁止", "描述外貌", "随意涂鸦"], connotation: "0", difficulty: 2 },
  { word: "transport", segments: [P("trans", "跨越"), R("port", "运/搬")], pos: "verb", meaning: "运输、运送", distractors: ["储存不动", "毁坏", "购买"], connotation: "0", difficulty: 1 },
  { word: "export", segments: [P("ex", "向外"), R("port", "运/搬")], pos: "verb", meaning: "出口(货物)", distractors: ["进口货物", "隐藏财物", "计算数量"], connotation: "0", difficulty: 1 },
  { word: "audible", segments: [R("aud", "听"), S("ible", "能…的(形)")], pos: "adjective", meaning: "听得见的", distractors: ["看得见的", "无法听到的", "可食用的"], connotation: "0", difficulty: 1 },
  { word: "inaudible", segments: [P("in", "不"), R("aud", "听"), S("ible", "能…的(形)")], pos: "adjective", meaning: "听不见的", distractors: ["非常响亮的", "清晰可读的", "看得见的"], connotation: "0", difficulty: 2 },
  { word: "credible", segments: [R("cred", "相信"), S("ible", "能…的(形)")], pos: "adjective", meaning: "可信的、可靠的", distractors: ["荒谬的", "看不见的", "违法的"], connotation: "+", difficulty: 2 },
  { word: "incredible", segments: [P("in", "不"), R("cred", "相信"), S("ible", "能…的(形)")], pos: "adjective", meaning: "难以置信的、了不起的", distractors: ["平淡无奇的", "完全可信的", "微不足道的"], connotation: "+", difficulty: 2 },
  { word: "revive", segments: [P("re", "再次"), R("vive", "活")], pos: "verb", meaning: "复活、复兴", distractors: ["彻底摧毁", "使入睡", "遗忘"], connotation: "+", difficulty: 2 },
  { word: "survive", segments: [P("sur", "越过"), R("vive", "活")], pos: "verb", meaning: "幸存、存活下来", distractors: ["死亡", "逃跑", "投降"], connotation: "+", difficulty: 1 },
  { word: "intervene", segments: [P("inter", "在…之间"), R("vene", "来")], pos: "verb", meaning: "干预、介入", distractors: ["置身事外", "同时到达", "彻底离开"], connotation: "0", difficulty: 3 },
  { word: "convene", segments: [P("con", "共同"), R("vene", "来")], pos: "verb", meaning: "召集、集会", distractors: ["解散", "独自离开", "拒绝出席"], connotation: "0", difficulty: 3 },
  { word: "illegible", segments: [P("il", "不"), R("leg", "读"), S("ible", "能…的(形)")], pos: "adjective", meaning: "难以辨认的、字迹潦草的", distractors: ["清晰易读的", "合法的", "响亮的"], connotation: "-", difficulty: 3 },
  { word: "immortal", segments: [P("im", "不"), R("mort", "死"), S("al", "…的(形)")], pos: "adjective", meaning: "不朽的、永生的", distractors: ["很快死去的", "道德高尚的", "移动的"], connotation: "+", difficulty: 2 },
  { word: "immature", segments: [P("im", "不"), R("mature", "成熟")], pos: "adjective", meaning: "不成熟的、幼稚的", distractors: ["完全成熟的", "巨大的", "危险的"], connotation: "-", difficulty: 1 },
  { word: "benefactor", segments: [P("bene", "好"), R("fact", "做/造"), S("or", "人(名)")], pos: "noun", meaning: "捐助者、恩人", distractors: ["受益人", "工厂工人", "对手"], connotation: "+", difficulty: 3 },
  { word: "contradict", segments: [P("contra", "反对"), R("dict", "说")], pos: "verb", meaning: "反驳、与…矛盾", distractors: ["表示赞同", "预测未来", "大声重复"], connotation: "0", difficulty: 2 },
  { word: "predict", segments: [P("pre", "预先"), R("dict", "说")], pos: "verb", meaning: "预言、预测", distractors: ["回忆过去", "禁止", "翻译"], connotation: "0", difficulty: 1 },
  { word: "dehydrate", segments: [P("de", "去除"), R("hydr", "水"), S("ate", "使…(动)")], pos: "verb", meaning: "使脱水、使干燥", distractors: ["加水稀释", "加热煮沸", "冷冻保存"], connotation: "-", difficulty: 3 },
  { word: "synchronize", segments: [P("syn", "共同"), R("chron", "时间"), S("ize", "使…(动)")], pos: "verb", meaning: "使同步、同时发生", distractors: ["拖延时间", "分开进行", "计时"], connotation: "0", difficulty: 3 },
  { word: "anonymous", segments: [P("an", "无"), R("onym", "名字"), S("ous", "…的(形)")], pos: "adjective", meaning: "匿名的、无名的", distractors: ["署名的", "著名的", "唯一的"], connotation: "0", difficulty: 2 },
  { word: "antagonist", segments: [P("ant", "反对"), R("agon", "斗争"), S("ist", "人(名)")], pos: "noun", meaning: "对手、反派", distractors: ["盟友", "旁观者", "主角的助手"], connotation: "-", difficulty: 3 },
  { word: "philanthropy", segments: [R("phil", "爱"), R("anthrop", "人类"), S("y", "名词")], pos: "noun", meaning: "慈善、博爱", distractors: ["对人类的憎恨", "对自然的研究", "个人的野心"], connotation: "+", difficulty: 4 },
  { word: "omnipotent", segments: [P("omni", "全部"), R("potent", "力量")], pos: "adjective", meaning: "全能的、无所不能的", distractors: ["软弱无力的", "无所不在的", "一无所知的"], connotation: "0", difficulty: 4 },
  { word: "disharmony", segments: [P("dis", "不/无"), R("harmony", "和谐")], pos: "noun", meaning: "不和谐、不和", distractors: ["完美的一致", "响亮的音乐", "安静的环境"], connotation: "-", difficulty: 2 },
];

async function main() {
  // 断言:segments 拼接 === word
  for (const w of WORDS) {
    const joined = w.segments.map((s) => s.text).join("");
    if (joined !== w.word) throw new Error(`拆分不匹配: ${w.word} != ${joined}`);
  }

  await prisma.gameItem.deleteMany({ where: { gameType: "morphology" } });
  for (const w of WORDS) {
    const { difficulty, ...payload } = w;
    await prisma.gameItem.create({
      data: { gameType: "morphology", domain: "words_in_context", difficulty, payload },
    });
  }
  console.log(`morphology: ${WORDS.length}`);
  console.log("P2 seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
