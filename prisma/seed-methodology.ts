// 方法论落地内容脚本：只插入/刷新 paraphrase + trim 两个新游戏，
// 并追加少量带增强字段（keywords/trapType、contextClues）的 read_the_green / closer 示范题。
// ⚠️ 绝不 deleteMany 现有 5 个游戏的全量内容——只 delete paraphrase / trim（它们本就是新游戏）。
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type ParaOption = { t: string; correct?: boolean; why: string };
type ParaItem = { source: string; options: ParaOption[] };

// 40 条同义改写题。正确项是「换词说法」，干扰项为：同词偷换 / 扩大缩小 / 反转 / 无中生有。
// correct 位置已刻意打散，避免位置偏置。
const PARAPHRASE_ITEMS: ParaItem[] = [
  { source: "The new policy was met with widespread skepticism from local farmers.", options: [
    { t: "Many farmers in the area doubted the new policy.", correct: true, why: "widespread skepticism → many...doubted，意思一致。" },
    { t: "Local farmers widely welcomed the new policy.", why: "反转——skepticism 是怀疑，不是欢迎。" },
    { t: "The new policy met local farmers.", why: "同词堆砌，丢了 skepticism 的核心。" },
    { t: "Every farmer in the country rejected the policy.", why: "扩大化——原文是 local 且是怀疑，非全盘拒绝。" } ] },
  { source: "Her argument, though elegant, ultimately rested on a flawed assumption.", options: [
    { t: "Despite its polish, her argument depended on a mistaken premise.", correct: true, why: "elegant→polish，flawed assumption→mistaken premise。" },
    { t: "Her elegant argument rested well.", why: "同词照搬，删掉了 flawed 关键转折。" },
    { t: "Her argument was both elegant and completely sound.", why: "反转——原文说它建立在错误假设上。" },
    { t: "She refused to make any assumptions in her argument.", why: "无中生有。" } ] },
  { source: "The committee postponed the decision until further data could be gathered.", options: [
    { t: "The committee decided immediately without any data.", why: "反转——原文是推迟。" },
    { t: "The committee delayed deciding until it had more data.", correct: true, why: "postponed→delayed，further data→more data。" },
    { t: "The committee gathered the decision and the data.", why: "同词乱拼，语义不通。" },
    { t: "The committee canceled the decision permanently.", why: "扩大化——postpone 是延后不是取消。" } ] },
  { source: "Critics praised the film for its restraint rather than its spectacle.", options: [
    { t: "Critics praised the film's spectacle above all.", why: "反转——褒的是 restraint。" },
    { t: "Critics restrained their praise for the film.", why: "同词 restraint 被挪用，意思全变。" },
    { t: "Reviewers admired the movie's understatement over its flashiness.", correct: true, why: "restraint→understatement，spectacle→flashiness。" },
    { t: "Audiences hated the film's quiet tone.", why: "无中生有。" } ] },
  { source: "Sleep deprivation impairs memory far more than most people realize.", options: [
    { t: "Lack of sleep damages memory more than people generally think.", correct: true, why: "deprivation→lack，impairs→damages，realize→think。" },
    { t: "Most people realize how sleep helps memory.", why: "同词 realize/memory 被拿来，意思相反。" },
    { t: "Sleep deprivation slightly affects memory.", why: "缩小化——原文是 far more。" },
    { t: "People who sleep well have poor memory.", why: "无中生有且逻辑颠倒。" } ] },
  { source: "The bridge, once a symbol of progress, now stands as a warning.", options: [
    { t: "What was once seen as advancement is now a cautionary sign.", correct: true, why: "symbol of progress→advancement，warning→cautionary sign。" },
    { t: "The bridge is still a proud symbol of progress.", why: "反转——now 已变警示。" },
    { t: "The bridge progressed into a warning symbol quickly.", why: "同词拼接，扭曲时间对比。" },
    { t: "Engineers built a new warning bridge.", why: "无中生有。" } ] },
  { source: "Few inventions have transformed daily life as thoroughly as the smartphone.", options: [
    { t: "Many inventions transformed daily life more than the smartphone.", why: "反转——few...as 表示很少能比得上。" },
    { t: "Almost no invention has changed everyday life as completely as the smartphone.", correct: true, why: "few→almost no，thoroughly→completely。" },
    { t: "The smartphone transformed few inventions.", why: "同词错位，主宾乱。" },
    { t: "The smartphone had little effect on daily life.", why: "反转原意。" } ] },
  { source: "The author deliberately leaves the ending ambiguous.", options: [
    { t: "The writer intentionally makes the conclusion unclear.", correct: true, why: "deliberately→intentionally，ambiguous→unclear。" },
    { t: "The author accidentally confused the ending.", why: "反转——deliberately 是故意。" },
    { t: "The author leaves deliberately at the ending.", why: "同词乱用，语义破碎。" },
    { t: "The ending explains everything clearly.", why: "反转 ambiguous。" } ] },
  { source: "Rising sea levels threaten coastal cities across the globe.", options: [
    { t: "Coastal cities threaten the rising sea.", why: "同词主宾倒置。" },
    { t: "A few coastal cities face minor sea-level changes.", why: "缩小化。" },
    { t: "Sea levels are falling near most cities.", why: "反转 rising。" },
    { t: "Cities along coasts worldwide are endangered by higher seas.", correct: true, why: "rising sea levels→higher seas，across the globe→worldwide。" } ] },
  { source: "The experiment's results were promising but far from conclusive.", options: [
    { t: "The findings looked encouraging yet were not yet definitive.", correct: true, why: "promising→encouraging，far from conclusive→not definitive。" },
    { t: "The results were both promising and fully conclusive.", why: "反转——远未定论。" },
    { t: "The experiment promised conclusive results.", why: "同词偷换，抹掉保留态度。" },
    { t: "The results were disappointing and useless.", why: "反转 promising。" } ] },
  { source: "Unlike her predecessors, she embraced change instead of resisting it.", options: [
    { t: "Like her predecessors, she resisted change.", why: "反转 unlike。" },
    { t: "She welcomed change, whereas those before her fought it.", correct: true, why: "embraced→welcomed，predecessors→those before her。" },
    { t: "She embraced her predecessors and their changes.", why: "同词拼接，改了对象。" },
    { t: "She ignored change entirely.", why: "无中生有。" } ] },
  { source: "The report understated the scale of the environmental damage.", options: [
    { t: "The report exaggerated the environmental damage.", why: "反转 understated。" },
    { t: "The report made the environmental harm seem smaller than it was.", correct: true, why: "understated→made seem smaller，damage→harm。" },
    { t: "The report stated the damage under a tree.", why: "同词误读 understate。" },
    { t: "The environment suffered no real damage.", why: "无中生有。" } ] },
  { source: "His theory gained acceptance only after decades of resistance.", options: [
    { t: "It took many years of opposition before his theory was embraced.", correct: true, why: "decades→many years，resistance→opposition。" },
    { t: "His theory was accepted immediately.", why: "反转——经历数十年阻力。" },
    { t: "His theory resisted acceptance for decades.", why: "同词错位，主语弄反。" },
    { t: "No one ever accepted his theory.", why: "反转结果。" } ] },
  { source: "The novel captures the quiet tension of small-town life.", options: [
    { t: "The novel captures a loud, dramatic city.", why: "反转 quiet/small-town。" },
    { t: "Small-town life captures the tense novel.", why: "同词主宾倒置。" },
    { t: "The book conveys the subtle unease of life in a small town.", correct: true, why: "captures→conveys，quiet tension→subtle unease。" },
    { t: "The town in the novel is perfectly peaceful.", why: "缩小化，抹掉 tension。" } ] },
  { source: "Economists disagree about whether the tax will help or hurt growth.", options: [
    { t: "Experts are divided over the tax's effect on growth.", correct: true, why: "economists→experts，disagree→divided。" },
    { t: "Economists agree the tax will help growth.", why: "反转 disagree。" },
    { t: "Growth disagrees with the economists' tax.", why: "同词乱拼。" },
    { t: "The tax will definitely destroy the economy.", why: "无中生有的确定性。" } ] },
  { source: "The medication relieves symptoms without addressing the underlying cause.", options: [
    { t: "The medication cures the underlying cause completely.", why: "反转——未处理病因。" },
    { t: "The drug eases symptoms but does not treat the root problem.", correct: true, why: "relieves→eases，underlying cause→root problem。" },
    { t: "The medication relieves the underlying cause.", why: "同词偷换对象。" },
    { t: "The symptoms have no known cause.", why: "无中生有。" } ] },
  { source: "She spoke with a confidence that belied her inexperience.", options: [
    { t: "Her confidence clearly showed her inexperience.", why: "反转 belied（掩盖，非显露）。" },
    { t: "She spoke confidently about her experience.", why: "同词错读。" },
    { t: "She was too nervous to speak at all.", why: "反转 confidence。" },
    { t: "Her assured tone hid how new she was.", correct: true, why: "confidence→assured tone，belied→hid，inexperience→how new。" } ] },
  { source: "The city invested heavily in public transit to curb congestion.", options: [
    { t: "To reduce traffic, the city put major funding into public transportation.", correct: true, why: "invested heavily→major funding，curb congestion→reduce traffic。" },
    { t: "The city spent little on transit and ignored congestion.", why: "反转 heavily。" },
    { t: "Public transit invested in the congested city.", why: "同词主宾倒置。" },
    { t: "The city banned all cars downtown.", why: "无中生有。" } ] },
  { source: "Although widely admired, the plan proved impractical in practice.", options: [
    { t: "The plan was disliked and impractical.", why: "反转 admired。" },
    { t: "In practice, the plan practiced admiration.", why: "同词空转。" },
    { t: "The plan was popular but did not work when carried out.", correct: true, why: "widely admired→popular，impractical→did not work。" },
    { t: "The plan worked perfectly once tried.", why: "反转 impractical。" } ] },
  { source: "The discovery challenged assumptions that had gone unquestioned for centuries.", options: [
    { t: "The finding disputed beliefs no one had doubted for hundreds of years.", correct: true, why: "challenged→disputed，unquestioned for centuries→no one had doubted。" },
    { t: "The discovery confirmed centuries-old assumptions.", why: "反转 challenged。" },
    { t: "For centuries, assumptions questioned the discovery.", why: "同词倒置。" },
    { t: "Scientists had always doubted these ideas.", why: "反转 unquestioned。" } ] },
  { source: "The lecture was informative but far too long.", options: [
    { t: "The lecture was short and uninformative.", why: "反转两处。" },
    { t: "The talk taught a lot yet went on excessively.", correct: true, why: "informative→taught a lot，far too long→went on excessively。" },
    { t: "The long lecture informed the far.", why: "同词乱拼。" },
    { t: "The audience left before it began.", why: "无中生有。" } ] },
  { source: "Volunteers, motivated by compassion, rebuilt the flooded village.", options: [
    { t: "The village rebuilt the compassionate volunteers.", why: "同词主宾倒置。" },
    { t: "Driven by sympathy, helpers restored the village hit by floods.", correct: true, why: "compassion→sympathy，rebuilt→restored。" },
    { t: "Paid workers ignored the flooded village.", why: "反转动机与行为。" },
    { t: "Volunteers flooded the village out of anger.", why: "无中生有且反转情感。" } ] },
  { source: "The startup's rapid growth masked deep financial problems.", options: [
    { t: "Fast expansion hid the company's serious money troubles.", correct: true, why: "rapid growth→fast expansion，masked→hid。" },
    { t: "The startup's slow growth revealed its stability.", why: "反转多处。" },
    { t: "Financial problems masked the startup's growth.", why: "同词主宾倒置。" },
    { t: "The startup had no money problems at all.", why: "反转 deep problems。" } ] },
  { source: "He conceded the point, though reluctantly.", options: [
    { t: "He eagerly agreed with the point.", why: "反转 reluctantly。" },
    { t: "He refused to concede anything.", why: "反转 conceded。" },
    { t: "He admitted it, but unwillingly.", correct: true, why: "conceded→admitted，reluctantly→unwillingly。" },
    { t: "He conceded reluctantly to a new job.", why: "无中生有的对象。" } ] },
  { source: "The findings apply only to a narrow range of conditions.", options: [
    { t: "The results hold true just for a limited set of situations.", correct: true, why: "apply→hold true，narrow range→limited set。" },
    { t: "The findings apply to nearly all conditions.", why: "反转 narrow/only。" },
    { t: "A narrow range applied the findings.", why: "同词主宾倒置。" },
    { t: "The findings cannot be applied anywhere.", why: "扩大化否定。" } ] },
  { source: "Rather than dictating solutions, the coach asked guiding questions.", options: [
    { t: "The coach dictated every solution to the team.", why: "反转 rather than。" },
    { t: "Instead of handing out answers, the coach posed questions to steer thinking.", correct: true, why: "dictating solutions→handing out answers。" },
    { t: "The coach questioned the guiding dictator.", why: "同词乱拼。" },
    { t: "The coach stayed silent the whole session.", why: "无中生有。" } ] },
  { source: "The two accounts of the event differ in almost every detail.", options: [
    { t: "The two accounts match on every detail.", why: "反转 differ。" },
    { t: "Every detail accounts for the two events.", why: "同词空转。" },
    { t: "The two versions of what happened disagree on nearly everything.", correct: true, why: "accounts→versions，differ in almost every detail→disagree on nearly everything。" },
    { t: "There is only one account of the event.", why: "无中生有。" } ] },
  { source: "Technology has made information abundant but attention scarce.", options: [
    { t: "Because of technology, information is plentiful while focus is rare.", correct: true, why: "abundant→plentiful，attention scarce→focus is rare。" },
    { t: "Technology made both information and attention abundant.", why: "反转 scarce。" },
    { t: "Scarce technology made abundant attention.", why: "同词乱拼。" },
    { t: "Technology destroyed all available information.", why: "反转 abundant。" } ] },
  { source: "The museum's collection, vast as it is, represents only a fraction of the artist's work.", options: [
    { t: "The museum owns nearly all of the artist's work.", why: "反转 only a fraction。" },
    { t: "Huge though it is, the museum's holdings show just a small part of what the artist made.", correct: true, why: "vast→huge，only a fraction→just a small part。" },
    { t: "A fraction of the museum represents the vast artist.", why: "同词乱拼。" },
    { t: "The artist made very few works.", why: "无中生有。" } ] },
  { source: "Her explanation clarified what had confused the class for weeks.", options: [
    { t: "Her explanation confused the class even more.", why: "反转 clarified。" },
    { t: "The confused class clarified her explanation.", why: "同词主宾倒置。" },
    { t: "Her account cleared up what had puzzled the students for a long time.", correct: true, why: "clarified→cleared up，confused→puzzled。" },
    { t: "The class had understood everything from the start.", why: "反转 confused。" } ] },
  { source: "The reforms benefited the wealthy while doing little for the poor.", options: [
    { t: "The changes helped rich people but offered scarcely anything to the poor.", correct: true, why: "reforms→changes，little→scarcely anything。" },
    { t: "The reforms mainly helped the poor.", why: "反转受益方。" },
    { t: "The poor benefited the wealthy reforms.", why: "同词乱拼。" },
    { t: "The reforms hurt everyone equally.", why: "无中生有。" } ] },
  { source: "Skeptical at first, the jury was gradually won over by the evidence.", options: [
    { t: "Convinced from the start, the jury ignored the evidence.", why: "反转 skeptical。" },
    { t: "The jury won over the skeptical evidence.", why: "同词主宾倒置。" },
    { t: "The evidence was never presented to the jury.", why: "无中生有。" },
    { t: "Doubtful in the beginning, the jury was slowly persuaded by the proof.", correct: true, why: "skeptical→doubtful，won over→persuaded。" } ] },
  { source: "The species survives in only a handful of isolated valleys.", options: [
    { t: "The animal lives on in just a few remote valleys.", correct: true, why: "survives→lives on，a handful→a few，isolated→remote。" },
    { t: "The species thrives across many connected valleys.", why: "反转 handful/isolated。" },
    { t: "A handful of valleys survive the species.", why: "同词主宾倒置。" },
    { t: "The species has completely died out.", why: "反转 survives。" } ] },
  { source: "His memoir is honest about his failures as well as his triumphs.", options: [
    { t: "His memoir hides his failures and lists only wins.", why: "反转 honest about failures。" },
    { t: "His autobiography frankly discusses both his defeats and his successes.", correct: true, why: "memoir→autobiography，honest→frankly。" },
    { t: "His triumphs failed to write the memoir.", why: "同词乱拼。" },
    { t: "He never experienced any failures.", why: "无中生有。" } ] },
  { source: "The drought forced farmers to abandon crops they could no longer water.", options: [
    { t: "The drought helped farmers grow more crops.", why: "反转 forced to abandon。" },
    { t: "The crops watered the abandoned farmers.", why: "同词乱拼。" },
    { t: "Unable to irrigate them, farmers gave up crops because of the drought.", correct: true, why: "abandon→gave up，no longer water→unable to irrigate。" },
    { t: "Farmers had plenty of water for their crops.", why: "反转 no longer water。" } ] },
  { source: "The proposal, ambitious yet vague, drew both excitement and doubt.", options: [
    { t: "Bold but unclear, the plan sparked both enthusiasm and uncertainty.", correct: true, why: "ambitious→bold，vague→unclear。" },
    { t: "The clear, modest proposal drew only calm.", why: "反转 ambitious/vague。" },
    { t: "Excitement and doubt proposed the vague plan.", why: "同词乱拼。" },
    { t: "No one reacted to the proposal at all.", why: "反转 both...and。" } ] },
  { source: "Even seasoned climbers underestimate how quickly the weather can turn.", options: [
    { t: "Experienced climbers always predict the weather perfectly.", why: "反转 underestimate。" },
    { t: "The weather underestimates seasoned climbers.", why: "同词主宾倒置。" },
    { t: "Experienced climbers still misjudge how fast conditions can change.", correct: true, why: "seasoned→experienced，underestimate→misjudge。" },
    { t: "Only beginners are affected by the weather.", why: "反转 even seasoned。" } ] },
  { source: "The law was intended to protect consumers, but loopholes weakened it.", options: [
    { t: "Meant to safeguard buyers, the law was undermined by gaps in it.", correct: true, why: "protect consumers→safeguard buyers，loopholes weakened→gaps undermined。" },
    { t: "The law strengthened protections through its loopholes.", why: "反转 weakened。" },
    { t: "Consumers protected the weakened loopholes.", why: "同词乱拼。" },
    { t: "The law had no purpose at all.", why: "反转 intended to。" } ] },
  { source: "She valued substance over style in everything she wrote.", options: [
    { t: "She always chose style over substance.", why: "反转优先顺序。" },
    { t: "Her style valued the substance of writing.", why: "同词空转。" },
    { t: "In her writing she cared more about content than about flair.", correct: true, why: "substance→content，style→flair。" },
    { t: "She rarely wrote anything at all.", why: "无中生有。" } ] },
  { source: "The verdict set a precedent that would shape future cases.", options: [
    { t: "The ruling established a model that later cases would follow.", correct: true, why: "verdict→ruling，precedent→model，shape future→later cases follow。" },
    { t: "The verdict had no effect on any future case.", why: "反转 shape future。" },
    { t: "Future cases set the verdict's precedent.", why: "同词主宾倒置。" },
    { t: "The court refused to reach a verdict.", why: "无中生有。" } ] },
];

type TrimToken = { text: string; core: boolean };
type TrimItem = { tokens: TrimToken[]; gloss: string };

// 40 条长难句拆主干。core=true 的 token 连起来就是主谓宾骨架。
const TRIM_ITEMS: TrimItem[] = [
  { tokens: [ { text: "The scientist", core: true }, { text: ", who had studied otters for decades,", core: false }, { text: "finally", core: false }, { text: "published", core: true }, { text: "her findings.", core: true } ], gloss: "主干：The scientist published her findings. 定语从句和 finally 是修饰。" },
  { tokens: [ { text: "Exhausted after the long march,", core: false }, { text: "the soldiers", core: true }, { text: "collapsed", core: true }, { text: "onto the cold ground.", core: false } ], gloss: "主干：The soldiers collapsed. 前置分词短语和介词短语可删。" },
  { tokens: [ { text: "The report", core: true }, { text: "that the committee released last week", core: false }, { text: "sparked", core: true }, { text: "a heated debate.", core: true } ], gloss: "主干：The report sparked a debate. 定语从句是修饰。" },
  { tokens: [ { text: "In the middle of the storm,", core: false }, { text: "the pilot", core: true }, { text: "calmly", core: false }, { text: "landed", core: true }, { text: "the plane.", core: true } ], gloss: "主干：The pilot landed the plane. 状语和 calmly 是修饰。" },
  { tokens: [ { text: "The novel,", core: true }, { text: "praised by critics and loved by readers,", core: false }, { text: "became", core: true }, { text: "an instant classic.", core: true } ], gloss: "主干：The novel became a classic. 插入的分词短语是修饰。" },
  { tokens: [ { text: "Because the bridge was unsafe,", core: false }, { text: "engineers", core: true }, { text: "closed", core: true }, { text: "it", core: true }, { text: "to all traffic.", core: false } ], gloss: "主干：Engineers closed it. 原因状语从句和介词短语可删。" },
  { tokens: [ { text: "The students", core: true }, { text: ", eager to impress their teacher,", core: false }, { text: "prepared", core: true }, { text: "for hours.", core: false } ], gloss: "主干：The students prepared. 插入语和时间状语是修饰。" },
  { tokens: [ { text: "Rising steadily since 1950,", core: false }, { text: "global temperatures", core: true }, { text: "have alarmed", core: true }, { text: "climate scientists.", core: true } ], gloss: "主干：Temperatures have alarmed scientists. 前置分词短语是修饰。" },
  { tokens: [ { text: "The company", core: true }, { text: ", despite its early success,", core: false }, { text: "ultimately", core: false }, { text: "failed.", core: true } ], gloss: "主干：The company failed. 让步插入语和 ultimately 是修饰。" },
  { tokens: [ { text: "Hidden beneath layers of paint,", core: false }, { text: "the original portrait", core: true }, { text: "surprised", core: true }, { text: "the restorers.", core: true } ], gloss: "主干：The portrait surprised the restorers. 前置分词短语是修饰。" },
  { tokens: [ { text: "The theory", core: true }, { text: "that light behaves as both wave and particle", core: false }, { text: "puzzled", core: true }, { text: "early physicists.", core: true } ], gloss: "主干：The theory puzzled physicists. 同位语从句是修饰。" },
  { tokens: [ { text: "When the results came in,", core: false }, { text: "the researchers", core: true }, { text: "immediately", core: false }, { text: "revised", core: true }, { text: "their model.", core: true } ], gloss: "主干：The researchers revised their model. 时间状语从句和 immediately 可删。" },
  { tokens: [ { text: "The ancient city,", core: true }, { text: "buried by ash for centuries,", core: false }, { text: "remained", core: true }, { text: "remarkably", core: false }, { text: "intact.", core: true } ], gloss: "主干：The city remained intact. 插入分词短语和 remarkably 是修饰。" },
  { tokens: [ { text: "To protect the coral reefs,", core: false }, { text: "the government", core: true }, { text: "banned", core: true }, { text: "certain fishing methods.", core: true } ], gloss: "主干：The government banned methods. 目的状语是修饰。" },
  { tokens: [ { text: "The author's latest book,", core: true }, { text: "which took nearly ten years to write,", core: false }, { text: "explores", core: true }, { text: "themes of memory.", core: true } ], gloss: "主干：The book explores themes. 非限定定语从句是修饰。" },
  { tokens: [ { text: "Frustrated by the delays,", core: false }, { text: "passengers", core: true }, { text: "demanded", core: true }, { text: "a refund.", core: true } ], gloss: "主干：Passengers demanded a refund. 前置分词短语是修饰。" },
  { tokens: [ { text: "The medicine,", core: true }, { text: "although expensive,", core: false }, { text: "saved", core: true }, { text: "countless lives.", core: true } ], gloss: "主干：The medicine saved lives. 让步插入语是修饰。" },
  { tokens: [ { text: "Standing at the edge of the cliff,", core: false }, { text: "she", core: true }, { text: "felt", core: true }, { text: "a rush of fear.", core: true } ], gloss: "主干：She felt fear. 前置分词短语是修饰。" },
  { tokens: [ { text: "The data", core: true }, { text: "collected over three field seasons", core: false }, { text: "confirmed", core: true }, { text: "the hypothesis.", core: true } ], gloss: "主干：The data confirmed the hypothesis. 过去分词短语作定语可删。" },
  { tokens: [ { text: "After decades of neglect,", core: false }, { text: "the theater", core: true }, { text: "was", core: true }, { text: "beautifully", core: false }, { text: "restored.", core: true } ], gloss: "主干：The theater was restored. 时间状语和 beautifully 是修饰。" },
  { tokens: [ { text: "The teacher,", core: true }, { text: "known for her patience,", core: false }, { text: "explained", core: true }, { text: "the problem again.", core: false } ], gloss: "主干：The teacher explained the problem. 插入语和 again 是修饰。" },
  { tokens: [ { text: "Though small in size,", core: false }, { text: "the device", core: true }, { text: "stores", core: true }, { text: "enormous amounts of data.", core: true } ], gloss: "主干：The device stores data. 让步状语是修饰。" },
  { tokens: [ { text: "The river,", core: true }, { text: "swollen by weeks of rain,", core: false }, { text: "flooded", core: true }, { text: "the nearby farms.", core: true } ], gloss: "主干：The river flooded the farms. 插入分词短语是修饰。" },
  { tokens: [ { text: "Determined to finish,", core: false }, { text: "the runner", core: true }, { text: "pushed", core: true }, { text: "through the pain.", core: false } ], gloss: "主干：The runner pushed. 前置分词短语和介词短语可删。" },
  { tokens: [ { text: "The proposal", core: true }, { text: "that the board approved yesterday", core: false }, { text: "will change", core: true }, { text: "everything.", core: true } ], gloss: "主干：The proposal will change everything. 定语从句是修饰。" },
  { tokens: [ { text: "In her groundbreaking study,", core: false }, { text: "the biologist", core: true }, { text: "described", core: true }, { text: "a new species.", core: true } ], gloss: "主干：The biologist described a species. 前置介词短语是修饰。" },
  { tokens: [ { text: "The letters,", core: true }, { text: "written during the war,", core: false }, { text: "reveal", core: true }, { text: "her private fears.", core: true } ], gloss: "主干：The letters reveal her fears. 插入分词短语是修饰。" },
  { tokens: [ { text: "Surrounded by reporters,", core: false }, { text: "the senator", core: true }, { text: "refused", core: true }, { text: "to comment.", core: true } ], gloss: "主干：The senator refused to comment. 前置分词短语是修饰。" },
  { tokens: [ { text: "The factory,", core: true }, { text: "once the largest in the region,", core: false }, { text: "now", core: false }, { text: "stands", core: true }, { text: "empty.", core: true } ], gloss: "主干：The factory stands empty. 同位插入语和 now 是修饰。" },
  { tokens: [ { text: "Having lost the map,", core: false }, { text: "the hikers", core: true }, { text: "wandered", core: true }, { text: "for hours.", core: false } ], gloss: "主干：The hikers wandered. 前置完成分词短语和时间状语可删。" },
  { tokens: [ { text: "The vaccine,", core: true }, { text: "developed in record time,", core: false }, { text: "reached", core: true }, { text: "millions of people.", core: true } ], gloss: "主干：The vaccine reached people. 插入分词短语是修饰。" },
  { tokens: [ { text: "Unless conditions improve,", core: false }, { text: "the crops", core: true }, { text: "will fail.", core: true } ], gloss: "主干：The crops will fail. 条件状语从句是修饰。" },
  { tokens: [ { text: "The painting,", core: true }, { text: "long thought to be a forgery,", core: false }, { text: "turned out", core: true }, { text: "to be genuine.", core: true } ], gloss: "主干：The painting turned out to be genuine. 插入分词短语是修饰。" },
  { tokens: [ { text: "Working late into the night,", core: false }, { text: "the team", core: true }, { text: "met", core: true }, { text: "the deadline.", core: true } ], gloss: "主干：The team met the deadline. 前置分词短语是修饰。" },
  { tokens: [ { text: "The witness", core: true }, { text: ", nervous but determined,", core: false }, { text: "described", core: true }, { text: "what she had seen.", core: true } ], gloss: "主干：The witness described what she had seen. 插入形容词短语是修饰。" },
  { tokens: [ { text: "Because funding ran out,", core: false }, { text: "the project", core: true }, { text: "was", core: true }, { text: "quietly", core: false }, { text: "abandoned.", core: true } ], gloss: "主干：The project was abandoned. 原因状语从句和 quietly 是修饰。" },
  { tokens: [ { text: "The mountain,", core: true }, { text: "shrouded in mist most mornings,", core: false }, { text: "attracts", core: true }, { text: "thousands of climbers.", core: true } ], gloss: "主干：The mountain attracts climbers. 插入分词短语是修饰。" },
  { tokens: [ { text: "To everyone's surprise,", core: false }, { text: "the quiet student", core: true }, { text: "won", core: true }, { text: "the debate.", core: true } ], gloss: "主干：The student won the debate. 前置介词短语是修饰。" },
  { tokens: [ { text: "The instructions,", core: true }, { text: "printed in tiny letters,", core: false }, { text: "confused", core: true }, { text: "most users.", core: true } ], gloss: "主干：The instructions confused users. 插入分词短语是修饰。" },
  { tokens: [ { text: "While the orchestra tuned their instruments,", core: false }, { text: "the audience", core: true }, { text: "waited", core: true }, { text: "in silence.", core: false } ], gloss: "主干：The audience waited. 时间状语从句和介词短语可删。" },
];

type RtgOption = { t: string; correct?: boolean; trap?: string; trapType?: "same-word" | "wrong-logic" | "out-of-scope" };
type RtgItem = { sentences: string[]; question: string; options: RtgOption[]; evidenceIndex: number; evidenceWhy: string; keywords?: string[] };

// 8 条带「关键词定位 + 陷阱分类」的增强 read_the_green（追加，不清空现有题）
const RTG_ENHANCED: RtgItem[] = [
  { sentences: [ "Dr. Alvarez spent years mapping the migration of monarch butterflies.", "Her team tagged thousands of insects across three countries.", "The data showed a single population traveling farther than anyone had thought possible.", "Alvarez argued that protecting even one stopover site could safeguard the whole journey." ],
    question: "According to the passage, what did Alvarez's data reveal about the monarch population?",
    keywords: ["Alvarez", "data", "reveal", "population"],
    options: [
      { t: "One group of monarchs migrated a greater distance than expected.", correct: true },
      { t: "Alvarez tagged butterflies in three countries.", trap: "同词照搬 three countries，但那是方法不是数据发现。", trapType: "same-word" },
      { t: "Monarch populations were declining rapidly.", trap: "原文没提数量下降。", trapType: "out-of-scope" },
      { t: "Protecting one site would harm the migration.", trap: "与 safeguard 相反。", trapType: "wrong-logic" } ],
    evidenceIndex: 2, evidenceWhy: "第三句直接说 a single population traveling farther than anyone had thought possible。" },
  { sentences: [ "The city council voted to replace the old streetlights with LED bulbs.", "Supporters pointed to lower energy bills and reduced carbon emissions.", "Critics worried the bright white light would disturb residents at night.", "The council promised to test dimmer models before a full rollout." ],
    question: "According to the passage, why did critics oppose the new streetlights?",
    keywords: ["critics", "oppose", "streetlights"],
    options: [
      { t: "They feared the harsh light would bother people while sleeping.", correct: true },
      { t: "They wanted lower energy bills.", trap: "那是 supporters 的理由。", trapType: "wrong-logic" },
      { t: "The council voted to replace the streetlights.", trap: "同词 replace/streetlights，但答非所问。", trapType: "same-word" },
      { t: "They opposed all forms of new technology.", trap: "原文没有这么宽的说法。", trapType: "out-of-scope" } ],
    evidenceIndex: 2, evidenceWhy: "第三句：Critics worried the bright white light would disturb residents at night。" },
  { sentences: [ "For most of his career, the composer wrote for small chamber groups.", "Late in life, he suddenly turned to enormous symphonies.", "Some scholars link the shift to his growing deafness.", "Others say he simply wanted a bigger canvas for his ideas." ],
    question: "The passage indicates that the composer's late works differed from his earlier ones in that they were:",
    keywords: ["late", "works", "differed", "earlier"],
    options: [
      { t: "written for much larger ensembles.", correct: true },
      { t: "caused by his deafness.", trap: "那只是 some scholars 的解释，不是差别本身。", trapType: "wrong-logic" },
      { t: "written for small chamber groups.", trap: "同词，但描述的是早期作品。", trapType: "same-word" },
      { t: "unpopular with audiences.", trap: "原文没提受欢迎程度。", trapType: "out-of-scope" } ],
    evidenceIndex: 1, evidenceWhy: "第二句 turned to enormous symphonies 与开头 small chamber groups 形成对比。" },
  { sentences: [ "The startup promised to deliver groceries within ten minutes.", "To do so, it built tiny warehouses in dense neighborhoods.", "Analysts questioned whether the model could ever turn a profit.", "Within a year, the company quietly raised its delivery times." ],
    question: "According to the passage, what did analysts doubt about the startup?",
    keywords: ["analysts", "doubt", "startup"],
    options: [
      { t: "Whether it could ever become profitable.", correct: true },
      { t: "Whether it could build warehouses.", trap: "同词 warehouses，但那不是分析师质疑的点。", trapType: "same-word" },
      { t: "Whether customers wanted fast delivery.", trap: "原文没提顾客意愿。", trapType: "out-of-scope" },
      { t: "That the model was already profitable.", trap: "与 questioned...profit 相反。", trapType: "wrong-logic" } ],
    evidenceIndex: 2, evidenceWhy: "第三句：Analysts questioned whether the model could ever turn a profit。" },
  { sentences: [ "Ancient Roman concrete has survived two thousand years of waves and storms.", "Modern concrete, by contrast, often crumbles within decades.", "Researchers recently found that seawater actually strengthens the Roman mix.", "They hope to copy the recipe for longer-lasting sea walls." ],
    question: "The passage most strongly suggests that seawater affects Roman concrete by:",
    keywords: ["seawater", "Roman concrete"],
    options: [
      { t: "making it more durable over time.", correct: true },
      { t: "causing it to crumble within decades.", trap: "那描述的是 modern concrete。", trapType: "wrong-logic" },
      { t: "surviving two thousand years of storms.", trap: "同词，但答非所问。", trapType: "same-word" },
      { t: "making it cheaper to produce.", trap: "原文没提成本。", trapType: "out-of-scope" } ],
    evidenceIndex: 2, evidenceWhy: "第三句：seawater actually strengthens the Roman mix。" },
  { sentences: [ "The librarian noticed that students avoided the top-floor reading room.", "It was quiet, but the lighting was dim and the chairs were stiff.", "After new lamps and cushions arrived, the room filled up quickly.", "Attendance data confirmed the change was no coincidence." ],
    question: "According to the passage, why had students originally avoided the reading room?",
    keywords: ["students", "avoided", "reading room"],
    options: [
      { t: "It was poorly lit and uncomfortable.", correct: true },
      { t: "It was too noisy to study in.", trap: "与 It was quiet 相反。", trapType: "wrong-logic" },
      { t: "The room was on the top floor.", trap: "同词 top-floor，但那不是原因。", trapType: "same-word" },
      { t: "It was too far from the library entrance.", trap: "原文没提距离。", trapType: "out-of-scope" } ],
    evidenceIndex: 1, evidenceWhy: "第二句点明 the lighting was dim and the chairs were stiff。" },
  { sentences: [ "The coach benched his star player during the championship game.", "Reporters assumed the two had argued.", "In fact, the player had a minor injury the coach wanted to protect.", "The team went on to win without him." ],
    question: "According to the passage, why did the coach bench the star player?",
    keywords: ["coach", "bench", "player"],
    options: [
      { t: "To avoid worsening the player's injury.", correct: true },
      { t: "Because the two had argued.", trap: "那是 reporters 的假设，原文说 In fact 另有原因。", trapType: "wrong-logic" },
      { t: "The coach benched his star player.", trap: "同词复述题干，没有回答原因。", trapType: "same-word" },
      { t: "Because the player performed poorly all season.", trap: "原文没提整季表现。", trapType: "out-of-scope" } ],
    evidenceIndex: 2, evidenceWhy: "第三句：the player had a minor injury the coach wanted to protect。" },
  { sentences: [ "Early maps of the coastline were riddled with errors.", "Sailors relied on them anyway, having nothing better.", "A young surveyor spent a decade correcting the charts foot by foot.", "Her revised maps cut shipwrecks in the region dramatically." ],
    question: "The passage indicates that the surveyor's maps had which effect?",
    keywords: ["surveyor", "maps", "effect"],
    options: [
      { t: "They greatly reduced shipwrecks in the area.", correct: true },
      { t: "They were riddled with errors.", trap: "同词，但那描述的是早期地图。", trapType: "same-word" },
      { t: "They made sailors stop using maps.", trap: "原文无此说法。", trapType: "out-of-scope" },
      { t: "They increased the number of wrecks.", trap: "与 cut shipwrecks 相反。", trapType: "wrong-logic" } ],
    evidenceIndex: 3, evidenceWhy: "第四句：Her revised maps cut shipwrecks in the region dramatically。" },
];

type CloserItem = { word: string; pos: string; def: string; ex: string; contextClues?: string[] };
// 12 条带上下文线索的增强 closer 词（追加）
const CLOSER_ENHANCED: CloserItem[] = [
  { word: "ephemeral", pos: "adjective", def: "lasting for a very short time", ex: "The cherry blossoms were {word}, gone within a week of blooming.", contextClues: ["short", "gone", "within", "week"] },
  { word: "meticulous", pos: "adjective", def: "showing great attention to detail; very careful", ex: "Her {word} notes recorded every measurement down to the last decimal.", contextClues: ["notes", "every", "detail", "careful"] },
  { word: "gregarious", pos: "adjective", def: "fond of company; sociable", ex: "Unlike his shy brother, Leo was {word} and thrived at parties.", contextClues: ["Unlike", "shy", "parties", "sociable"] },
  { word: "candid", pos: "adjective", def: "truthful and straightforward; frank", ex: "In a rare {word} moment, the usually guarded senator admitted his mistake.", contextClues: ["truthful", "admitted", "guarded", "frank"] },
  { word: "prudent", pos: "adjective", def: "acting with or showing care and thought for the future", ex: "It was {word} to save money, since the winter ahead looked uncertain.", contextClues: ["save", "future", "uncertain", "careful"] },
  { word: "tenacious", pos: "adjective", def: "holding firmly to a purpose; persistent", ex: "The {word} lawyer refused to give up even after three losses.", contextClues: ["refused", "give up", "persistent", "firmly"] },
  { word: "opaque", pos: "adjective", def: "not able to be seen through; hard to understand", ex: "The instructions were so {word} that no one could follow them.", contextClues: ["no one", "follow", "understand", "unclear"] },
  { word: "abate", pos: "verb", def: "to become less intense or widespread", ex: "Only when the storm began to {word} did the ships leave the harbor.", contextClues: ["storm", "less", "intense", "leave"] },
  { word: "novel", pos: "adjective", def: "new and unusual; original", ex: "Her {word} approach solved a problem others had missed for years.", contextClues: ["new", "original", "others", "missed"] },
  { word: "scrutinize", pos: "verb", def: "to examine closely and critically", ex: "The auditor would {word} every receipt before approving the budget.", contextClues: ["examine", "every", "closely", "auditor"] },
  { word: "reticent", pos: "adjective", def: "not revealing one's thoughts readily; reserved", ex: "He stayed {word} about his plans, sharing details with no one.", contextClues: ["no one", "reserved", "sharing", "thoughts"] },
  { word: "lucid", pos: "adjective", def: "expressed clearly; easy to understand", ex: "Her {word} explanation made the hardest topic suddenly clear.", contextClues: ["clearly", "clear", "understand", "explanation"] },
];

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "at", "for", "with", "by", "as",
  "that", "this", "these", "those", "it", "its", "is", "are", "was", "were", "be", "been", "being",
  "his", "her", "their", "our", "your", "my", "he", "she", "they", "we", "you", "i", "him", "them",
  "what", "which", "who", "whom", "whose", "how", "why", "when", "where", "does", "do", "did", "not",
  "can", "could", "would", "should", "will", "shall", "may", "might", "must", "about", "from", "into",
  "than", "then", "so", "if", "no", "yes", "most", "more", "less", "very", "only", "just", "also",
  "passage", "according", "author", "text", "choice", "best", "following", "suggests", "indicates",
  "describes", "reveal", "reveals", "main", "point", "reasonably", "inferred", "directly", "function",
]);

const words = (s: string) => s.toLowerCase().match(/[a-z']+/g) ?? [];
const isContent = (w: string) => w.length >= 4 && !STOPWORDS.has(w);

// read_the_green 关键词启发式：题干里同时出现在文章中的实词——正是「回原文定位」的锚点。
function deriveKeywords(question: string, sentences: string[]): string[] {
  const passage = new Set(sentences.flatMap((s) => words(s)));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words(question)) {
    if (isContent(w) && passage.has(w) && !seen.has(w)) {
      seen.add(w);
      out.push(w);
    }
  }
  return out.slice(0, 4);
}

// 从旧题的 trap 说明文本推断陷阱类型，让分类标签普遍生效。
function deriveTrapType(trap?: string): "same-word" | "wrong-logic" | "out-of-scope" | undefined {
  if (!trap) return undefined;
  if (/opposite|contradict|reverse|相反|与.*相反|颠倒/i.test(trap)) return "wrong-logic";
  if (/not stated|never|no (mention|.* mention)|not supported|nothing in|doesn't|does not|too narrow|one detail|not the main|没提|未提|无此|原文没有|过度/i.test(trap))
    return "out-of-scope";
  if (/same word|the same|同词|原词/i.test(trap)) return "same-word";
  return undefined;
}

// closer 线索词启发式：例句里除目标词外的实词。
function deriveClues(ex: string, word: string): string[] {
  const wl = word.toLowerCase();
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words(ex.replace("{word}", " "))) {
    if (isContent(w) && w !== wl && !seen.has(w)) {
      seen.add(w);
      out.push(w);
    }
  }
  return out.slice(0, 4);
}

async function main() {
  await prisma.gameItem.deleteMany({ where: { gameType: "paraphrase" } });
  for (const item of PARAPHRASE_ITEMS) {
    await prisma.gameItem.create({ data: { gameType: "paraphrase", domain: "info_ideas", difficulty: 2, payload: item } });
  }
  console.log(`paraphrase: ${PARAPHRASE_ITEMS.length}`);

  await prisma.gameItem.deleteMany({ where: { gameType: "trim" } });
  for (const item of TRIM_ITEMS) {
    await prisma.gameItem.create({ data: { gameType: "trim", domain: "craft_structure", difficulty: 2, payload: item } });
  }
  console.log(`trim: ${TRIM_ITEMS.length}`);

  // 清理上一轮追加的 [enh] 示范题（改为就地回填，让方法论字段附着在已能进 top-100 的现有题上）
  await prisma.gameItem.deleteMany({ where: { gameType: "read_the_green", explanation: { startsWith: "[enh]" } } });
  await prisma.gameItem.deleteMany({ where: { gameType: "closer", explanation: { startsWith: "[enh]" } } });

  // 追加 8 条带 trapType 分类的精选增强题（trapType 无法从旧数据推断，这批是人工标注的示范）
  for (const item of RTG_ENHANCED) {
    await prisma.gameItem.create({ data: { gameType: "read_the_green", domain: "info_ideas", difficulty: 2, payload: item, explanation: `[enh] ${item.evidenceWhy}` } });
  }
  for (const w of CLOSER_ENHANCED) {
    await prisma.gameItem.create({ data: { gameType: "closer", domain: "words_in_context", difficulty: 2, payload: w, explanation: "[enh] context-clue word" } });
  }

  // 就地回填 read_the_green 关键词（让「关键词定位」阶段对全部题目普遍生效）
  const rtgItems = await prisma.gameItem.findMany({ where: { gameType: "read_the_green" } });
  let rtgFilled = 0;
  for (const it of rtgItems) {
    const p = it.payload as
      | { question?: string; sentences?: string[]; keywords?: string[]; options?: { correct?: boolean; trap?: string; trapType?: string }[] }
      | null;
    if (!p?.question || !Array.isArray(p.sentences) || !Array.isArray(p.options)) continue;
    const alreadyEnhanced = !!p.keywords?.length; // 精选题已带 keywords + trapType
    if (alreadyEnhanced) continue;
    const kw = deriveKeywords(p.question, p.sentences);
    // 给每个错误选项推断 trapType（分类标签）
    const options = p.options.map((o) => (o.correct || o.trapType ? o : { ...o, trapType: deriveTrapType(o.trap) }));
    const gotTrap = options.some((o) => o.trapType);
    if (kw.length === 0 && !gotTrap) continue;
    await prisma.gameItem.update({ where: { id: it.id }, data: { payload: { ...p, keywords: kw, options } } });
    rtgFilled++;
  }
  console.log(`read_the_green keywords/trapType backfilled: ${rtgFilled}/${rtgItems.length}`);

  // 就地回填 closer 线索词
  const closerItems = await prisma.gameItem.findMany({ where: { gameType: "closer" } });
  let closerFilled = 0;
  for (const it of closerItems) {
    const p = it.payload as { word?: string; ex?: string; contextClues?: string[] } | null;
    if (!p?.ex || !p.word) continue;
    if (p.contextClues?.length) continue;
    const clues = deriveClues(p.ex, p.word);
    if (clues.length === 0) continue;
    await prisma.gameItem.update({ where: { id: it.id }, data: { payload: { ...p, contextClues: clues } } });
    closerFilled++;
  }
  console.log(`closer clues backfilled: ${closerFilled}/${closerItems.length}`);

  console.log("Methodology seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
