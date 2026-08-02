// 技巧课专属练习题（gameType="lesson"），补齐存量题库覆盖不到的 6 课。
// 幂等：按 skill + question 去重，只增/就地更新，绝不清空既有数据。
// 内容源：docs/20260801-sat-strategy-compendium.md
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type TrapType =
  | "same-word"
  | "opposite"
  | "out-of-scope"
  | "too-narrow"
  | "too-extreme"
  | "fictitious-comparison"
  | "non-sequitur"
  | "tone-mismatch";

type Opt = { t: string; correct?: boolean; trap?: string; trapType?: TrapType };
type Item = {
  skill: string;
  domain: string;
  difficulty: number;
  passage: string;
  question: string;
  options: Opt[];
  why: string;
};

const CROSS_TEXT = "Based on the texts, how would the author of Text 2 most likely respond to the claim made in Text 1?";
const MAIN_PURPOSE = "Which choice best states the main purpose of the text?";
const MAIN_IDEA = "Which choice best states the main idea of the text?";
const COMPLETES = "Which choice most logically completes the text?";

const ITEMS: Item[] = [
  /* ---------------- cross-text-connections (8) ---------------- */
  {
    skill: "cross-text-connections",
    domain: "craft_structure",
    difficulty: 1,
    passage:
      "Text 1: Urban planners have long argued that adding traffic lanes to a congested highway reduces travel times, since more lanes can carry more vehicles at once.\n\nText 2: Economist Priya Nandakumar tracked twelve highway expansions over fifteen years. Travel times improved for roughly eighteen months. After that, traffic returned to its former levels as drivers who had previously avoided the route began using it again.",
    question: CROSS_TEXT,
    options: [
      {
        t: "The benefit it describes is real but temporary, disappearing once drivers adjust their behavior.",
        correct: true,
      },
      {
        t: "It is correct, since travel times on expanded highways remain permanently lower.",
        trap: "Text 2 found the improvement lasted about eighteen months before traffic returned to former levels.",
        trapType: "opposite",
      },
      {
        t: "It is wrong, because adding lanes has never been shown to improve travel times at all.",
        trap: "Text 2 explicitly reports that travel times did improve — for a while. 'Never at all' throws away half its own finding.",
        trapType: "too-extreme",
      },
      {
        t: "It ignores the substantial construction costs that highway expansions require.",
        trap: "Costs are never mentioned in either text. This objection comes from outside both passages.",
        trapType: "out-of-scope",
      },
    ],
    why: "Text 2 confirms the short-term gain and then limits it — the classic 'right, but only up to a point' relationship the SAT keys most often.",
  },
  {
    skill: "cross-text-connections",
    domain: "craft_structure",
    difficulty: 1,
    passage:
      "Text 1: Because honeybees pollinate so many crops, conservationists frequently urge cities to install beehives on rooftops as a way of supporting pollinators generally.\n\nText 2: Entomologist Laurent Beaufort notes that honeybees are a managed species, not a wild one. Where rooftop hives are dense, he has recorded declines in wild bee populations, which lose out competing with honeybees for a limited supply of flowers.",
    question: CROSS_TEXT,
    options: [
      {
        t: "The strategy may help one species while harming the wider group of pollinators it is meant to protect.",
        correct: true,
      },
      {
        t: "The strategy is effective, since honeybees and wild bees benefit equally from rooftop hives.",
        trap: "Text 2 reports declines in wild bees where hives are dense — the reverse of benefiting equally.",
        trapType: "opposite",
      },
      {
        t: "Cities should be required by law to remove all existing rooftop beehives immediately.",
        trap: "Text 2 identifies a problem; it never recommends any policy at all.",
        trapType: "too-extreme",
      },
      {
        t: "Honeybees pollinate a great many of the crops that people rely on.",
        trap: "That simply repeats Text 1's premise. It is not a response to the claim.",
        trapType: "same-word",
      },
    ],
    why: "Text 2 accepts that honeybees matter but shows the policy's effect on the broader category — the relationship is 'good for the named species, bad for the goal'.",
  },
  {
    skill: "cross-text-connections",
    domain: "craft_structure",
    difficulty: 2,
    passage:
      "Text 1: Historians of photography generally treat the 1888 hand camera as the moment amateur photography began, since it was the first camera simple enough for untrained users.\n\nText 2: Curator Ama Osei points out that photographic clubs for amateurs existed in at least nine cities by 1875. Their members used complicated plate cameras and developed their own negatives. What 1888 changed, she argues, was not who could photograph but how many.",
    question: CROSS_TEXT,
    options: [
      {
        t: "It identifies the correct year but mischaracterizes the nature of the change that occurred.",
        correct: true,
      },
      {
        t: "It is entirely mistaken, since amateur photography did not exist before 1888.",
        trap: "Text 2's whole point is that amateur clubs existed by 1875. This reverses the passage.",
        trapType: "opposite",
      },
      {
        t: "It correctly identifies 1888 as the first year untrained users could operate a camera.",
        trap: "Osei's amateurs used complicated plate cameras and did their own developing, so simplicity was not the dividing line.",
        trapType: "opposite",
      },
      {
        t: "It overlooks the fact that photographic clubs charged membership fees that many could not afford.",
        trap: "Fees are never mentioned. Text 2 discusses how many people photographed, not what it cost them.",
        trapType: "out-of-scope",
      },
    ],
    why: "Osei keeps 1888 as a turning point but redefines what turned — a refinement, not a rejection.",
  },
  {
    skill: "cross-text-connections",
    domain: "craft_structure",
    difficulty: 2,
    passage:
      "Text 1: Sleep researchers commonly advise that adults need eight hours of sleep nightly, and that consistently sleeping less produces measurable cognitive decline.\n\nText 2: In a study of 4,000 adults, Hyun-woo Bae found that performance on memory and attention tasks was best among those sleeping between seven and eight hours. Both shorter and longer sleep were associated with weaker performance — a pattern the eight-hour guideline does not capture.",
    question: CROSS_TEXT,
    options: [
      {
        t: "The guideline points in a useful direction but treats as a minimum what the data suggest is closer to an upper bound.",
        correct: true,
      },
      {
        t: "The guideline is fully supported, since Bae found the best performance among those sleeping eight hours or more.",
        trap: "Bae found longer sleep was associated with weaker performance, not better.",
        trapType: "opposite",
      },
      {
        t: "The guideline is useless, since sleep duration has no relationship to cognitive performance.",
        trap: "Bae found a clear relationship — just not a straight line. 'No relationship' contradicts the study outright.",
        trapType: "opposite",
      },
      {
        t: "The guideline fails to account for how sleep quality differs from sleep duration.",
        trap: "Quality versus duration is a reasonable idea, but neither text raises it.",
        trapType: "out-of-scope",
      },
    ],
    why: "Bae's curve peaks at seven to eight hours and falls on both sides, so the eight-hour floor misdescribes the shape of his finding without being wholly wrong.",
  },
  {
    skill: "cross-text-connections",
    domain: "craft_structure",
    difficulty: 3,
    passage:
      "Text 1: Literary scholars have read the abrupt ending of Odugbemi's 1961 novel as evidence that the manuscript was left unfinished at her death.\n\nText 2: Reviewing Odugbemi's correspondence, Marta Kowalski found three letters describing the final chapter as complete and deliberately truncated. Odugbemi wrote that she wanted readers \"turned out of the house mid-sentence, as her characters were.\"",
    question: CROSS_TEXT,
    options: [
      {
        t: "The ending's abruptness is a deliberate effect rather than a sign of incompleteness.",
        correct: true,
      },
      {
        t: "The manuscript was indeed left unfinished, though Odugbemi had intended to complete it.",
        trap: "Kowalski's letters say the chapter was complete. This keeps the reading Text 2 overturns.",
        trapType: "opposite",
      },
      {
        t: "Odugbemi's correspondence proves that all abrupt literary endings are intentional.",
        trap: "Evidence about one novel cannot establish a rule about every abrupt ending anywhere.",
        trapType: "too-extreme",
      },
      {
        t: "Odugbemi's 1961 novel ends abruptly, in the middle of a sentence.",
        trap: "This restates the shared observation both texts start from. It takes no position on the disagreement.",
        trapType: "same-word",
      },
    ],
    why: "Kowalski accepts the observation (abrupt ending) and reverses its interpretation (design, not incompletion).",
  },
  {
    skill: "cross-text-connections",
    domain: "craft_structure",
    difficulty: 3,
    passage:
      "Text 1: Because remote work removes commuting time, management researchers have predicted it would raise the total hours employees spend on focused, uninterrupted tasks.\n\nText 2: Analyzing calendar data from 61,000 employees, Ingrid Sølvberg found that meeting hours rose by 22% after offices closed. The commute did vanish, but much of the reclaimed time was absorbed by scheduled meetings rather than by focused work.",
    question: CROSS_TEXT,
    options: [
      {
        t: "Its premise about commuting holds, but the time freed up did not go where the prediction assumed it would.",
        correct: true,
      },
      {
        t: "Its premise is false, since remote employees continued to commute at similar rates.",
        trap: "Text 2 states plainly that the commute did vanish. The premise is not what failed.",
        trapType: "opposite",
      },
      {
        t: "It is confirmed, since focused work rose in proportion to the time saved on commuting.",
        trap: "Sølvberg found the reclaimed time was absorbed by meetings, not focused work.",
        trapType: "opposite",
      },
      {
        t: "It fails to consider that employees working from home report higher job satisfaction.",
        trap: "Job satisfaction appears in neither text; the disagreement is about where hours went.",
        trapType: "out-of-scope",
      },
    ],
    why: "Text 2 grants the premise and breaks the inference — the prediction assumed freed time defaults to focused work, and the data say otherwise.",
  },
  {
    skill: "cross-text-connections",
    domain: "craft_structure",
    difficulty: 4,
    passage:
      "Text 1: Ecologists modelling species loss on islands have generally assumed that an island's area is the dominant predictor: halve the area, and roughly half the species eventually disappear.\n\nText 2: Across 340 land-bridge islands, Fatima Zahra Idrissi found area predicted species loss well — but only for islands isolated less than 8,000 years ago. On older islands, losses had largely finished, and area predicted almost nothing about what happened next.",
    question: CROSS_TEXT,
    options: [
      {
        t: "Area is a strong predictor only while an island's losses are still unfolding, which limits rather than refutes the model.",
        correct: true,
      },
      {
        t: "Area is a reliable predictor of species loss on islands regardless of how long they have been isolated.",
        trap: "Idrissi found area predicted almost nothing on islands isolated more than 8,000 years ago.",
        trapType: "opposite",
      },
      {
        t: "Area has no predictive value for species loss and should be abandoned as a variable.",
        trap: "It predicted losses well on the younger islands. 'No predictive value' discards Idrissi's own positive result.",
        trapType: "too-extreme",
      },
      {
        t: "Older islands lose more species overall than younger islands do.",
        trap: "Text 2 says losses on older islands had largely finished — it never compares total losses between older and younger islands.",
        trapType: "out-of-scope",
      },
    ],
    why: "The finding adds a boundary condition (time since isolation) rather than overturning the area–loss relationship.",
  },
  {
    skill: "cross-text-connections",
    domain: "craft_structure",
    difficulty: 4,
    passage:
      "Text 1: Because bilingual children hear each of their languages less often than monolingual children hear their single language, developmental psychologists once predicted that bilingual children would reach vocabulary milestones later in both languages.\n\nText 2: Nadia Haddad measured vocabulary in 900 bilingual toddlers. Counted language by language, the prediction held. Counted across both languages together — every concept the child could name in either one — bilingual and monolingual toddlers were indistinguishable.",
    question: CROSS_TEXT,
    options: [
      {
        t: "Whether the prediction holds depends entirely on whether vocabulary is counted within one language or across both.",
        correct: true,
      },
      {
        t: "The prediction is confirmed, since bilingual toddlers lagged behind on every measure Haddad used.",
        trap: "On the combined measure the two groups were indistinguishable — not every measure showed a lag.",
        trapType: "opposite",
      },
      {
        t: "The prediction is refuted, since bilingual toddlers know more words than monolingual toddlers do.",
        trap: "Haddad found the groups indistinguishable on the combined count, not that bilinguals knew more.",
        trapType: "too-extreme",
      },
      {
        t: "Bilingual children hear each of their languages less often than monolingual children hear theirs.",
        trap: "That is Text 1's premise restated. Haddad never disputes it — she disputes what follows from it.",
        trapType: "same-word",
      },
    ],
    why: "Haddad's result is genuinely two-sided; the keyed answer names the measurement choice that decides which side you see.",
  },

  /* ---------------- rhetorical-synthesis (8) ---------------- */
  {
    skill: "rhetorical-synthesis",
    domain: "expression_conventions",
    difficulty: 1,
    passage:
      "While researching a topic, a student has taken the following notes:\n• The Sahara Desert covers about 9.2 million square kilometers.\n• The Arabian Desert covers about 2.3 million square kilometers.\n• Both are classified as hot deserts.\n• Both receive less than 100 millimeters of rain per year.\n\nThe student wants to emphasize a difference between the two deserts.",
    question:
      "Which choice most effectively uses relevant information from the notes to accomplish this goal?",
    options: [
      {
        t: "The Sahara Desert covers about 9.2 million square kilometers, whereas the Arabian Desert covers about 2.3 million.",
        correct: true,
      },
      {
        t: "Both the Sahara and the Arabian Desert are classified as hot deserts that receive less than 100 millimeters of rain per year.",
        trap: "Accurate, but it emphasizes what the two deserts share. The goal asked for a difference.",
        trapType: "opposite",
      },
      {
        t: "The Sahara Desert covers about 9.2 million square kilometers.",
        trap: "One desert only. A difference needs both sides of the comparison in the sentence.",
        trapType: "too-narrow",
      },
      {
        t: "The Sahara Desert is far more difficult for travelers to cross than the Arabian Desert is.",
        trap: "Nothing in the notes concerns difficulty of travel.",
        trapType: "out-of-scope",
      },
    ],
    why: "'Whereas' performs the contrast the goal names, and both areas appear so the difference is visible.",
  },
  {
    skill: "rhetorical-synthesis",
    domain: "expression_conventions",
    difficulty: 1,
    passage:
      "While researching a topic, a student has taken the following notes:\n• Kintsugi is a Japanese method of repairing broken pottery.\n• The cracks are filled with lacquer mixed with powdered gold.\n• The repair is left visible rather than disguised.\n• The technique dates to at least the fifteenth century.\n\nThe student wants to introduce kintsugi to an audience unfamiliar with it.",
    question:
      "Which choice most effectively uses relevant information from the notes to accomplish this goal?",
    options: [
      {
        t: "Kintsugi is a Japanese method of repairing broken pottery in which the cracks are filled with gold-flecked lacquer and deliberately left visible.",
        correct: true,
      },
      {
        t: "The technique dates to at least the fifteenth century.",
        trap: "A date alone tells an unfamiliar audience nothing about what kintsugi actually is.",
        trapType: "too-narrow",
      },
      {
        t: "Unlike most repair techniques, kintsugi does not attempt to disguise the damage it mends.",
        trap: "The notes say nothing about what most other repair techniques do, so the comparison is invented — and an introduction still has to say that kintsugi is a Japanese pottery repair using gold-flecked lacquer.",
        trapType: "fictitious-comparison",
      },
      {
        t: "Kintsugi reflects a Japanese philosophy that finds beauty in imperfection and impermanence.",
        trap: "An appealing sentence, but no note mentions philosophy, beauty, or impermanence.",
        trapType: "out-of-scope",
      },
    ],
    why: "An introduction has to say what the thing is; the keyed sentence names the practice and its defining feature using only supplied notes.",
  },
  {
    skill: "rhetorical-synthesis",
    domain: "expression_conventions",
    difficulty: 2,
    passage:
      "While researching a topic, a student has taken the following notes:\n• Rachel Carson published Silent Spring in 1962.\n• The book documented the effects of the pesticide DDT on bird populations.\n• Carson was trained as a marine biologist.\n• Silent Spring is widely credited with prompting the US ban on agricultural DDT in 1972.\n\nThe student wants to emphasize the book's impact on policy.",
    question:
      "Which choice most effectively uses relevant information from the notes to accomplish this goal?",
    options: [
      {
        t: "Silent Spring, published in 1962, is widely credited with prompting the 1972 US ban on agricultural DDT.",
        correct: true,
      },
      {
        t: "Rachel Carson, who was trained as a marine biologist, published Silent Spring in 1962.",
        trap: "True and relevant to Carson, but it says nothing about the book's effect on policy.",
        trapType: "too-narrow",
      },
      {
        t: "Silent Spring documented the effects of the pesticide DDT on bird populations.",
        trap: "This gives the book's subject, not its consequences. The goal was impact on policy.",
        trapType: "too-narrow",
      },
      {
        t: "Silent Spring remains the most influential work of environmental writing ever published.",
        trap: "The notes support a specific policy outcome, not a superlative ranking against all environmental writing.",
        trapType: "too-extreme",
      },
    ],
    why: "Only the keyed sentence links the book to a policy outcome, which is exactly the stated goal.",
  },
  {
    skill: "rhetorical-synthesis",
    domain: "expression_conventions",
    difficulty: 2,
    passage:
      "While researching a topic, a student has taken the following notes:\n• The Antikythera mechanism was recovered from a shipwreck in 1901.\n• It is a geared bronze device built in ancient Greece.\n• It was used to predict the positions of the sun and moon.\n• Devices of comparable gearing complexity do not reappear in the surviving record for roughly 1,400 years.\n\nThe student wants to emphasize how unusual the device is for its period.",
    question:
      "Which choice most effectively uses relevant information from the notes to accomplish this goal?",
    options: [
      {
        t: "The ancient Greek Antikythera mechanism used bronze gearing of a complexity that does not reappear in the surviving record for roughly 1,400 years.",
        correct: true,
      },
      {
        t: "The Antikythera mechanism, recovered from a shipwreck in 1901, was used to predict the positions of the sun and moon.",
        trap: "Two accurate facts, but neither one indicates that the device was unusual for its time.",
        trapType: "too-narrow",
      },
      {
        t: "The Antikythera mechanism was recovered from a shipwreck in 1901.",
        trap: "Its discovery date says nothing about how it compared with other devices of its own period.",
        trapType: "too-narrow",
      },
      {
        t: "The Antikythera mechanism proves that ancient Greek engineering was more advanced than Roman engineering.",
        trap: "Roman engineering never appears in the notes; the comparison is invented.",
        trapType: "fictitious-comparison",
      },
    ],
    why: "The 1,400-year gap is the only note that establishes unusualness, so the goal forces its inclusion.",
  },
  {
    skill: "rhetorical-synthesis",
    domain: "expression_conventions",
    difficulty: 3,
    passage:
      "While researching a topic, a student has taken the following notes:\n• Composer Florence Price submitted scores under her own name and was frequently rejected.\n• In 1933 the Chicago Symphony premiered her Symphony in E minor.\n• It was the first symphony by a Black woman performed by a major American orchestra.\n• Dozens of her manuscripts were found in an abandoned house in 2009.\n\nThe student wants to explain why the 2009 discovery mattered to scholars.",
    question:
      "Which choice most effectively uses relevant information from the notes to accomplish this goal?",
    options: [
      {
        t: "The dozens of manuscripts found in an abandoned house in 2009 substantially expanded the body of Price's work available to scholars.",
        correct: true,
      },
      {
        t: "In 1933 the Chicago Symphony premiered Price's Symphony in E minor, the first symphony by a Black woman performed by a major American orchestra.",
        trap: "A significant fact about 1933, not about why the 2009 find mattered.",
        trapType: "too-narrow",
      },
      {
        t: "Price submitted scores under her own name and was frequently rejected.",
        trap: "Background on her career; it does not explain the significance of the discovery.",
        trapType: "too-narrow",
      },
      {
        t: "The 2009 discovery revealed that Price was the most prolific American composer of her generation.",
        trap: "The notes say dozens of manuscripts were found — not that she out-produced her contemporaries.",
        trapType: "too-extreme",
      },
    ],
    why: "'Explain why it mattered to scholars' requires connecting the find to what scholars gained; only the keyed sentence does that.",
  },
  {
    skill: "rhetorical-synthesis",
    domain: "expression_conventions",
    difficulty: 3,
    passage:
      "While researching a topic, a student has taken the following notes:\n• Mangrove forests grow along tropical coastlines.\n• Their root systems trap sediment and slow incoming waves.\n• A 2019 study measured wave height reduction of up to 66% across 100 meters of mangrove.\n• Roughly a third of the world's mangrove cover was lost between 1980 and 2000.\n\nThe student wants to specify the degree of coastal protection mangroves provide.",
    question:
      "Which choice most effectively uses relevant information from the notes to accomplish this goal?",
    options: [
      {
        t: "A 2019 study found that 100 meters of mangrove forest reduced wave height by as much as 66%.",
        correct: true,
      },
      {
        t: "Mangrove root systems trap sediment and slow incoming waves along tropical coastlines.",
        trap: "It describes the mechanism but gives no measure of how much protection results. The goal asked for degree.",
        trapType: "too-narrow",
      },
      {
        t: "Roughly a third of the world's mangrove cover was lost between 1980 and 2000.",
        trap: "That quantifies loss, not protection.",
        trapType: "too-narrow",
      },
      {
        t: "Mangrove forests protect coastlines more effectively than any engineered seawall.",
        trap: "Seawalls appear nowhere in the notes, so the comparison is manufactured.",
        trapType: "fictitious-comparison",
      },
    ],
    why: "'Specify the degree' demands the number; the 66% figure is the only note that supplies one.",
  },
  {
    skill: "rhetorical-synthesis",
    domain: "expression_conventions",
    difficulty: 4,
    passage:
      "While researching a topic, a student has taken the following notes:\n• Archaeologist Wen Zhu excavated a Neolithic site at Jiahu.\n• She recovered flutes carved from the wing bones of red-crowned cranes.\n• The flutes are approximately 8,000 years old.\n• Several are still playable and produce a recognizable scale.\n• Similar bone flutes from other sites are typically fragmentary.\n\nThe student wants to emphasize what distinguishes the Jiahu flutes from comparable finds.",
    question:
      "Which choice most effectively uses relevant information from the notes to accomplish this goal?",
    options: [
      {
        t: "Unlike the typically fragmentary bone flutes recovered elsewhere, several of the 8,000-year-old Jiahu flutes remain playable and produce a recognizable scale.",
        correct: true,
      },
      {
        t: "The flutes recovered at Jiahu were carved from the wing bones of red-crowned cranes and are approximately 8,000 years old.",
        trap: "Accurate description, but nothing here sets Jiahu apart from other sites.",
        trapType: "too-narrow",
      },
      {
        t: "Several of the Jiahu flutes are still playable and produce a recognizable scale.",
        trap: "Closer, but a distinguishing claim needs the comparison — without the fragmentary finds elsewhere, nothing is being distinguished.",
        trapType: "too-narrow",
      },
      {
        t: "The Jiahu flutes demonstrate that Neolithic musicians used the same scales that are common today.",
        trap: "The notes say the flutes produce a recognizable scale, not that Neolithic musicians used modern scales.",
        trapType: "too-extreme",
      },
    ],
    why: "Distinguishing requires both terms of the comparison; only the keyed sentence pairs Jiahu's condition against the fragmentary norm.",
  },
  {
    skill: "rhetorical-synthesis",
    domain: "expression_conventions",
    difficulty: 4,
    passage:
      "While researching a topic, a student has taken the following notes:\n• Physicist Chien-Shiung Wu designed the 1956 experiment testing conservation of parity.\n• The experiment required cobalt-60 cooled to near absolute zero.\n• Her results overturned a principle physicists had assumed held universally.\n• The 1957 Nobel Prize went to Lee and Yang, who had proposed the test.\n• Wu was not included in the prize.\n\nThe student wants to emphasize the significance of Wu's experimental result.",
    question:
      "Which choice most effectively uses relevant information from the notes to accomplish this goal?",
    options: [
      {
        t: "Wu's 1956 experiment overturned conservation of parity, a principle physicists had assumed held universally.",
        correct: true,
      },
      {
        t: "Although Wu designed the 1956 experiment, the 1957 Nobel Prize went to Lee and Yang, and she was not included.",
        trap: "This emphasizes the credit she was denied — a different point from the significance of the result itself.",
        trapType: "too-narrow",
      },
      {
        t: "Wu's experiment required cobalt-60 cooled to a temperature near absolute zero.",
        trap: "A demanding technique, but difficulty of method is not significance of result.",
        trapType: "too-narrow",
      },
      {
        t: "Wu's exclusion from the Nobel Prize proves that the selection committee was biased against women.",
        trap: "The notes record the exclusion; they establish no motive, and 'proves' vastly overstates what one case can show.",
        trapType: "too-extreme",
      },
    ],
    why: "Significance of the result means what the result changed — overturning a universally assumed principle.",
  },

  /* ---------------- science-passages (5) ---------------- */
  {
    skill: "science-passages",
    domain: "science",
    difficulty: 1,
    passage:
      "Tardigrades survive complete desiccation by replacing the water in their cells with a sugar called trehalose, which hardens into a glassy solid. Biologist Ola Lindqvist tested whether this alone explains their durability. She engineered yeast cells to produce trehalose and dried them. Survival improved, but only to about a third of the tardigrade rate — suggesting trehalose is one component of the mechanism rather than the whole of it.",
    question: MAIN_IDEA,
    options: [
      {
        t: "An experiment indicates that trehalose contributes to desiccation survival but does not fully account for it.",
        correct: true,
      },
      {
        t: "Trehalose is the sole reason tardigrades survive complete desiccation.",
        trap: "The passage concludes the opposite — trehalose is 'one component… rather than the whole of it'.",
        trapType: "opposite",
      },
      {
        t: "Lindqvist engineered yeast cells to produce trehalose and then dried them.",
        trap: "That is the method, one step in the study, not the point the passage makes.",
        trapType: "too-narrow",
      },
      {
        t: "Yeast cells are a poor model organism for studying desiccation tolerance.",
        trap: "The passage never evaluates yeast as a model; it reports what the yeast experiment showed.",
        trapType: "out-of-scope",
      },
    ],
    why: "The skeleton runs hypothesis → method → result → limitation, and the passage lands on the limitation: partial, not complete, explanation.",
  },
  {
    skill: "science-passages",
    domain: "science",
    difficulty: 2,
    passage:
      "Certain desert ants navigate by counting steps. To test this, Matthias Rüppell glued tiny stilts onto ants leaving their nest, lengthening their stride for the return trip. The stilted ants overshot the nest by roughly the proportion their stride had increased. Ants whose legs had instead been shortened stopped short by a comparable proportion.",
    question: "Which choice best states the function of the final sentence in the text as a whole?",
    options: [
      {
        t: "It supplies a complementary result that strengthens the interpretation offered by the first result.",
        correct: true,
      },
      {
        t: "It identifies a limitation that calls the stilt experiment's result into question.",
        trap: "Shortened-leg ants erring in the opposite direction reinforces the step-counting explanation rather than undermining it.",
        trapType: "opposite",
      },
      {
        t: "It explains how ants perceive distance using visual landmarks rather than steps.",
        trap: "Landmarks are never mentioned; the passage is entirely about stride length.",
        trapType: "out-of-scope",
      },
      {
        t: "It describes ants whose legs had been shortened stopping short of the nest.",
        trap: "That restates the sentence's content instead of naming what the sentence does for the passage.",
        trapType: "same-word",
      },
    ],
    why: "Function questions ask about the sentence's job: here it is the mirror-image test that makes the step-counting reading much harder to explain away.",
  },
  {
    skill: "science-passages",
    domain: "science",
    difficulty: 3,
    passage:
      "Coastal fog supplies water to redwood forests, and researchers have proposed that redwoods absorb it directly through their needles rather than through their roots. Ecologist Sun-hee Rhee sprayed isotopically labelled fog onto the crowns of twelve redwoods while sealing the soil beneath. Within seventy-two hours the label appeared in branch tissue throughout each tree, though the quantity absorbed varied more than fivefold among individuals. These results indicate that ______",
    question: COMPLETES,
    options: [
      {
        t: "redwoods can take up fog water through their foliage, though how much they take up differs considerably from tree to tree.",
        correct: true,
      },
      {
        t: "redwoods absorb all of the water they require directly through their needles.",
        trap: "The study shows foliar uptake occurs; it never measures what share of a tree's total water need it covers.",
        trapType: "too-extreme",
      },
      {
        t: "redwoods cannot survive in regions where coastal fog is absent.",
        trap: "Survival without fog is never tested or discussed in the passage.",
        trapType: "out-of-scope",
      },
      {
        t: "isotopically labelled fog was sprayed onto the crowns of twelve redwoods.",
        trap: "Repeating the method is not an inference — the blank asks what the results let you conclude.",
        trapType: "same-word",
      },
    ],
    why: "Both halves of the result must survive: the label reached branch tissue (uptake happens) and varied fivefold (amount differs).",
  },
  {
    skill: "science-passages",
    domain: "science",
    difficulty: 3,
    passage:
      "Antibiotic resistance is usually attributed to overuse in medicine. Surveying river sediment upstream and downstream of pharmaceutical manufacturing plants, microbiologist Ravi Anantharaman found resistance genes 40 times more abundant downstream. The upstream sediment, drawn from the same rivers, showed background levels comparable to remote sites.",
    question: MAIN_PURPOSE,
    options: [
      {
        t: "To present evidence that a source of antibiotic resistance other than medical overuse deserves attention",
        correct: true,
      },
      {
        t: "To demonstrate that overuse of antibiotics in medicine does not contribute to resistance",
        trap: "The passage adds a source; it never denies the medical one. Nothing here tests medical overuse at all.",
        trapType: "opposite",
      },
      {
        t: "To describe how river sediment samples are collected upstream and downstream of factories",
        trap: "The sampling design is the method, not the purpose of the passage.",
        trapType: "too-narrow",
      },
      {
        t: "To argue that pharmaceutical manufacturing should be relocated away from river systems",
        trap: "No recommendation appears in the passage; it reports a measurement.",
        trapType: "out-of-scope",
      },
    ],
    why: "The upstream comparison is what makes this a claim about manufacturing as an additional source — the purpose is to put that source on the table.",
  },
  {
    skill: "science-passages",
    domain: "science",
    difficulty: 4,
    passage:
      "Migratory songbirds detect Earth's magnetic field, and one hypothesis holds that the mechanism is light-dependent, operating through proteins in the retina. Testing European robins, Annika Vestergaard found that birds oriented correctly under blue light but were disoriented under red light of equal intensity. A second group, tested under blue light but with radio-frequency noise applied, was also disoriented — an effect predicted for a quantum-based receptor but not for one based on magnetic particles.",
    question: MAIN_IDEA,
    options: [
      {
        t: "Two experimental results together point toward a light-dependent, quantum-based magnetic sense rather than a particle-based one.",
        correct: true,
      },
      {
        t: "European robins are unable to orient themselves under any artificial lighting conditions.",
        trap: "The birds oriented correctly under blue light. 'Any artificial lighting' contradicts the first result.",
        trapType: "opposite",
      },
      {
        t: "Radio-frequency noise disrupts the navigation of all migratory songbird species.",
        trap: "One species was tested. The passage supports no claim about all songbirds.",
        trapType: "too-extreme",
      },
      {
        t: "European robins were disoriented under red light of equal intensity to the blue light.",
        trap: "One result quoted from the passage, without the conclusion the two results jointly support.",
        trapType: "too-narrow",
      },
    ],
    why: "Both findings are needed: wavelength dependence points to light-dependence, and radio-frequency sensitivity discriminates between the two candidate mechanisms.",
  },

  /* ---------------- history-social-studies (6) ---------------- */
  {
    skill: "history-social-studies",
    domain: "history_social_science",
    difficulty: 1,
    passage:
      "In an 1848 petition to the state legislature, a group of mill workers wrote: “We do not ask that our wages be raised, though raised they ought to be. We ask only this: that the hours of labour be fixed by law at ten, so that a portion of the day may remain to us for such instruction and rest as free men require.”",
    question: MAIN_PURPOSE,
    options: [
      {
        t: "To request a legal limit on the working day, setting aside the separate question of pay",
        correct: true,
      },
      {
        t: "To argue that mill workers' wages should be raised immediately",
        trap: "The petitioners explicitly set the wage question aside — 'We do not ask that our wages be raised'.",
        trapType: "opposite",
      },
      {
        t: "To describe the instruction and rest that mill workers received each day",
        trap: "The petition asks for time to be created for those things; it does not describe time they already had.",
        trapType: "same-word",
      },
      {
        t: "To demand that the state legislature shut down mills operating unsafe machinery",
        trap: "Safety and machinery never appear in the petition.",
        trapType: "out-of-scope",
      },
    ],
    why: "The concession ('though raised they ought to be') is deliberately separated from the ask ('We ask only this'), and the purpose lives in the ask.",
  },
  {
    skill: "history-social-studies",
    domain: "history_social_science",
    difficulty: 2,
    passage:
      "From an 1871 essay on public libraries: “It is objected, and not unreasonably, that a library serves chiefly those already possessed of leisure. Yet the objection mistakes the present for the permanent. A library open in the evening hours serves the clerk and the apprentice as readily as the gentleman, and it is upon such hours that the whole question turns.”",
    question: MAIN_PURPOSE,
    options: [
      {
        t: "To answer an objection to public libraries by identifying a change that would address it",
        correct: true,
      },
      {
        t: "To argue that public libraries chiefly serve people who already have leisure time",
        trap: "That is the objection the author introduces in order to answer. 'It is objected' marks a concession, not the author's position.",
        trapType: "tone-mismatch",
      },
      {
        t: "To describe the reading habits of clerks and apprentices in the 1870s",
        trap: "Clerks and apprentices appear as an example within the argument, not as its subject.",
        trapType: "too-narrow",
      },
      {
        t: "To propose that public libraries be funded through a tax on private book sales",
        trap: "No funding mechanism is mentioned anywhere in the passage.",
        trapType: "out-of-scope",
      },
    ],
    why: "Translated to plain English: 'People say libraries only help the leisured. Fair — but open them at night and that stops being true.' The purpose sits in the rebuttal.",
  },
  {
    skill: "history-social-studies",
    domain: "history_social_science",
    difficulty: 2,
    passage:
      "Historians once explained the rapid spread of the printing press across Europe by pointing to falling paper prices. Analyzing the records of 214 early print shops, Beatriz Salgado found that paper remained the single largest cost in every shop she examined, often exceeding half of production expenses, and that its price fell only modestly over the period.",
    question: MAIN_IDEA,
    options: [
      {
        t: "Evidence from early print shops complicates a long-standing explanation for the press's rapid spread.",
        correct: true,
      },
      {
        t: "Paper prices fell sharply during the period when printing spread across Europe.",
        trap: "Salgado found prices fell only modestly — the reverse of the claim she is testing.",
        trapType: "opposite",
      },
      {
        t: "Paper was the single largest cost for early print shops.",
        trap: "True and important, but it is the evidence rather than the point the passage is making with it.",
        trapType: "too-narrow",
      },
      {
        t: "The printing press would not have spread without significant support from wealthy patrons.",
        trap: "Patronage is never mentioned. The passage undermines one explanation without proposing another.",
        trapType: "out-of-scope",
      },
    ],
    why: "This is a historian's analysis, not a period document: the arc is 'standard explanation → data → the explanation doesn't fit'.",
  },
  {
    skill: "history-social-studies",
    domain: "history_social_science",
    difficulty: 3,
    passage:
      "From an 1892 address by a delegate to a national farmers' convention: “We are told that the remedy for low prices is to grow less. Notwithstanding the confidence with which this counsel is offered, it asks the farmer alone to bear a burden the railroad and the miller share in creating. Let those who set the freight rate and the milling charge first show what they will surrender, and we will hear the rest.”",
    question: "Based on the text, how would the speaker most likely characterize the advice to grow less?",
    options: [
      {
        t: "As unfair, because it places the entire cost of a shared problem on one party",
        correct: true,
      },
      {
        t: "As sensible, since reducing supply is the most direct way to raise prices",
        trap: "'Notwithstanding the confidence with which this counsel is offered' signals rejection, not agreement.",
        trapType: "tone-mismatch",
      },
      {
        t: "As impossible, since farmers lack any means of coordinating a reduction in planting",
        trap: "The speaker objects to the fairness of the advice, never to its feasibility.",
        trapType: "out-of-scope",
      },
      {
        t: "As a remedy for the low prices that farmers were then receiving",
        trap: "That repeats how the advice was presented to the farmers, not how the speaker characterizes it.",
        trapType: "same-word",
      },
    ],
    why: "Plain English: 'They say we should grow less. But why should farmers give something up when railroads and millers don't?' The attitude belongs to the speaker, not to the counsel quoted.",
  },
  {
    skill: "history-social-studies",
    domain: "history_social_science",
    difficulty: 3,
    passage:
      "Scholars of the Great Migration have generally emphasized wartime factory demand as the pull drawing Black Southerners north after 1916. Examining letters sent to the Chicago Defender, Adaora Nwankwo found that correspondents mentioned schooling for their children nearly as often as work, and mentioned the ability to vote more often than either. This evidence most directly suggests that ______",
    question: COMPLETES,
    options: [
      {
        t: "the motivations migrants themselves described were broader than the labor-demand explanation alone suggests.",
        correct: true,
      },
      {
        t: "wartime factory demand played no role in the decisions of Black Southerners to move north.",
        trap: "Work was mentioned nearly as often as schooling. The letters supplement the labor explanation rather than eliminating it.",
        trapType: "too-extreme",
      },
      {
        t: "correspondents to the Chicago Defender mentioned the ability to vote more often than work or schooling.",
        trap: "That restates the finding rather than drawing the conclusion the blank calls for.",
        trapType: "same-word",
      },
      {
        t: "letters are a more reliable historical source than employment records are.",
        trap: "The passage never compares the reliability of source types.",
        trapType: "fictitious-comparison",
      },
    ],
    why: "The inference the evidence supports is that migrants' stated reasons were wider than the standard account — not that the standard account is false.",
  },
  {
    skill: "history-social-studies",
    domain: "history_social_science",
    difficulty: 4,
    passage:
      "From an 1856 pamphlet: “Insofar as the law regards a married woman's earnings as her husband's property, it does not merely take from her what she has made; it takes from her the motive to make anything. Nor is this an argument for her benefit only. A household in which but one hand has cause to labour is the poorer by the labour of the other, and the commonwealth is poorer still.”",
    question: MAIN_PURPOSE,
    options: [
      {
        t: "To argue against a property law by contending that its harms extend beyond the woman affected",
        correct: true,
      },
      {
        t: "To explain how the law assigns a married woman's earnings to her husband",
        trap: "The passage states the law in its first clause only in order to attack it. Explanation is the setup, not the purpose.",
        trapType: "too-narrow",
      },
      {
        t: "To argue that married women should be required by law to seek paid employment",
        trap: "The pamphlet objects to removing a motive to work; it never proposes compelling anyone to work.",
        trapType: "opposite",
      },
      {
        t: "To describe the general poverty of households in the mid-nineteenth century",
        trap: "Household poverty appears as a consequence in the argument, not as the passage's subject.",
        trapType: "out-of-scope",
      },
    ],
    why: "'Nor is this an argument for her benefit only' is the hinge: the author widens the claim from the individual to the household and the commonwealth.",
  },

  /* ---------------- humanities-passages (6) ---------------- */
  {
    skill: "humanities-passages",
    domain: "humanities",
    difficulty: 1,
    passage:
      "Photographer Tomás Rivas spent four years photographing the same intersection at the same hour. The individual images are unremarkable: parked cars, a shuttered kiosk, one recurring pigeon. Assembled in sequence, however, they register changes no single photograph could hold — a tree thickening, a storefront changing hands three times, the slow arrival of scaffolding.",
    question: MAIN_IDEA,
    options: [
      {
        t: "The value of Rivas's project lies in the accumulation of images rather than in any individual photograph.",
        correct: true,
      },
      {
        t: "Rivas's individual photographs are technically accomplished studies of urban life.",
        trap: "The passage calls the individual images 'unremarkable' — the opposite of this claim.",
        trapType: "opposite",
      },
      {
        t: "Rivas photographed the same intersection at the same hour for four years.",
        trap: "That is the method, restated from the passage, not the judgment the passage arrives at.",
        trapType: "same-word",
      },
      {
        t: "Photography is better suited than any other medium to documenting urban change.",
        trap: "No other medium is discussed, so no comparison is available.",
        trapType: "fictitious-comparison",
      },
    ],
    why: "The evaluative move is 'unremarkable individually / revealing in sequence' — that contrast is the passage's point.",
  },
  {
    skill: "humanities-passages",
    domain: "humanities",
    difficulty: 2,
    passage:
      "Novelist Wole Adekunle is often praised for the plainness of his prose, and it is true that his sentences rarely run long. Yet plainness is not the same as simplicity. A typical Adekunle paragraph withholds the information that would explain the scene until several pages later, so that a reader's first pass through it is deliberately incomplete.",
    question: MAIN_PURPOSE,
    options: [
      {
        t: "To refine a common description of a novelist's style by distinguishing it from a related quality",
        correct: true,
      },
      {
        t: "To dispute the claim that Adekunle's sentences are short",
        trap: "The passage grants that his sentences rarely run long. What it disputes is what follows from that.",
        trapType: "opposite",
      },
      {
        t: "To praise Adekunle as the finest stylist of his generation",
        trap: "The passage is analytical rather than celebratory, and it ranks him against no one.",
        trapType: "too-extreme",
      },
      {
        t: "To describe how a typical Adekunle paragraph withholds information from the reader",
        trap: "That detail is the evidence for the distinction; treating it as the purpose drops the argument it serves.",
        trapType: "too-narrow",
      },
    ],
    why: "'Yet plainness is not the same as simplicity' is the evaluative sentence, and the purpose is to draw exactly that distinction.",
  },
  {
    skill: "humanities-passages",
    domain: "humanities",
    difficulty: 2,
    passage:
      "When the restored version of the 1927 film premiered, critics noted that the recovered footage clarified a subplot audiences had puzzled over for decades. Film historian Junko Mizuno is less certain the gain is total. The missing footage, she observes, shaped how generations of viewers understood the film, and that reception is itself part of what the film has been.",
    question: "Which choice best states the function of the final sentence in the text as a whole?",
    options: [
      {
        t: "It supplies the reasoning behind the reservation expressed in the preceding sentence.",
        correct: true,
      },
      {
        t: "It offers additional evidence that the restoration clarified the film's subplot.",
        trap: "The sentence supports Mizuno's hesitation about the restoration, not the critics' enthusiasm for it.",
        trapType: "opposite",
      },
      {
        t: "It argues that the restored version should be withdrawn from circulation.",
        trap: "Mizuno raises a complication; she recommends nothing.",
        trapType: "too-extreme",
      },
      {
        t: "It states that the missing footage shaped how generations of viewers understood the film.",
        trap: "That is what the sentence says, not what it does for the passage.",
        trapType: "same-word",
      },
    ],
    why: "'Is less certain the gain is total' sets up a reservation; the final sentence is the reason for it.",
  },
  {
    skill: "humanities-passages",
    domain: "humanities",
    difficulty: 3,
    passage:
      "The Baroque composer's late cantatas were dismissed for two centuries as mechanical exercises, and their reliance on strict canon does invite the charge. Recent performers, however, have taken the repetitions at markedly slower tempos, and at that pace the works stop sounding like puzzles and begin to sound like grief being turned over and examined from each side.",
    question: MAIN_IDEA,
    options: [
      {
        t: "A performance choice has changed how the composer's late cantatas are understood, revealing expressive weight in what had seemed merely technical.",
        correct: true,
      },
      {
        t: "The late cantatas are mechanical exercises that rely too heavily on strict canon.",
        trap: "That is the two-century verdict the passage sets up in order to overturn with 'however'.",
        trapType: "opposite",
      },
      {
        t: "Slower tempos improve the performance of all Baroque vocal music.",
        trap: "The passage discusses these cantatas, not the whole Baroque vocal repertoire.",
        trapType: "too-extreme",
      },
      {
        t: "Recent performers have taken the repetitions in these works at markedly slower tempos.",
        trap: "That is the cause, quoted from the passage, without the reappraisal it produced.",
        trapType: "too-narrow",
      },
    ],
    why: "The passage concedes the charge ('does invite the charge') and then reverses the evaluation after 'however' — both halves belong in the main idea.",
  },
  {
    skill: "humanities-passages",
    domain: "humanities",
    difficulty: 3,
    passage:
      "In her essay on translation, Yasmin Kaddour argues that a translator's most consequential decisions are the ones no reader can detect. A visible choice — an unusual word, a retained foreign term — announces itself and can be judged. But the decision to smooth a difficult syntax, made a thousand times across a novel, leaves no trace for the reader to weigh, and it is there, she writes, that a translation is really made or lost.",
    question: MAIN_PURPOSE,
    options: [
      {
        t: "To advance a claim about which translation decisions matter most and why they escape notice",
        correct: true,
      },
      {
        t: "To recommend that translators retain foreign terms wherever possible",
        trap: "Retained foreign terms are an example of a visible choice, not a recommendation the essay makes.",
        trapType: "out-of-scope",
      },
      {
        t: "To argue that readers are incapable of judging the quality of any translation",
        trap: "Kaddour says visible choices 'can be judged'. Only the invisible ones escape assessment.",
        trapType: "too-extreme",
      },
      {
        t: "To describe the difficulty of smoothing syntax when translating a novel",
        trap: "That difficulty is the illustration; the purpose is the claim it illustrates.",
        trapType: "too-narrow",
      },
    ],
    why: "The essay's evaluative claim is that undetectable decisions carry the most weight — the visible/invisible contrast exists to establish it.",
  },
  {
    skill: "humanities-passages",
    domain: "humanities",
    difficulty: 4,
    passage:
      "Architectural critics have treated the pavilion's unfinished concrete as a statement of honesty about materials. Ines Marchetti's archival work complicates that reading: the surviving budget shows a facing stone specified, ordered, and then cancelled six weeks before opening. What the building has been admired for, she suggests, may be less a principle than a shortfall that the passage of time has dignified. Her finding implies that ______",
    question: COMPLETES,
    options: [
      {
        t: "an aesthetic later read as intentional may have originated in circumstance rather than in conviction.",
        correct: true,
      },
      {
        t: "the pavilion's unfinished concrete was a deliberate statement about honesty in materials.",
        trap: "The budget evidence is presented specifically to unsettle that reading.",
        trapType: "opposite",
      },
      {
        t: "architectural critics are generally unreliable when writing about twentieth-century buildings.",
        trap: "One reading of one building is questioned; the passage makes no claim about critics in general.",
        trapType: "too-extreme",
      },
      {
        t: "the facing stone specified for the pavilion was cancelled six weeks before opening.",
        trap: "That is the archival fact itself, not the conclusion it supports.",
        trapType: "same-word",
      },
    ],
    why: "Marchetti's hedge ('may be less a principle than a shortfall') is exactly the strength the correct inference must match.",
  },

  /* ---------------- literature-poetry (7) ---------------- */
  {
    skill: "literature-poetry",
    domain: "literature",
    difficulty: 1,
    passage:
      "Adapted from a short story. Nneka had rehearsed the sentence all the way up the stairs. At the door she said it perfectly — and watched her aunt's face stay exactly as it had been, polite and waiting, as though nothing had been said at all. Only then did she realize she had been rehearsing for a conversation her aunt had never agreed to have.",
    question: "Which choice best states the main idea of the text?",
    options: [
      {
        t: "A character delivers a prepared statement and discovers that its intended effect depends on something she cannot control.",
        correct: true,
      },
      {
        t: "A character forgets the words she had prepared and fails to deliver them.",
        trap: "The passage says she said it perfectly. What failed was the response, not the delivery.",
        trapType: "opposite",
      },
      {
        t: "A character's aunt reacts with visible anger to what she has been told.",
        trap: "The aunt's face stays 'polite and waiting' — the absence of reaction is the point.",
        trapType: "opposite",
      },
      {
        t: "A character rehearses a sentence while climbing a staircase.",
        trap: "That is the opening detail only; it omits everything the scene turns on.",
        trapType: "too-narrow",
      },
    ],
    why: "Get the literal beats first: rehearsed → delivered perfectly → no response → realization. The last beat is what the scene is for.",
  },
  {
    skill: "literature-poetry",
    domain: "literature",
    difficulty: 2,
    passage:
      "Adapted from a novel. For eleven years the lighthouse had been automated, and for eleven years Marek had walked up at dusk anyway. He no longer trimmed anything or wound anything. He climbed, he looked at the water for the length of time it had once taken to do the work, and he came down.",
    question: MAIN_IDEA,
    options: [
      {
        t: "A character continues a routine after its practical purpose has ended.",
        correct: true,
      },
      {
        t: "A character resents the automation that made his work unnecessary.",
        trap: "No resentment appears anywhere in the passage. It reports what he does, not a grievance.",
        trapType: "out-of-scope",
      },
      {
        t: "A character maintains the lighthouse equipment despite its automation.",
        trap: "The passage states he no longer trims or winds anything — he maintains nothing.",
        trapType: "opposite",
      },
      {
        t: "A character climbs the lighthouse stairs each evening at dusk.",
        trap: "True, but it is one element of the routine rather than what the passage is saying about it.",
        trapType: "too-narrow",
      },
    ],
    why: "The repeated 'for eleven years' and the emptied-out actions establish persistence without function — that is the idea.",
  },
  {
    skill: "literature-poetry",
    domain: "literature",
    difficulty: 2,
    passage:
      "In the poem, the speaker describes returning to a childhood home and finding it smaller than remembered: ______",
    question: "Which quotation from the poem most effectively illustrates the claim?",
    options: [
      {
        t: "“The gate I once had strained to reach / Now brushes at my knee, / And all the yard I ran across / Is three steps wide to me.”",
        correct: true,
      },
      {
        t: "“The paint has gone from green to grey, / The shutters hang askew, / And where the elm tree used to stand / There is a stump or two.”",
        trap: "This shows decay and change over time, not the shrinking of remembered scale.",
        trapType: "out-of-scope",
      },
      {
        t: "“I would not trade a single hour / Of those long summers past, / Nor ask the years to give me back / What they were never asked.”",
        trap: "This is reflection on the past's value, with no reference to the house's size at all.",
        trapType: "out-of-scope",
      },
      {
        t: "“The house stands larger in my mind / Than any house I own.”",
        trap: "It measures the remembered house against other houses the speaker owns — not against the same house seen again. The claim needs one house compared with itself, on a return visit.",
        trapType: "fictitious-comparison",
      },
    ],
    why: "The claim names a specific perception — remembered scale versus present scale — and only the gate-and-yard quotation measures both against each other.",
  },
  {
    skill: "literature-poetry",
    domain: "literature",
    difficulty: 3,
    passage:
      "Adapted from a novel. The letter had been on the hall table since Tuesday. Anneke walked past it going out and walked past it coming back, and each time she registered the handwriting and each time she found something in the kitchen that needed doing. By Friday she could have described the envelope from memory: the stamp set slightly crooked, the initial pressed so hard it had torn the paper a little.",
    question: "Which choice best states the function of the final sentence in the text as a whole?",
    options: [
      {
        t: "It shows how closely the character has attended to the letter, undercutting her apparent avoidance of it.",
        correct: true,
      },
      {
        t: "It establishes that the character has finally decided to open the letter.",
        trap: "Nothing in the passage shows her opening it; Friday finds her still describing the outside.",
        trapType: "opposite",
      },
      {
        t: "It identifies the sender of the letter through details of the handwriting.",
        trap: "The passage never names or identifies a sender.",
        trapType: "out-of-scope",
      },
      {
        t: "It describes the crooked stamp and the torn paper on the envelope.",
        trap: "That is the sentence's content rather than its job in the passage.",
        trapType: "same-word",
      },
    ],
    why: "The accumulated detail contradicts the not-looking she has been performing — that tension is the sentence's function.",
  },
  {
    skill: "literature-poetry",
    domain: "literature",
    difficulty: 3,
    passage:
      "In the poem, the speaker describes a grief that has become so familiar it no longer announces itself: ______",
    question: "Which quotation from the poem most effectively illustrates the claim?",
    options: [
      {
        t: "“It does not knock now, nor call out; / It has a key, and lets itself / In quietly, and takes the chair / Nearest the fire, as always.”",
        correct: true,
      },
      {
        t: "“I could not eat, I could not sleep, / The house was loud with what was gone.”",
        trap: "This is acute, disruptive grief — the noisy stage the claim says has passed.",
        trapType: "opposite",
      },
      {
        t: "“The winter came, as winters do, / And found the shutters drawn.”",
        trap: "Atmosphere and season. Nothing here characterizes grief as habitual or unannounced.",
        trapType: "out-of-scope",
      },
      {
        t: "“There is no cure for it, they say, / And they are surely right.”",
        trap: "This asserts that grief is permanent — a different property from having become quiet and unannounced, which is what the claim describes.",
        trapType: "out-of-scope",
      },
    ],
    why: "'Has a key… lets itself in quietly… as always' performs exactly the familiarity and lack of announcement the claim names.",
  },
  {
    skill: "literature-poetry",
    domain: "literature",
    difficulty: 4,
    passage:
      "Adapted from a novel. Everyone agreed that Bashir told the story well. He told it at dinners, told it to visiting cousins, told it once, memorably, to a stranger on a train. What no one noticed, because the telling was so good, was that the story had stopped changing years ago — that it had hardened into an object he carried rather than a thing that had happened to him. What the passage suggests is that ______",
    question: COMPLETES,
    options: [
      {
        t: "the very skill of his retelling had turned an experience into a performance separate from it.",
        correct: true,
      },
      {
        t: "Bashir's listeners had grown tired of hearing the same story repeated.",
        trap: "The passage says everyone agreed he told it well and that no one noticed the change.",
        trapType: "opposite",
      },
      {
        t: "Bashir had invented the story and never experienced the events he described.",
        trap: "The passage says the story was 'a thing that had happened to him'. Claiming he never experienced it contradicts the text.",
        trapType: "opposite",
      },
      {
        t: "Bashir told the story at dinners, to visiting cousins, and once to a stranger on a train.",
        trap: "Restating the list of occasions is not the conclusion the passage has been building toward.",
        trapType: "same-word",
      },
    ],
    why: "The final clause — an object carried rather than a thing that happened — is the passage's own framing; the inference must extend it, not repeat it.",
  },
  {
    skill: "literature-poetry",
    domain: "literature",
    difficulty: 4,
    passage:
      "Adapted from a short story. The recital had gone badly, and Yuki knew it. Walking home, her father listed the passages that had gone well, one after another, with the accuracy of a man who had been listening very closely indeed. She let him finish. Then she said, “You noticed, though,” and he was quiet for a while, and said, “Yes.”",
    question: "Which choice best states the main idea of the text?",
    options: [
      {
        t: "A character declines an offered comfort and receives, in its place, an honest acknowledgment.",
        correct: true,
      },
      {
        t: "A character is reassured by her father's detailed praise of her performance.",
        trap: "She sets the praise aside with 'You noticed, though' rather than being reassured by it.",
        trapType: "opposite",
      },
      {
        t: "A character argues with her father about the quality of her recital.",
        trap: "There is no argument. He agrees immediately and quietly.",
        trapType: "tone-mismatch",
      },
      {
        t: "A father lists the passages of a recital that had gone well.",
        trap: "That is the first half of the scene, leaving out the exchange the passage turns on.",
        trapType: "too-narrow",
      },
    ],
    why: "The father's accuracy signals he heard the failures too; her line refuses the kindness and his 'Yes' concedes it.",
  },
];

async function main() {
  let created = 0;
  let updated = 0;

  for (const item of ITEMS) {
    const data = {
      gameType: "lesson",
      skill: item.skill,
      domain: item.domain,
      difficulty: item.difficulty,
      payload: {
        passage: item.passage,
        question: item.question,
        options: item.options,
        why: item.why,
      },
      explanation: item.why,
      isActive: true,
    };

    // 同一 skill 的题干是复用的官方措辞，不能作判重键；用 passage 判重
    const dup = await prisma.gameItem.findFirst({
      where: {
        gameType: "lesson",
        skill: item.skill,
        payload: { path: ["passage"], equals: item.passage },
      },
    });

    if (dup) {
      await prisma.gameItem.update({ where: { id: dup.id }, data });
      updated++;
    } else {
      await prisma.gameItem.create({ data });
      created++;
    }
  }

  // 改过 passage 的题会被当成新题写入，留下旧版本孤儿行。
  // 只在本脚本自有的 gameType="lesson" 命名空间内清理，不触碰任何其他题库。
  const owned = await prisma.gameItem.findMany({
    where: { gameType: "lesson" },
    select: { id: true, payload: true },
  });
  const current = new Set(ITEMS.map((i) => i.passage));
  const stale = owned.filter((r) => !current.has((r.payload as { passage?: string }).passage ?? ""));
  if (stale.length) {
    await prisma.gameItem.deleteMany({ where: { id: { in: stale.map((r) => r.id) } } });
  }

  const total = await prisma.gameItem.count({ where: { gameType: "lesson" } });
  console.log(
    `lesson items — created ${created}, updated ${updated}, removed ${stale.length} stale, total now ${total}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
