// P1 内容脚本:①把 read_the_green 现有题的 trapType 从旧 3 类细化到 8 类(就地覆盖,只改 options.trapType);
// ②插入 Trap Spotter 专项题(重点堆虚假比较 / 极端措辞)。
// ⚠️ 不触碰 paraphrase/trim/closer 的既有内容与已重标注的 difficulty。幂等。
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type TrapType =
  | "same-word" | "opposite" | "out-of-scope" | "too-narrow"
  | "too-extreme" | "fictitious-comparison" | "non-sequitur" | "tone-mismatch";

// 从 trap 说明文本细化陷阱类型(顺序:先具体后笼统)
function deriveTrapType(trap?: string): TrapType | undefined {
  if (!trap) return undefined;
  const t = trap.toLowerCase();
  if (/fictitious|comparison|compares|no comparison|造出|虚假比较|没有比较/.test(t)) return "fictitious-comparison";
  if (/\ball\b|\balways\b|\bnever\b|\bnone\b|\bevery\b|certainly|entirely|completely|impossible|绝对|极端|全部|从不/.test(t)) return "too-extreme";
  if (/opposite|contradict|reverse|相反|颠倒/.test(t)) return "opposite";
  if (/too narrow|one detail|only one detail|以偏概全|一个细节/.test(t)) return "too-narrow";
  if (/\btone\b|\bmood\b|基调|色调/.test(t)) return "tone-mismatch";
  if (/non ?sequitur|unwarranted|does not follow|不当推理|跳步/.test(t)) return "non-sequitur";
  if (/not stated|not supported|never mention|no mention|nothing in|doesn't|does not|out of scope|没提|未提|无此|原文没有|外部知识/.test(t)) return "out-of-scope";
  if (/same word|the same|copy|copy-?paste|同词|原词|照搬/.test(t)) return "same-word";
  return undefined;
}

type SpotItem = { passage?: string; question: string; option: string; verdict: "correct" | TrapType };

// Trap Spotter 专项题:虚假比较 / 极端措辞为主,兼顾其他类型与「正确答案」
const TRAP_SPOTTER_ITEMS: SpotItem[] = [
  // —— 虚假比较(fictitious comparison)——
  { passage: "The study measured reaction times in both well-rested and sleep-deprived drivers.", question: "为什么这个选项不对?", option: "Sleep-deprived drivers are more dangerous than drunk drivers.", verdict: "fictitious-comparison" },
  { passage: "Researchers surveyed how often teens and adults use a certain app.", question: "为什么这个选项不对?", option: "Teens value the app more than they value their friendships.", verdict: "fictitious-comparison" },
  { passage: "The passage describes the nesting habits of two owl species.", question: "为什么这个选项不对?", option: "The first species is a better parent than the second.", verdict: "fictitious-comparison" },
  { passage: "The author explains how solar and wind power each generate electricity.", question: "为什么这个选项不对?", option: "Solar power is more reliable than any other energy source.", verdict: "fictitious-comparison" },
  { passage: "The text reports the yields of a crop under two irrigation methods.", question: "为什么这个选项不对?", option: "Drip irrigation is more environmentally friendly than crop rotation.", verdict: "fictitious-comparison" },
  { passage: "A historian describes the trade routes of two ancient cities.", question: "为什么这个选项不对?", option: "The eastern city was wealthier than any city in history.", verdict: "fictitious-comparison" },
  { passage: "The study compared memory scores after reading on paper versus on screen.", question: "为什么这个选项不对?", option: "Reading on paper is more valuable than reading itself.", verdict: "fictitious-comparison" },
  { passage: "The passage discusses two theories explaining a bird's migration.", question: "为什么这个选项不对?", option: "The magnetic theory is more scientific than the star-navigation theory.", verdict: "fictitious-comparison" },
  { passage: "The article notes that the museum added both a sculpture wing and a film archive.", question: "为什么这个选项不对?", option: "Visitors prefer sculpture to film more than curators do.", verdict: "fictitious-comparison" },
  { passage: "The report lists the costs of two public transit proposals.", question: "为什么这个选项不对?", option: "The bus plan is a wiser investment than education spending.", verdict: "fictitious-comparison" },
  // —— 极端措辞(too extreme)——
  { passage: "The findings suggest that moderate exercise may reduce stress for some people.", question: "为什么这个选项不对?", option: "Exercise always eliminates stress in everyone.", verdict: "too-extreme" },
  { passage: "The author argues that the policy could help small businesses in certain regions.", question: "为什么这个选项不对?", option: "The policy will guarantee success for every small business.", verdict: "too-extreme" },
  { passage: "Data indicate a slight upward trend in rainfall over the decade.", question: "为什么这个选项不对?", option: "Rainfall increases every single year without exception.", verdict: "too-extreme" },
  { passage: "The scientist notes that the drug appears promising in early trials.", question: "为什么这个选项不对?", option: "The drug is certain to cure the disease completely.", verdict: "too-extreme" },
  { passage: "The essay claims that reading fiction can build empathy.", question: "为什么这个选项不对?", option: "Only people who read fiction are ever capable of empathy.", verdict: "too-extreme" },
  { passage: "The historian suggests the treaty likely contributed to the peace.", question: "为什么这个选项不对?", option: "The treaty was the sole cause of all peace that followed.", verdict: "too-extreme" },
  { passage: "The passage says the new method tends to be faster in most cases.", question: "为什么这个选项不对?", option: "The new method is always faster in absolutely all situations.", verdict: "too-extreme" },
  { passage: "The author observes that bees are important for many crops.", question: "为什么这个选项不对?", option: "Without bees, no plant on Earth could ever survive.", verdict: "too-extreme" },
  { passage: "Researchers found that the tutoring program helped some struggling students.", question: "为什么这个选项不对?", option: "The program raises the grade of every student it touches.", verdict: "too-extreme" },
  // —— 与原文相反(opposite)——
  { passage: "As otters vanish, sea urchins multiply and strip the kelp bare.", question: "为什么这个选项不对?", option: "More otters lead to fewer kelp forests.", verdict: "opposite" },
  { passage: "The bike lane drew people who had been walking or taking the bus, not former drivers.", question: "为什么这个选项不对?", option: "The lane was used mainly by people who used to drive.", verdict: "opposite" },
  { passage: "Critics praised the film for its restraint rather than its spectacle.", question: "为什么这个选项不对?", option: "Critics admired the film chiefly for its spectacle.", verdict: "opposite" },
  { passage: "Seawater actually strengthens the ancient Roman concrete.", question: "为什么这个选项不对?", option: "Seawater causes Roman concrete to crumble quickly.", verdict: "opposite" },
  // —— 未提及 / 需外部知识(out of scope)——
  { passage: "The passage describes how a keystone species shapes its ecosystem.", question: "为什么这个选项不对?", option: "Kelp can only grow in very cold water.", verdict: "out-of-scope" },
  { passage: "Maya reread the acceptance letter, certain she'd had no real chance.", question: "为什么这个选项不对?", option: "She had applied to many other programs as well.", verdict: "out-of-scope" },
  { passage: "The article explains a startup's ten-minute grocery delivery model.", question: "为什么这个选项不对?", option: "Customers disliked how the drivers were dressed.", verdict: "out-of-scope" },
  { passage: "The text discusses the surveyor's decade of correcting sea charts.", question: "为什么这个选项不对?", option: "The surveyor later became a famous ship captain.", verdict: "out-of-scope" },
  // —— 同词复述(same word)——
  { passage: "The coach benched the star player to protect a minor injury.", question: "这个选项复述了题干却没回答'为什么',属于哪类?", option: "The coach benched his star player during the game.", verdict: "same-word" },
  { passage: "Analysts questioned whether the model could ever turn a profit.", question: "这个选项照搬原词却答非所问,属于哪类?", option: "Analysts built tiny warehouses in dense neighborhoods.", verdict: "same-word" },
  { passage: "The librarian noticed students avoided the dim, stiff-chaired reading room.", question: "这个选项照搬原词却不是原因,属于哪类?", option: "The reading room was on the top floor of the library.", verdict: "same-word" },
  // —— 以偏概全(too narrow)——
  { passage: "Otters eat urchins; where otters thrive, kelp forests shelter hundreds of species.", question: "作为'全文主旨',这个选项属于哪类?", option: "Otters eat many different sea creatures.", verdict: "too-narrow" },
  { passage: "The essay surveys the causes, spread, and lasting effects of a famine.", question: "作为'全文主旨',这个选项属于哪类?", option: "The famine began after one poor harvest.", verdict: "too-narrow" },
  { passage: "The article covers the invention, adoption, and social impact of the printing press.", question: "作为'全文主旨',这个选项属于哪类?", option: "The printing press used movable metal type.", verdict: "too-narrow" },
  // —— 不当推理(non sequitur)——
  { passage: "The city added a bike lane, and cycling trips nearly doubled within a year.", question: "为什么这个推断不对?", option: "Therefore, bike lanes make cities wealthier.", verdict: "non-sequitur" },
  { passage: "Students who study in quiet rooms tend to score slightly higher.", question: "为什么这个推断不对?", option: "So silence is the only thing that determines test scores.", verdict: "non-sequitur" },
  { passage: "A composer turned to huge symphonies late in life, around the time of his deafness.", question: "为什么这个推断不对?", option: "Thus deafness must improve a person's musical talent.", verdict: "non-sequitur" },
  // —— 基调不符(tone mismatch)——
  { passage: "The author calls the plan 'well-meaning but hopelessly impractical.'", question: "为什么这个选项不对?", option: "The author is enthusiastic and fully endorses the plan.", verdict: "tone-mismatch" },
  { passage: "The reviewer describes the sequel as 'a tired, joyless retread.'", question: "为什么这个选项不对?", option: "The reviewer's tone toward the sequel is admiring.", verdict: "tone-mismatch" },
  // —— 正确答案(correct)——
  { passage: "Sea otters protect kelp forests by eating the urchins that would strip them bare.", question: "这个选项对吗?", option: "Otters indirectly help whole kelp ecosystems survive.", verdict: "correct" },
  { passage: "'Certain she had no real chance,' Maya reread the acceptance letter in disbelief.", question: "这个选项对吗?", option: "Maya had not expected to be accepted.", verdict: "correct" },
  { passage: "The lane mainly drew former walkers and bus riders, while car traffic fell only slightly.", question: "这个选项对吗?", option: "The lane shifted existing non-drivers to cycling rather than cutting car use.", verdict: "correct" },
  { passage: "Seawater actually strengthens the Roman concrete mix over time.", question: "这个选项对吗?", option: "Exposure to seawater makes Roman concrete more durable.", verdict: "correct" },
  { passage: "The report made the environmental harm seem smaller than it really was.", question: "这个选项对吗?", option: "The report understated the damage.", verdict: "correct" },
  { passage: "Critics praised the film's restraint over its spectacle.", question: "这个选项对吗?", option: "Reviewers valued the film's understatement more than its flashiness.", verdict: "correct" },
];

async function main() {
  // ① 细化 read_the_green 的 trapType(跳过人工标注的 [enh] 精选题;只覆盖 options.trapType)
  const rtg = await prisma.gameItem.findMany({ where: { gameType: "read_the_green" } });
  let refined = 0;
  for (const it of rtg) {
    if (it.explanation?.startsWith("[enh]")) continue;
    const p = it.payload as { options?: { correct?: boolean; trap?: string; trapType?: string }[] } | null;
    if (!p?.options) continue;
    let changed = false;
    const options = p.options.map((o) => {
      if (o.correct) return o;
      const tt = deriveTrapType(o.trap);
      if (tt && tt !== o.trapType) {
        changed = true;
        return { ...o, trapType: tt };
      }
      return o;
    });
    if (changed) {
      await prisma.gameItem.update({ where: { id: it.id }, data: { payload: { ...p, options } } });
      refined++;
    }
  }
  console.log(`read_the_green trapType refined: ${refined}/${rtg.length}`);

  // ② 插入 Trap Spotter 专项题
  await prisma.gameItem.deleteMany({ where: { gameType: "trap_spotter" } });
  for (const item of TRAP_SPOTTER_ITEMS) {
    await prisma.gameItem.create({
      data: { gameType: "trap_spotter", domain: "info_ideas", difficulty: 3, payload: item },
    });
  }
  console.log(`trap_spotter: ${TRAP_SPOTTER_ITEMS.length}`);

  console.log("P1 seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
