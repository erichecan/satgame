// P3 content: Inference questions. Inserts only gameType=inference. Idempotent.
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
      { t: "to explain why so few species survive at high, cold altitudes and why snow leopards are there", correct: true },
      { t: "to prove that the snow leopard is the strongest cat in the world" },
      { t: "to describe the beautiful mountain scenery" },
    ],
    options: [
      { t: "they were pushed out of warmer, more competitive habitats below.", correct: true },
      { t: "they always prefer cold over warmth in every situation.", trap: "The passage doesn't say they prefer cold—only that they were forced to adapt.", trapType: "too-extreme" },
      { t: "the cold makes every animal there stronger.", trap: "You can't get 'cold makes animals stronger' from 'adapting is costly.'", trapType: "non-sequitur" },
      { t: "high altitudes have the most oxygen of any habitat.", trap: "Directly contradicts 'oxygen is scarce.'", trapType: "opposite" },
    ],
    why: "Competition is fierce lower down; the snow leopard is out-sized and out-matched, so it was pushed up to the harsh heights where it has few rivals.",
    difficulty: 3,
  },
  {
    text: "The museum kept its rarest manuscripts in a dim basement, and few visitors ever saw them. After the collection was digitized and posted online, views rose into the millions. The library concluded that the manuscripts' earlier obscurity was mainly due to ___",
    exigenceOptions: [
      { t: "to explain why these manuscripts had had so few viewers before", correct: true },
      { t: "to prove that paper manuscripts are more valuable than digital ones" },
      { t: "to describe the architecture of the basement" },
    ],
    options: [
      { t: "limited physical access rather than a lack of public interest.", correct: true },
      { t: "the manuscripts being kept in a dim basement.", trap: "Copies the passage's wording without explaining the deeper reason.", trapType: "same-word" },
      { t: "the public having no interest in old manuscripts at all.", trap: "Millions of online views show the opposite.", trapType: "opposite" },
      { t: "poor lighting permanently damaging the documents.", trap: "The passage never mentions damage.", trapType: "out-of-scope" },
    ],
    why: "Views exploded once the works were online, so the earlier barrier was access ('couldn't see them'), not lack of interest.",
    difficulty: 3,
  },
  {
    text: "A new bike lane opened downtown, and within a year cycling trips nearly doubled while car traffic fell only slightly. Researchers found most new cyclists had previously walked or taken the bus. They inferred that the lane mainly ___",
    exigenceOptions: [
      { t: "to identify which group the new cyclists mostly came from", correct: true },
      { t: "to argue that cars should be banned completely" },
      { t: "to compare the bike-lane lengths of different cities" },
    ],
    options: [
      { t: "drew people away from walking and buses rather than from driving.", correct: true },
      { t: "eliminated nearly all car traffic downtown.", trap: "The passage says car traffic fell only slightly.", trapType: "opposite" },
      { t: "proved bike lanes make every city healthier.", trap: "A sweeping absolute conclusion.", trapType: "too-extreme" },
      { t: "was mostly used by former drivers.", trap: "Contradicts 'previously walked or took the bus.'", trapType: "opposite" },
    ],
    why: "The new cyclists were mostly former walkers/bus riders, so the lane drew people away from those modes, not from driving.",
    difficulty: 2,
  },
  {
    text: "Ancient Roman concrete has survived two thousand years of pounding waves, while much modern concrete crumbles within decades. Researchers recently found that seawater triggers new mineral growth inside the Roman mix. This finding implies that, for the Romans' material, exposure to seawater ___",
    exigenceOptions: [
      { t: "to explain how seawater affects the durability of Roman concrete", correct: true },
      { t: "to prove that modern engineers are all lazy" },
      { t: "to describe the naval history of the Roman Empire" },
    ],
    options: [
      { t: "actually made the structure stronger over time.", correct: true },
      { t: "caused it to crumble within decades.", trap: "That's what happens to modern concrete.", trapType: "opposite" },
      { t: "had no effect on the material whatsoever.", trap: "Contradicts 'triggers new mineral growth.'", trapType: "opposite" },
      { t: "made it cheaper than any other building material.", trap: "The passage discusses no cost or comparison.", trapType: "fictitious-comparison" },
    ],
    why: "Seawater grows new minerals in the Roman mix, so exposure actually strengthens it over time.",
    difficulty: 3,
  },
  {
    text: "The startup promised ten-minute grocery delivery by building tiny warehouses in crowded neighborhoods. Analysts noted the model burned cash on rent and staff for every order. Within a year the company quietly lengthened its delivery windows, suggesting that the original promise had proven ___",
    exigenceOptions: [
      { t: "to hint that the ten-minute promise was hard to sustain", correct: true },
      { t: "to prove customers dislike buying groceries" },
      { t: "to describe the shelving layout of the warehouses" },
    ],
    options: [
      { t: "too costly to sustain at scale.", correct: true },
      { t: "wildly profitable from the start.", trap: "Contradicts 'burned cash.'", trapType: "opposite" },
      { t: "impossible for any delivery company ever to attempt.", trap: "Overly absolute.", trapType: "too-extreme" },
      { t: "unpopular because customers disliked fast delivery.", trap: "The passage never says customers disliked fast delivery.", trapType: "out-of-scope" },
    ],
    why: "Lengthening delivery times plus burning cash per order shows the ten-minute promise was too costly to keep up.",
    difficulty: 3,
  },
  {
    text: "For most of his career the composer wrote intimate chamber pieces. Late in life, around the time his hearing began to fail, he suddenly turned to vast symphonies for huge orchestras. Some scholars therefore propose that his shift in scale was connected to ___",
    exigenceOptions: [
      { t: "to offer an explanation for the composer's late change of style", correct: true },
      { t: "to prove chamber music is superior to symphonies" },
      { t: "to list the titles of all his works" },
    ],
    options: [
      { t: "changes in how he experienced sound as his hearing declined.", correct: true },
      { t: "his deafness, which clearly improved his talent.", trap: "A time correlation doesn't prove 'deafness improved his talent.'", trapType: "non-sequitur" },
      { t: "chamber music being easier than symphonies.", trap: "The passage makes no easy/hard comparison.", trapType: "fictitious-comparison" },
      { t: "his complete loss of interest in music.", trap: "He actually wrote grander works.", trapType: "opposite" },
    ],
    why: "The style change lines up in time with his fading hearing, which is why scholars link the two.",
    difficulty: 3,
  },
  {
    text: "A city study found that students who slept at least eight hours scored slightly higher on tests than those who slept less. The authors cautioned that many other factors also affect scores. A reasonable conclusion is that adequate sleep ___",
    exigenceOptions: [
      { t: "to describe, cautiously, the relationship between sleep and scores", correct: true },
      { t: "to claim sleep is the single thing that decides scores" },
      { t: "to describe the school's daily schedule" },
    ],
    options: [
      { t: "may contribute to somewhat better performance.", correct: true },
      { t: "is the single cause of all high test scores.", trap: "The authors explicitly note many other factors.", trapType: "too-extreme" },
      { t: "has no relationship to test performance.", trap: "Contradicts 'scored slightly higher.'", trapType: "opposite" },
      { t: "matters more than intelligence itself.", trap: "The passage draws no comparison with intelligence.", trapType: "fictitious-comparison" },
    ],
    why: "'Slightly' plus the caution about other factors means we can only say adequate sleep 'may' help a little.",
    difficulty: 2,
  },
  {
    text: "The essay observes that reading literary fiction often asks readers to inhabit minds unlike their own. Studies it cites link such reading to modest gains in recognizing others' emotions. The author suggests that fiction can, in this limited way, ___",
    exigenceOptions: [
      { t: "to describe a limited benefit of literary reading for understanding others", correct: true },
      { t: "to prove only people who read fiction have empathy" },
      { t: "to compare the sales of novels and poetry" },
    ],
    options: [
      { t: "help cultivate empathy for people different from oneself.", correct: true },
      { t: "make readers the only people capable of empathy.", trap: "An 'only...ever' absolute; the passage claims only a limited benefit.", trapType: "too-extreme" },
      { t: "reduce a reader's ability to understand others.", trap: "Contradicts 'gains in recognizing emotions.'", trapType: "opposite" },
      { t: "outsell every other kind of book.", trap: "The passage says nothing about sales.", trapType: "out-of-scope" },
    ],
    why: "The words 'modest' and 'limited' bound the claim: fiction fosters empathy to a limited degree.",
    difficulty: 3,
  },
  {
    text: "A coastal town banned certain fishing nets after fish counts collapsed. Three years later, surveys showed several species returning to numbers not seen in a generation. Officials took this as evidence that the earlier decline had been driven largely by ___",
    exigenceOptions: [
      { t: "to infer the main cause of the earlier collapse in fish numbers", correct: true },
      { t: "to prove the town's fishers were lazy" },
      { t: "to describe how fishing nets are woven" },
    ],
    options: [
      { t: "the fishing practices the ban had targeted.", correct: true },
      { t: "the town banning certain fishing nets.", trap: "Copies the wording and reverses cause and effect.", trapType: "same-word" },
      { t: "a permanent, unstoppable extinction event.", trap: "The rebound contradicts 'permanent extinction.'", trapType: "opposite" },
      { t: "changes in ocean temperature the passage never mentions.", trap: "The passage never mentions temperature.", trapType: "out-of-scope" },
    ],
    why: "Fish returned once the nets were banned, so the earlier decline was mainly caused by the banned fishing.",
    difficulty: 2,
  },
  {
    text: "The report notes that the tutoring program raised the grades of some struggling students but left others unchanged. It stresses that results varied by attendance. A careful reader would conclude that the program ___",
    exigenceOptions: [
      { t: "to explain, evenhandedly, that the program's effect varied by student", correct: true },
      { t: "to claim the program worked for every student" },
      { t: "to describe how the tutors were hired" },
    ],
    options: [
      { t: "helped some students, with results tied to how often they attended.", correct: true },
      { t: "guaranteed higher grades for every participant.", trap: "The passage says some students were unchanged.", trapType: "too-extreme" },
      { t: "harmed the students who took part.", trap: "Contradicts 'raised the grades of some.'", trapType: "opposite" },
      { t: "worked better than hiring more teachers.", trap: "The passage makes no such comparison.", trapType: "fictitious-comparison" },
    ],
    why: "Results varied by attendance and some students were unchanged, so it only 'helped some.'",
    difficulty: 2,
  },
  {
    text: "Early maps of the coast were riddled with errors, yet sailors used them because nothing better existed. A young surveyor then spent a decade correcting the charts foot by foot, and shipwrecks in the region soon dropped sharply. The passage implies that many earlier wrecks had been caused by ___",
    exigenceOptions: [
      { t: "to infer the cause of many earlier shipwrecks", correct: true },
      { t: "to prove the surveyor was the greatest sailor in history" },
      { t: "to describe the geology of the coastline" },
    ],
    options: [
      { t: "the inaccuracies in the old charts sailors relied on.", correct: true },
      { t: "the surveyor's decade of corrections.", trap: "That's the fix, not the cause of the wrecks.", trapType: "non-sequitur" },
      { t: "sailors refusing to use any maps at all.", trap: "The passage says they kept using the old maps.", trapType: "opposite" },
      { t: "storms that the passage does not discuss.", trap: "The passage never mentions storms.", trapType: "out-of-scope" },
    ],
    why: "Wrecks fell sharply after the charts were corrected, so the earlier ones were mostly caused by faulty maps.",
    difficulty: 3,
  },
  {
    text: "The article explains that bees pollinate a large share of the crops humans eat. It adds that other animals and even wind pollinate many plants too. A balanced reading is that, while bees are important, ___",
    exigenceOptions: [
      { t: "to explain, evenhandedly, that bees matter but aren't the only pollinators", correct: true },
      { t: "to prove that without bees every plant on Earth would die" },
      { t: "to describe how honey is made" },
    ],
    options: [
      { t: "they are not the only means by which plants are pollinated.", correct: true },
      { t: "no plant on Earth could survive without them.", trap: "The passage says other pollinators exist.", trapType: "too-extreme" },
      { t: "they play no real role in agriculture.", trap: "Contradicts 'pollinate a large share of crops.'", trapType: "opposite" },
      { t: "wind is a better pollinator than any animal.", trap: "The passage ranks nothing.", trapType: "fictitious-comparison" },
    ],
    why: "The passage stresses bees matter yet notes wind and other animals also pollinate, so bees aren't the only ones.",
    difficulty: 2,
  },
  {
    text: "A factory installed sensors that flagged tiny defects human inspectors had missed. Over the next quarter, customer complaints about faulty units dropped by half. Managers concluded that many earlier complaints had stemmed from defects that ___",
    exigenceOptions: [
      { t: "to infer the source of the earlier complaints", correct: true },
      { t: "to prove that all human inspectors should be fired" },
      { t: "to describe the sensors' circuit design" },
    ],
    options: [
      { t: "had previously slipped past human inspection.", correct: true },
      { t: "the sensors themselves had created.", trap: "The sensors detect, not create, defects.", trapType: "non-sequitur" },
      { t: "did not exist before the sensors were installed.", trap: "The defects existed; they just went unseen.", trapType: "opposite" },
      { t: "customers had imagined entirely.", trap: "The passage never says the complaints were imagined.", trapType: "out-of-scope" },
    ],
    why: "Complaints halved once sensors caught previously missed defects, so those earlier complaints came from missed defects.",
    difficulty: 3,
  },
  {
    text: "The historian notes that the two rival cities each controlled a busy trade route and grew rich. The text gives no figures comparing their wealth. A responsible summary would say that both cities ___",
    exigenceOptions: [
      { t: "to state, neutrally, that both cities grew wealthy from trade", correct: true },
      { t: "to declare the eastern city the richest in history" },
      { t: "to describe the design of ancient coins" },
    ],
    options: [
      { t: "prospered from the trade they controlled.", correct: true },
      { t: "were the wealthiest cities in all of history.", trap: "The passage gives no comparable figures.", trapType: "too-extreme" },
      { t: "were poorer than every modern city.", trap: "The passage makes no comparison to modern cities.", trapType: "fictitious-comparison" },
      { t: "eventually abandoned trade altogether.", trap: "The passage never mentions abandoning trade.", trapType: "out-of-scope" },
    ],
    why: "The text only says both cities grew rich from controlling trade, with no ranking, so both simply prospered.",
    difficulty: 2,
  },
  {
    text: "The author praises the documentary's honesty but calls its pacing 'painfully slow' and its narration 'flat.' Weighing these remarks, a reader should understand the author's overall view as ___",
    exigenceOptions: [
      { t: "to convey a mixed, overall reserved judgment", correct: true },
      { t: "to show the author loves the documentary without reservation" },
      { t: "to describe where the documentary was filmed" },
    ],
    options: [
      { t: "appreciative of its honesty yet critical of how it was made.", correct: true },
      { t: "wholly enthusiastic and full of praise.", trap: "'Painfully slow' and 'flat' are clearly negative in tone.", trapType: "tone-mismatch" },
      { t: "completely dismissive of everything in it.", trap: "The author still praises its honesty.", trapType: "opposite" },
      { t: "focused only on the film's music.", trap: "The passage never discusses music.", trapType: "out-of-scope" },
    ],
    why: "The author praises the honesty but knocks the pacing and narration—an overall mixed, reserved view.",
    difficulty: 3,
  },
  {
    text: "A drought forced farmers to abandon fields they could no longer irrigate. When the rains returned two years later, those same fields produced record harvests. Agronomists took this to mean the soil's fertility had been ___",
    exigenceOptions: [
      { t: "to infer what happened to the soil's fertility during the drought", correct: true },
      { t: "to prove that farmers should not grow crops" },
      { t: "to describe how irrigation canals are built" },
    ],
    options: [
      { t: "preserved rather than permanently destroyed by the drought.", correct: true },
      { t: "wiped out forever by the lack of water.", trap: "Record harvests contradict 'wiped out forever.'", trapType: "opposite" },
      { t: "improved because droughts always enrich soil.", trap: "An 'always' absolute plus a logic leap.", trapType: "too-extreme" },
      { t: "unrelated to the harvest in any way.", trap: "It's directly tied to the later harvest.", trapType: "non-sequitur" },
    ],
    why: "Record harvests after the rains returned show the drought merely rested the land; fertility was preserved, not destroyed.",
    difficulty: 3,
  },
  {
    text: "The passage describes how a species of finch on a dry island developed larger beaks during a long drought, when only big, tough seeds remained. This suggests that the change in beak size was driven by ___",
    exigenceOptions: [
      { t: "to explain the cause behind the change in beak size and food", correct: true },
      { t: "to prove this finch is the smartest bird" },
      { t: "to describe the island's beaches" },
    ],
    options: [
      { t: "which birds could crack the hard seeds that were left.", correct: true },
      { t: "the birds deciding to grow bigger beaks on purpose.", trap: "Beak size isn't a deliberate choice.", trapType: "non-sequitur" },
      { t: "an abundance of soft seeds during the drought.", trap: "Contradicts 'only big, tough seeds remained.'", trapType: "opposite" },
      { t: "the color of the birds' feathers.", trap: "The passage never mentions feather color.", trapType: "out-of-scope" },
    ],
    why: "With only hard seeds left, big-beaked birds that could crack them survived, so food shaped beak size.",
    difficulty: 2,
  },
  {
    text: "A company let employees choose their own hours. Productivity rose in teams whose work did not depend on constant coordination, but fell in teams that needed to meet often. The most supported conclusion is that flexible hours ___",
    exigenceOptions: [
      { t: "to explain that flexible hours' effect depends on the type of team", correct: true },
      { t: "to prove flexible hours always raise productivity" },
      { t: "to describe the company's office decor" },
    ],
    options: [
      { t: "helped some teams but hurt those that relied on coordination.", correct: true },
      { t: "improved productivity for absolutely every team.", trap: "Some teams' productivity actually fell.", trapType: "too-extreme" },
      { t: "made all teams less productive.", trap: "Some teams actually improved.", trapType: "opposite" },
      { t: "mattered less than employee salaries.", trap: "The passage makes no comparison to salaries.", trapType: "fictitious-comparison" },
    ],
    why: "Results split by whether a team needs coordination, so flexible hours help or hurt depending on the team.",
    difficulty: 3,
  },
  {
    text: "The text notes that a rare frog survives in only a handful of isolated mountain streams. Each stream is fed by melting snow that is arriving earlier every year. The author is most likely leading up to the point that the frog's survival ___",
    exigenceOptions: [
      { t: "to set up the threat this frog's survival faces", correct: true },
      { t: "to prove this frog is prettier than other animals" },
      { t: "to describe hikers' routes" },
    ],
    options: [
      { t: "may be threatened as its cold, snow-fed streams change.", correct: true },
      { t: "is guaranteed no matter what happens to the climate.", trap: "Contradicts the hint of 'arriving earlier every year.'", trapType: "opposite" },
      { t: "depends on it being prettier than other frogs.", trap: "The passage makes no beauty comparison.", trapType: "fictitious-comparison" },
      { t: "proves the mountains are the tallest on Earth.", trap: "The passage never discusses mountain height.", trapType: "out-of-scope" },
    ],
    why: "A tiny range plus earlier snowmelt sets up the point that this frog's survival is under threat.",
    difficulty: 2,
  },
  {
    text: "An author revised her manuscript for ten years before publishing. Reviewers who once found her early drafts confusing praised the final book as remarkably clear. This progression suggests that the years of revision mainly served to ___",
    exigenceOptions: [
      { t: "to explain the main change the years of revision produced", correct: true },
      { t: "to prove she is the greatest writer ever" },
      { t: "to give the publisher's address" },
    ],
    options: [
      { t: "make the book's ideas easier to follow.", correct: true },
      { t: "make the writing more confusing over time.", trap: "Contradicts 'praised as remarkably clear.'", trapType: "opposite" },
      { t: "prove that longer revision always yields better books.", trap: "An 'always' absolute.", trapType: "too-extreme" },
      { t: "increase the number of pages the passage never counts.", trap: "The passage never mentions page count.", trapType: "out-of-scope" },
    ],
    why: "Going from 'confusing' to 'remarkably clear' shows the revision mainly improved clarity.",
    difficulty: 2,
  },
  {
    text: "The study found that plants exposed to gentle, regular wind grew shorter but sturdier stems than sheltered plants. Researchers reasoned that the wind acted as a signal prompting the plants to ___",
    exigenceOptions: [
      { t: "to explain why wind made the plants short and sturdy", correct: true },
      { t: "to prove nothing can grow where it is windy" },
      { t: "to describe the greenhouse glass" },
    ],
    options: [
      { t: "invest in stronger support rather than height.", correct: true },
      { t: "grow as tall as possible as fast as possible.", trap: "Contradicts 'shorter but sturdier.'", trapType: "opposite" },
      { t: "stop growing entirely in any breeze.", trap: "The plants still grew, just shorter and sturdier.", trapType: "too-extreme" },
      { t: "change the color of their flowers.", trap: "The passage never mentions flower color.", trapType: "out-of-scope" },
    ],
    why: "Wind-exposed plants grew short and sturdy, so the wind signaled them to invest in support rather than height.",
    difficulty: 3,
  },
  {
    text: "A law meant to protect small farmers was praised when it passed, but critics soon pointed to loopholes that let large agribusinesses claim most of its benefits. Years later, small farms were no better off. The passage most directly suggests that the law ___",
    exigenceOptions: [
      { t: "to show the law failed its purpose because of loopholes", correct: true },
      { t: "to prove that all laws are useless" },
      { t: "to describe the crops on the farms" },
    ],
    options: [
      { t: "failed to help the very farmers it was designed for.", correct: true },
      { t: "worked perfectly as its authors intended.", trap: "Small farms were no better off.", trapType: "opposite" },
      { t: "proves every law inevitably fails.", trap: "Generalizes from one case to all laws.", trapType: "non-sequitur" },
      { t: "was written by the agribusinesses themselves.", trap: "The passage never identifies who wrote it.", trapType: "out-of-scope" },
    ],
    why: "Loopholes let big agribusiness take most of the benefit while small farms gained nothing, so the law failed its target group.",
    difficulty: 3,
  },
  {
    text: "The passage explains that a comet's tail always points away from the sun, no matter which direction the comet is traveling. From this, one can infer that the tail's direction is determined not by the comet's motion but by ___",
    exigenceOptions: [
      { t: "to explain what determines the direction of a comet's tail", correct: true },
      { t: "to prove comets are more important than planets" },
      { t: "to describe a telescope's lenses" },
    ],
    options: [
      { t: "something coming from the sun itself.", correct: true },
      { t: "the exact direction the comet is moving.", trap: "Contradicts 'no matter which direction it's traveling.'", trapType: "opposite" },
      { t: "the comet choosing where to point its tail.", trap: "A tail's direction isn't a comet's 'choice.'", trapType: "non-sequitur" },
      { t: "the size of the nearest planet.", trap: "The passage never mentions planet size.", trapType: "out-of-scope" },
    ],
    why: "The tail always points away from the sun regardless of motion, so its direction is set by something from the sun.",
    difficulty: 3,
  },
  {
    text: "Researchers gave two groups the same puzzle; one was told it measured intelligence, the other that it was just practice. The 'intelligence' group gave up sooner when the puzzle got hard. The finding suggests that framing a task as a test of ability can ___",
    exigenceOptions: [
      { t: "to explain the effect of framing a task as a test of ability", correct: true },
      { t: "to prove smart people always quit first" },
      { t: "to describe what the puzzle is made of" },
    ],
    options: [
      { t: "make people give up more easily under difficulty.", correct: true },
      { t: "always make everyone perform better.", trap: "The 'intelligence' group actually quit sooner.", trapType: "opposite" },
      { t: "prove intelligence tests are the fairest measure.", trap: "The passage never judges test fairness.", trapType: "out-of-scope" },
      { t: "matter more than the puzzle's actual difficulty.", trap: "The passage makes no such comparison.", trapType: "fictitious-comparison" },
    ],
    why: "The group told it 'measures intelligence' quit sooner, so that framing weakens persistence.",
    difficulty: 3,
  },
  {
    text: "The article reports that a city planted thousands of street trees, and within years summer temperatures on those streets measured noticeably lower than on bare streets nearby. The most reasonable inference is that the trees ___",
    exigenceOptions: [
      { t: "to explain the effect of street trees on street temperature", correct: true },
      { t: "to prove this city is the greenest in the country" },
      { t: "to describe the growth rings of trees" },
    ],
    options: [
      { t: "helped cool the streets where they were planted.", correct: true },
      { t: "made those streets hotter than the bare ones.", trap: "Contradicts 'noticeably lower.'", trapType: "opposite" },
      { t: "cooled the entire planet on their own.", trap: "Blows it up to a global scale.", trapType: "too-extreme" },
      { t: "were taller than any trees elsewhere.", trap: "The passage never compares tree height.", trapType: "fictitious-comparison" },
    ],
    why: "Tree-lined streets ran noticeably cooler in summer, so the trees reasonably helped cool them.",
    difficulty: 2,
  },
  {
    text: "A translator noted that a single word in the old poem could mean either 'shadow' or 'shelter,' and the poet may have intended both at once. This suggests that, in reading such poetry, insisting on one fixed meaning may ___",
    exigenceOptions: [
      { t: "to explain the problem with forcing a single meaning onto ambiguous poetry", correct: true },
      { t: "to prove this is the greatest poem ever written" },
      { t: "to describe how translation software works" },
    ],
    options: [
      { t: "flatten meanings the poet deliberately left open.", correct: true },
      { t: "always reveal the poem's one true message.", trap: "The passage says the poet may have meant both senses.", trapType: "opposite" },
      { t: "make the poem longer than the original.", trap: "The passage never discusses length.", trapType: "out-of-scope" },
      { t: "prove poetry is harder than prose to translate.", trap: "The passage makes no comparison with prose.", trapType: "fictitious-comparison" },
    ],
    why: "One word carries two intended senses, so forcing a single meaning flattens the ambiguity the poet chose.",
    difficulty: 4,
  },
  {
    text: "The report shows that after a website simplified its checkout to a single page, the share of shoppers who abandoned their carts fell sharply. Analysts concluded that many earlier abandonments had been caused by ___",
    exigenceOptions: [
      { t: "to infer why shoppers had abandoned their carts before", correct: true },
      { t: "to prove shoppers dislike online shopping" },
      { t: "to describe the website's server room" },
    ],
    options: [
      { t: "the friction of a longer, more complicated checkout.", correct: true },
      { t: "the checkout being simplified to one page.", trap: "That's the fix, not the cause.", trapType: "same-word" },
      { t: "shoppers having no interest in buying anything.", trap: "Completions rose after the fix—the opposite.", trapType: "opposite" },
      { t: "prices that the passage never mentions.", trap: "The passage never mentions prices.", trapType: "out-of-scope" },
    ],
    why: "Abandonment dropped once checkout was simplified, so the earlier abandonment came from a clunky checkout.",
    difficulty: 2,
  },
  {
    text: "The passage explains that certain fungi trade nutrients with tree roots, giving trees minerals in exchange for sugars. Trees connected to these fungi grew faster than isolated ones. This relationship is best described as one in which both partners ___",
    exigenceOptions: [
      { t: "to describe the mutual benefit between fungi and trees", correct: true },
      { t: "to prove fungi are more important than trees" },
      { t: "to describe the process of a forest fire" },
    ],
    options: [
      { t: "benefit from what the other provides.", correct: true },
      { t: "harm each other by competing for food.", trap: "Contradicts 'trade nutrients' and 'grew faster.'", trapType: "opposite" },
      { t: "prove fungi are superior to trees.", trap: "The passage ranks neither.", trapType: "fictitious-comparison" },
      { t: "will always outcompete every other organism.", trap: "Overly absolute.", trapType: "too-extreme" },
    ],
    why: "Fungi give minerals, trees give sugars, and connected trees grow faster—both sides gain, a mutual benefit.",
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
