// P3 内容脚本:Inference 推断题。只插入 gameType=inference。幂等。
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type TrapType =
  | "same-word" | "opposite" | "out-of-scope" | "too-narrow"
  | "too-extreme" | "fictitious-comparison" | "non-sequitur" | "tone-mismatch";
type ExOpt = { t: string; correct?: boolean };
type Opt = { t: string; correct?: boolean; trap?: string; trapType?: TrapType };
type InfItem = { text: string; exigenceOptions: ExOpt[]; options: Opt[]; why: string; difficulty: number };

const ITEMS: InfItem[] = [
  {
    text: "Snow leopards live at extreme altitudes where oxygen is scarce and prey is rare. Adapting to such cold carries a high metabolic cost, so few species can survive there at all. This suggests that snow leopards likely moved to these harsh heights because ___",
    exigenceOptions: [
      { t: "解释为什么很少有物种能在高寒地带生存，以及雪豹为何在那里", correct: true },
      { t: "证明雪豹是世界上最强壮的猫科动物" },
      { t: "描述高山的美丽风景" },
    ],
    options: [
      { t: "they were pushed out of warmer, more competitive habitats below.", correct: true },
      { t: "they always prefer cold over warmth in every situation.", trap: "原文没说它们偏爱寒冷，只说被迫适应。", trapType: "too-extreme" },
      { t: "the cold makes every animal there stronger.", trap: "由'代价高'推不出'使动物更强'。", trapType: "non-sequitur" },
      { t: "high altitudes have the most oxygen of any habitat.", trap: "与'oxygen is scarce'直接相反。", trapType: "opposite" },
    ],
    why: "低处竞争激烈，雪豹体型和力量不占优，被迫上迁到少有对手的高寒地带。",
    difficulty: 3,
  },
  {
    text: "The museum kept its rarest manuscripts in a dim basement, and few visitors ever saw them. After the collection was digitized and posted online, views rose into the millions. The library concluded that the manuscripts' earlier obscurity was mainly due to ___",
    exigenceOptions: [
      { t: "解释这些手稿此前少有人看的原因", correct: true },
      { t: "证明纸质手稿比数字版更有价值" },
      { t: "介绍地下室的建筑结构" },
    ],
    options: [
      { t: "limited physical access rather than a lack of public interest.", correct: true },
      { t: "the manuscripts being kept in a dim basement.", trap: "照搬原文措辞，没解释'为何少人看'的深层原因。", trapType: "same-word" },
      { t: "the public having no interest in old manuscripts at all.", trap: "线上百万浏览恰恰相反。", trapType: "opposite" },
      { t: "poor lighting permanently damaging the documents.", trap: "原文没提损坏。", trapType: "out-of-scope" },
    ],
    why: "数字化后浏览暴涨，说明此前障碍是'看不到'（访问受限），而非'没人想看'。",
    difficulty: 3,
  },
  {
    text: "A new bike lane opened downtown, and within a year cycling trips nearly doubled while car traffic fell only slightly. Researchers found most new cyclists had previously walked or taken the bus. They inferred that the lane mainly ___",
    exigenceOptions: [
      { t: "说明新增骑行者主要来自哪一群人", correct: true },
      { t: "论证汽车应当被完全禁止" },
      { t: "比较各城市的自行车道长度" },
    ],
    options: [
      { t: "drew people away from walking and buses rather than from driving.", correct: true },
      { t: "eliminated nearly all car traffic downtown.", trap: "原文说汽车流量只是略降。", trapType: "opposite" },
      { t: "proved bike lanes make every city healthier.", trap: "以偏概全的绝对结论。", trapType: "too-extreme" },
      { t: "was mostly used by former drivers.", trap: "与'previously walked or took the bus'矛盾。", trapType: "opposite" },
    ],
    why: "新骑行者多是原本步行/坐公交的人，所以自行车道主要分流了非驾车者。",
    difficulty: 2,
  },
  {
    text: "Ancient Roman concrete has survived two thousand years of pounding waves, while much modern concrete crumbles within decades. Researchers recently found that seawater triggers new mineral growth inside the Roman mix. This finding implies that, for the Romans' material, exposure to seawater ___",
    exigenceOptions: [
      { t: "解释海水如何影响罗马混凝土的耐久性", correct: true },
      { t: "证明现代工程师都很懒惰" },
      { t: "描述罗马帝国的海军历史" },
    ],
    options: [
      { t: "actually made the structure stronger over time.", correct: true },
      { t: "caused it to crumble within decades.", trap: "那是现代混凝土的情况。", trapType: "opposite" },
      { t: "had no effect on the material whatsoever.", trap: "与'triggers new mineral growth'相反。", trapType: "opposite" },
      { t: "made it cheaper than any other building material.", trap: "原文没谈成本或比较。", trapType: "fictitious-comparison" },
    ],
    why: "海水在罗马配方里催生新矿物，反而使其随时间更坚固。",
    difficulty: 3,
  },
  {
    text: "The startup promised ten-minute grocery delivery by building tiny warehouses in crowded neighborhoods. Analysts noted the model burned cash on rent and staff for every order. Within a year the company quietly lengthened its delivery windows, suggesting that the original promise had proven ___",
    exigenceOptions: [
      { t: "暗示十分钟送达的承诺难以为继", correct: true },
      { t: "证明顾客不喜欢买菜" },
      { t: "介绍仓库的货架布局" },
    ],
    options: [
      { t: "too costly to sustain at scale.", correct: true },
      { t: "wildly profitable from the start.", trap: "与'burned cash'相反。", trapType: "opposite" },
      { t: "impossible for any delivery company ever to attempt.", trap: "过度绝对。", trapType: "too-extreme" },
      { t: "unpopular because customers disliked fast delivery.", trap: "原文没提顾客不喜欢快送。", trapType: "out-of-scope" },
    ],
    why: "延长送达时间 + 每单烧钱，说明十分钟承诺成本太高、难以维持。",
    difficulty: 3,
  },
  {
    text: "For most of his career the composer wrote intimate chamber pieces. Late in life, around the time his hearing began to fail, he suddenly turned to vast symphonies for huge orchestras. Some scholars therefore propose that his shift in scale was connected to ___",
    exigenceOptions: [
      { t: "为作曲家晚年风格骤变提出一种解释", correct: true },
      { t: "证明室内乐比交响乐更高级" },
      { t: "列出他所有作品的名称" },
    ],
    options: [
      { t: "changes in how he experienced sound as his hearing declined.", correct: true },
      { t: "his deafness, which clearly improved his talent.", trap: "由时间相关推不出'耳聋提升才华'。", trapType: "non-sequitur" },
      { t: "chamber music being easier than symphonies.", trap: "原文未作难易比较。", trapType: "fictitious-comparison" },
      { t: "his complete loss of interest in music.", trap: "他反而写了更宏大的作品。", trapType: "opposite" },
    ],
    why: "风格骤变与听力衰退在时间上吻合，学者据此推测二者相关。",
    difficulty: 3,
  },
  {
    text: "A city study found that students who slept at least eight hours scored slightly higher on tests than those who slept less. The authors cautioned that many other factors also affect scores. A reasonable conclusion is that adequate sleep ___",
    exigenceOptions: [
      { t: "谨慎地说明睡眠与成绩之间的关系", correct: true },
      { t: "断言睡眠是成绩的唯一决定因素" },
      { t: "介绍学校的作息时间表" },
    ],
    options: [
      { t: "may contribute to somewhat better performance.", correct: true },
      { t: "is the single cause of all high test scores.", trap: "作者明确说还有很多其他因素。", trapType: "too-extreme" },
      { t: "has no relationship to test performance.", trap: "与'scored slightly higher'相反。", trapType: "opposite" },
      { t: "matters more than intelligence itself.", trap: "原文未与智力比较。", trapType: "fictitious-comparison" },
    ],
    why: "作者用'slightly'并提醒有其他因素，故只能说充足睡眠'可能'略有帮助。",
    difficulty: 2,
  },
  {
    text: "The essay observes that reading literary fiction often asks readers to inhabit minds unlike their own. Studies it cites link such reading to modest gains in recognizing others' emotions. The author suggests that fiction can, in this limited way, ___",
    exigenceOptions: [
      { t: "说明文学阅读对理解他人情感的有限益处", correct: true },
      { t: "证明只有读小说的人才有同理心" },
      { t: "比较小说与诗歌的销量" },
    ],
    options: [
      { t: "help cultivate empathy for people different from oneself.", correct: true },
      { t: "make readers the only people capable of empathy.", trap: "'only...ever'式绝对化，原文说的是有限益处。", trapType: "too-extreme" },
      { t: "reduce a reader's ability to understand others.", trap: "与'gains in recognizing emotions'相反。", trapType: "opposite" },
      { t: "outsell every other kind of book.", trap: "原文没谈销量。", trapType: "out-of-scope" },
    ],
    why: "作者用'modest''limited'限定，强调小说在有限程度上培养同理心。",
    difficulty: 3,
  },
  {
    text: "A coastal town banned certain fishing nets after fish counts collapsed. Three years later, surveys showed several species returning to numbers not seen in a generation. Officials took this as evidence that the earlier decline had been driven largely by ___",
    exigenceOptions: [
      { t: "推断此前鱼群锐减的主要原因", correct: true },
      { t: "证明该镇渔民很懒" },
      { t: "描述渔网的编织工艺" },
    ],
    options: [
      { t: "the fishing practices the ban had targeted.", correct: true },
      { t: "the town banning certain fishing nets.", trap: "照搬措辞，倒果为因。", trapType: "same-word" },
      { t: "a permanent, unstoppable extinction event.", trap: "鱼群回升与'永久灭绝'矛盾。", trapType: "opposite" },
      { t: "changes in ocean temperature the passage never mentions.", trap: "原文未提水温。", trapType: "out-of-scope" },
    ],
    why: "禁网后鱼群回升，说明此前锐减主要由被禁的捕捞方式造成。",
    difficulty: 2,
  },
  {
    text: "The report notes that the tutoring program raised the grades of some struggling students but left others unchanged. It stresses that results varied by attendance. A careful reader would conclude that the program ___",
    exigenceOptions: [
      { t: "客观说明辅导项目的效果因人而异", correct: true },
      { t: "宣称该项目对每个学生都有效" },
      { t: "介绍辅导老师的招聘流程" },
    ],
    options: [
      { t: "helped some students, with results tied to how often they attended.", correct: true },
      { t: "guaranteed higher grades for every participant.", trap: "原文说有些学生无变化。", trapType: "too-extreme" },
      { t: "harmed the students who took part.", trap: "与'raised the grades of some'相反。", trapType: "opposite" },
      { t: "worked better than hiring more teachers.", trap: "原文未作此比较。", trapType: "fictitious-comparison" },
    ],
    why: "效果因出勤而异、部分学生无变化，故只能说'帮助了一部分人'。",
    difficulty: 2,
  },
  {
    text: "Early maps of the coast were riddled with errors, yet sailors used them because nothing better existed. A young surveyor then spent a decade correcting the charts foot by foot, and shipwrecks in the region soon dropped sharply. The passage implies that many earlier wrecks had been caused by ___",
    exigenceOptions: [
      { t: "推断此前许多海难的成因", correct: true },
      { t: "证明这位测绘员是史上最伟大的水手" },
      { t: "描述海岸线的地质构造" },
    ],
    options: [
      { t: "the inaccuracies in the old charts sailors relied on.", correct: true },
      { t: "the surveyor's decade of corrections.", trap: "那是解决办法，不是海难成因。", trapType: "non-sequitur" },
      { t: "sailors refusing to use any maps at all.", trap: "原文说他们一直在用旧图。", trapType: "opposite" },
      { t: "storms that the passage does not discuss.", trap: "原文未提风暴。", trapType: "out-of-scope" },
    ],
    why: "修正海图后海难骤减，反推此前多因旧图错误而失事。",
    difficulty: 3,
  },
  {
    text: "The article explains that bees pollinate a large share of the crops humans eat. It adds that other animals and even wind pollinate many plants too. A balanced reading is that, while bees are important, ___",
    exigenceOptions: [
      { t: "平衡地说明蜜蜂重要但并非唯一的授粉者", correct: true },
      { t: "证明没有蜜蜂地球上所有植物都会死" },
      { t: "介绍蜂蜜的制作过程" },
    ],
    options: [
      { t: "they are not the only means by which plants are pollinated.", correct: true },
      { t: "no plant on Earth could survive without them.", trap: "原文说还有其他授粉方式。", trapType: "too-extreme" },
      { t: "they play no real role in agriculture.", trap: "与'pollinate a large share of crops'相反。", trapType: "opposite" },
      { t: "wind is a better pollinator than any animal.", trap: "原文未作优劣比较。", trapType: "fictitious-comparison" },
    ],
    why: "原文既强调蜜蜂重要，又指出风和其他动物也能授粉，故蜜蜂并非唯一。",
    difficulty: 2,
  },
  {
    text: "A factory installed sensors that flagged tiny defects human inspectors had missed. Over the next quarter, customer complaints about faulty units dropped by half. Managers concluded that many earlier complaints had stemmed from defects that ___",
    exigenceOptions: [
      { t: "推断此前投诉背后的缺陷来源", correct: true },
      { t: "证明人类检查员应全部被解雇" },
      { t: "描述传感器的电路设计" },
    ],
    options: [
      { t: "had previously slipped past human inspection.", correct: true },
      { t: "the sensors themselves had created.", trap: "传感器只是检测，未被说成制造缺陷。", trapType: "non-sequitur" },
      { t: "did not exist before the sensors were installed.", trap: "缺陷本就存在，只是没被发现。", trapType: "opposite" },
      { t: "customers had imagined entirely.", trap: "原文未说投诉是想象的。", trapType: "out-of-scope" },
    ],
    why: "传感器查出以往漏检的小缺陷后投诉减半，说明此前投诉多源于漏检的缺陷。",
    difficulty: 3,
  },
  {
    text: "The historian notes that the two rival cities each controlled a busy trade route and grew rich. The text gives no figures comparing their wealth. A responsible summary would say that both cities ___",
    exigenceOptions: [
      { t: "客观说明两城都因贸易而富裕", correct: true },
      { t: "断定东边的城市是史上最富有的" },
      { t: "描述古代货币的样式" },
    ],
    options: [
      { t: "prospered from the trade they controlled.", correct: true },
      { t: "were the wealthiest cities in all of history.", trap: "原文没给出可比数据。", trapType: "too-extreme" },
      { t: "were poorer than every modern city.", trap: "原文未与现代城市比较。", trapType: "fictitious-comparison" },
      { t: "eventually abandoned trade altogether.", trap: "原文没提放弃贸易。", trapType: "out-of-scope" },
    ],
    why: "原文只说两城都因掌控贸易而富，未给排名或比较，故只能说都繁荣。",
    difficulty: 2,
  },
  {
    text: "The author praises the documentary's honesty but calls its pacing 'painfully slow' and its narration 'flat.' Weighing these remarks, a reader should understand the author's overall view as ___",
    exigenceOptions: [
      { t: "传达作者褒贬参半、总体保留的评价", correct: true },
      { t: "表明作者对这部纪录片毫无保留地热爱" },
      { t: "介绍纪录片的拍摄地点" },
    ],
    options: [
      { t: "appreciative of its honesty yet critical of how it was made.", correct: true },
      { t: "wholly enthusiastic and full of praise.", trap: "'painfully slow''flat'是明显的负面基调。", trapType: "tone-mismatch" },
      { t: "completely dismissive of everything in it.", trap: "作者仍称赞其诚实。", trapType: "opposite" },
      { t: "focused only on the film's music.", trap: "原文未谈配乐。", trapType: "out-of-scope" },
    ],
    why: "作者既夸诚实又批节奏和旁白，总体是有褒有贬、保留态度。",
    difficulty: 3,
  },
  {
    text: "A drought forced farmers to abandon fields they could no longer irrigate. When the rains returned two years later, those same fields produced record harvests. Agronomists took this to mean the soil's fertility had been ___",
    exigenceOptions: [
      { t: "推断干旱期间土壤肥力发生了什么", correct: true },
      { t: "证明农民不该种地" },
      { t: "描述灌溉渠的建造方法" },
    ],
    options: [
      { t: "preserved rather than permanently destroyed by the drought.", correct: true },
      { t: "wiped out forever by the lack of water.", trap: "创纪录的收成与'永久毁灭'矛盾。", trapType: "opposite" },
      { t: "improved because droughts always enrich soil.", trap: "'always'式绝对化，且逻辑跳跃。", trapType: "too-extreme" },
      { t: "unrelated to the harvest in any way.", trap: "与随后丰收直接相关。", trapType: "non-sequitur" },
    ],
    why: "雨归后同一片地丰收，说明干旱只是让土地休耕，肥力被保存而非毁灭。",
    difficulty: 3,
  },
  {
    text: "The passage describes how a species of finch on a dry island developed larger beaks during a long drought, when only big, tough seeds remained. This suggests that the change in beak size was driven by ___",
    exigenceOptions: [
      { t: "解释喙变大与食物变化之间的因果", correct: true },
      { t: "证明这种雀是最聪明的鸟" },
      { t: "描述岛屿的海滩风光" },
    ],
    options: [
      { t: "which birds could crack the hard seeds that were left.", correct: true },
      { t: "the birds deciding to grow bigger beaks on purpose.", trap: "喙变大非有意为之。", trapType: "non-sequitur" },
      { t: "an abundance of soft seeds during the drought.", trap: "与'only big, tough seeds remained'相反。", trapType: "opposite" },
      { t: "the color of the birds' feathers.", trap: "原文未提羽色。", trapType: "out-of-scope" },
    ],
    why: "干旱只剩硬种子，能咬开的大喙个体更易存活，故喙尺寸随食物而变。",
    difficulty: 2,
  },
  {
    text: "A company let employees choose their own hours. Productivity rose in teams whose work did not depend on constant coordination, but fell in teams that needed to meet often. The most supported conclusion is that flexible hours ___",
    exigenceOptions: [
      { t: "说明弹性工时的效果取决于团队类型", correct: true },
      { t: "证明弹性工时总能提升生产力" },
      { t: "介绍公司的办公室装修" },
    ],
    options: [
      { t: "helped some teams but hurt those that relied on coordination.", correct: true },
      { t: "improved productivity for absolutely every team.", trap: "有些团队生产力反而下降。", trapType: "too-extreme" },
      { t: "made all teams less productive.", trap: "部分团队其实提升了。", trapType: "opposite" },
      { t: "mattered less than employee salaries.", trap: "原文未与薪资比较。", trapType: "fictitious-comparison" },
    ],
    why: "结果随团队是否需要协作而分化，故弹性工时效果视团队而定。",
    difficulty: 3,
  },
  {
    text: "The text notes that a rare frog survives in only a handful of isolated mountain streams. Each stream is fed by melting snow that is arriving earlier every year. The author is most likely leading up to the point that the frog's survival ___",
    exigenceOptions: [
      { t: "为这种蛙面临的生存威胁做铺垫", correct: true },
      { t: "证明这种蛙比其他动物更美丽" },
      { t: "描述登山者的路线" },
    ],
    options: [
      { t: "may be threatened as its cold, snow-fed streams change.", correct: true },
      { t: "is guaranteed no matter what happens to the climate.", trap: "与'arriving earlier every year'的暗示相反。", trapType: "opposite" },
      { t: "depends on it being prettier than other frogs.", trap: "原文未作美丑比较。", trapType: "fictitious-comparison" },
      { t: "proves the mountains are the tallest on Earth.", trap: "原文未谈山高。", trapType: "out-of-scope" },
    ],
    why: "栖息地狭窄且雪水提前，作者铺垫的是这种蛙生存正受威胁。",
    difficulty: 2,
  },
  {
    text: "An author revised her manuscript for ten years before publishing. Reviewers who once found her early drafts confusing praised the final book as remarkably clear. This progression suggests that the years of revision mainly served to ___",
    exigenceOptions: [
      { t: "说明多年修改带来的主要改变", correct: true },
      { t: "证明她是史上最伟大的作家" },
      { t: "介绍出版社的地址" },
    ],
    options: [
      { t: "make the book's ideas easier to follow.", correct: true },
      { t: "make the writing more confusing over time.", trap: "与'praised...as remarkably clear'相反。", trapType: "opposite" },
      { t: "prove that longer revision always yields better books.", trap: "'always'式绝对化。", trapType: "too-extreme" },
      { t: "increase the number of pages the passage never counts.", trap: "原文未提页数。", trapType: "out-of-scope" },
    ],
    why: "从'令人困惑'到'非常清晰'，说明多年修改主要提升了清晰度。",
    difficulty: 2,
  },
  {
    text: "The study found that plants exposed to gentle, regular wind grew shorter but sturdier stems than sheltered plants. Researchers reasoned that the wind acted as a signal prompting the plants to ___",
    exigenceOptions: [
      { t: "解释风为何让植物长得矮而结实", correct: true },
      { t: "证明有风的地方不能种任何植物" },
      { t: "描述温室玻璃的材质" },
    ],
    options: [
      { t: "invest in stronger support rather than height.", correct: true },
      { t: "grow as tall as possible as fast as possible.", trap: "与'shorter but sturdier'相反。", trapType: "opposite" },
      { t: "stop growing entirely in any breeze.", trap: "植物仍在生长，只是更矮壮。", trapType: "too-extreme" },
      { t: "change the color of their flowers.", trap: "原文未提花色。", trapType: "out-of-scope" },
    ],
    why: "受风植物矮而结实，说明风作为信号促使其把资源投向支撑而非增高。",
    difficulty: 3,
  },
  {
    text: "A law meant to protect small farmers was praised when it passed, but critics soon pointed to loopholes that let large agribusinesses claim most of its benefits. Years later, small farms were no better off. The passage most directly suggests that the law ___",
    exigenceOptions: [
      { t: "说明该法律因漏洞而未能实现初衷", correct: true },
      { t: "证明所有法律都是无用的" },
      { t: "描述农场的作物种类" },
    ],
    options: [
      { t: "failed to help the very farmers it was designed for.", correct: true },
      { t: "worked perfectly as its authors intended.", trap: "小农处境毫无改善。", trapType: "opposite" },
      { t: "proves every law inevitably fails.", trap: "由一例推及所有法律。", trapType: "non-sequitur" },
      { t: "was written by the agribusinesses themselves.", trap: "原文未说明立法者。", trapType: "out-of-scope" },
    ],
    why: "漏洞让大企业拿走大部分好处、小农未获益，说明该法未能保护目标人群。",
    difficulty: 3,
  },
  {
    text: "The passage explains that a comet's tail always points away from the sun, no matter which direction the comet is traveling. From this, one can infer that the tail's direction is determined not by the comet's motion but by ___",
    exigenceOptions: [
      { t: "解释彗尾方向由什么决定", correct: true },
      { t: "证明彗星比行星更重要" },
      { t: "描述望远镜的镜片" },
    ],
    options: [
      { t: "something coming from the sun itself.", correct: true },
      { t: "the exact direction the comet is moving.", trap: "与'no matter which direction...traveling'相反。", trapType: "opposite" },
      { t: "the comet choosing where to point its tail.", trap: "彗尾方向非彗星'选择'。", trapType: "non-sequitur" },
      { t: "the size of the nearest planet.", trap: "原文未提行星大小。", trapType: "out-of-scope" },
    ],
    why: "彗尾总背离太阳、与运动方向无关，故其方向由来自太阳的作用决定。",
    difficulty: 3,
  },
  {
    text: "Researchers gave two groups the same puzzle; one was told it measured intelligence, the other that it was just practice. The 'intelligence' group gave up sooner when the puzzle got hard. The finding suggests that framing a task as a test of ability can ___",
    exigenceOptions: [
      { t: "说明把任务描述为'能力测试'会带来的影响", correct: true },
      { t: "证明聪明的人总是先放弃" },
      { t: "介绍拼图的制作材料" },
    ],
    options: [
      { t: "make people give up more easily under difficulty.", correct: true },
      { t: "always make everyone perform better.", trap: "'intelligence'组反而更早放弃。", trapType: "opposite" },
      { t: "prove intelligence tests are the fairest measure.", trap: "原文未评价测试是否公平。", trapType: "out-of-scope" },
      { t: "matter more than the puzzle's actual difficulty.", trap: "原文未作此比较。", trapType: "fictitious-comparison" },
    ],
    why: "被告知'测智力'的一组遇难更早放弃，说明这种表述会削弱坚持。",
    difficulty: 3,
  },
  {
    text: "The article reports that a city planted thousands of street trees, and within years summer temperatures on those streets measured noticeably lower than on bare streets nearby. The most reasonable inference is that the trees ___",
    exigenceOptions: [
      { t: "说明行道树对街道气温的作用", correct: true },
      { t: "证明这座城市是全国最绿的" },
      { t: "描述树木的年轮结构" },
    ],
    options: [
      { t: "helped cool the streets where they were planted.", correct: true },
      { t: "made those streets hotter than the bare ones.", trap: "与'noticeably lower'相反。", trapType: "opposite" },
      { t: "cooled the entire planet on their own.", trap: "夸大到全球尺度。", trapType: "too-extreme" },
      { t: "were taller than any trees elsewhere.", trap: "原文未比较树高。", trapType: "fictitious-comparison" },
    ],
    why: "种树街道夏季气温明显更低，故合理推断树木起到了降温作用。",
    difficulty: 2,
  },
  {
    text: "A translator noted that a single word in the old poem could mean either 'shadow' or 'shelter,' and the poet may have intended both at once. This suggests that, in reading such poetry, insisting on one fixed meaning may ___",
    exigenceOptions: [
      { t: "说明对多义诗歌强求单一含义的问题", correct: true },
      { t: "证明这首诗是有史以来最好的诗" },
      { t: "介绍翻译软件的功能" },
    ],
    options: [
      { t: "flatten meanings the poet deliberately left open.", correct: true },
      { t: "always reveal the poem's one true message.", trap: "原文说诗人或许兼取二义。", trapType: "opposite" },
      { t: "make the poem longer than the original.", trap: "原文未谈长度。", trapType: "out-of-scope" },
      { t: "prove poetry is harder than prose to translate.", trap: "原文未与散文比较。", trapType: "fictitious-comparison" },
    ],
    why: "一词双关且诗人或有意为之，强求单一含义会抹平其刻意保留的多义。",
    difficulty: 4,
  },
  {
    text: "The report shows that after a website simplified its checkout to a single page, the share of shoppers who abandoned their carts fell sharply. Analysts concluded that many earlier abandonments had been caused by ___",
    exigenceOptions: [
      { t: "推断此前顾客放弃购物车的原因", correct: true },
      { t: "证明顾客都不喜欢网购" },
      { t: "描述网站服务器的机房" },
    ],
    options: [
      { t: "the friction of a longer, more complicated checkout.", correct: true },
      { t: "the checkout being simplified to one page.", trap: "那是解决办法，不是原因。", trapType: "same-word" },
      { t: "shoppers having no interest in buying anything.", trap: "简化后完成率上升，与之相反。", trapType: "opposite" },
      { t: "prices that the passage never mentions.", trap: "原文未提价格。", trapType: "out-of-scope" },
    ],
    why: "简化结账后弃购骤降，反推此前放弃多因结账繁琐。",
    difficulty: 2,
  },
  {
    text: "The passage explains that certain fungi trade nutrients with tree roots, giving trees minerals in exchange for sugars. Trees connected to these fungi grew faster than isolated ones. This relationship is best described as one in which both partners ___",
    exigenceOptions: [
      { t: "说明真菌与树木之间的互利关系", correct: true },
      { t: "证明真菌比树木更重要" },
      { t: "描述森林火灾的过程" },
    ],
    options: [
      { t: "benefit from what the other provides.", correct: true },
      { t: "harm each other by competing for food.", trap: "与'trade nutrients''grew faster'相反。", trapType: "opposite" },
      { t: "prove fungi are superior to trees.", trap: "原文未作优劣比较。", trapType: "fictitious-comparison" },
      { t: "will always outcompete every other organism.", trap: "过度绝对。", trapType: "too-extreme" },
    ],
    why: "真菌给矿物、树给糖，且相连的树长得更快，是双方获益的互利关系。",
    difficulty: 2,
  },
];

async function main() {
  await prisma.gameItem.deleteMany({ where: { gameType: "inference" } });
  for (const it of ITEMS) {
    const { difficulty, ...payload } = it;
    await prisma.gameItem.create({
      data: { gameType: "inference", domain: "info_ideas", difficulty, payload, explanation: it.why },
    });
  }
  console.log(`inference: ${ITEMS.length}`);
  console.log("P3 seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
