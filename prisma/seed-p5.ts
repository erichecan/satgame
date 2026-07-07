// P5 content: graphic (chart questions) + connotation (speed game) new games,
// plus Gate Run deepening (append redundancy/apostrophe, tagged [p5], never wiping the existing 274). Idempotent.
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type TrapType = "same-word" | "opposite" | "out-of-scope" | "too-narrow" | "too-extreme" | "fictitious-comparison" | "non-sequitur" | "tone-mismatch";
type GOpt = { t: string; correct?: boolean; trap?: string; trapType?: TrapType };
type GraphicItem = { title: string; unit?: string; bars: { label: string; value: number }[]; blurb: string; question: string; options: GOpt[]; why: string; difficulty: number };

const GRAPHIC: GraphicItem[] = [
  { title: "Average daily recreational screen time by age group", unit: "hours", bars: [{ label: "Teens", value: 7.2 }, { label: "Adults 30–49", value: 4.1 }, { label: "Adults 65+", value: 2.3 }],
    blurb: "A survey measured daily recreational screen time. The researchers noted that usage ___",
    question: "Which choice best completes the text with data from the graph?",
    options: [
      { t: "declined steadily as age increased.", correct: true },
      { t: "was highest among adults 65 and older.", trap: "The 65+ group is the lowest—opposite of the graph.", trapType: "opposite" },
      { t: "was nearly identical across all groups.", trap: "The groups differ clearly.", trapType: "opposite" },
      { t: "proves that screens are harming teenagers.", trap: "The graph has no information about harm.", trapType: "out-of-scope" },
    ], why: "7.2→4.1→2.3 falls with age; the right summary must cover all three groups' downward trend.", difficulty: 2 },
  { title: "Yield per hectare of four crops", unit: "tons", bars: [{ label: "Corn", value: 9.4 }, { label: "Wheat", value: 3.5 }, { label: "Rice", value: 4.7 }, { label: "Soybeans", value: 2.8 }],
    blurb: "The yields varied widely by crop. For example, ___",
    question: "Which choice best illustrates the claim about wide variation?",
    options: [
      { t: "corn yielded 9.4 tons while soybeans yielded only 2.8.", correct: true },
      { t: "wheat yielded 3.5 tons per hectare.", trap: "A single crop can't show 'wide variation.'", trapType: "too-narrow" },
      { t: "rice and wheat yielded almost the same amount.", trap: "Two close values show small variation, not wide.", trapType: "opposite" },
      { t: "corn is a more nutritious crop than soybeans.", trap: "The graph has no nutrition data.", trapType: "out-of-scope" },
    ], why: "'Varied widely' calls for the widest gap (corn vs soybeans), not just 'different.'", difficulty: 3 },
  { title: "Dissolved oxygen in a lake, by month", unit: "mg/L", bars: [{ label: "January", value: 11 }, { label: "April", value: 9 }, { label: "July", value: 5 }, { label: "October", value: 8 }],
    blurb: "Dissolved oxygen fell to its lowest point in the warmest month, suggesting that oxygen levels ___",
    question: "Which choice best completes the text?",
    options: [
      { t: "reached their minimum in July.", correct: true },
      { t: "were lowest in January.", trap: "January is the highest.", trapType: "opposite" },
      { t: "stayed constant all year.", trap: "The months change clearly.", trapType: "opposite" },
      { t: "were higher than in any other lake.", trap: "The graph makes no comparison with other lakes.", trapType: "fictitious-comparison" },
    ], why: "July's 5 mg/L is the minimum, matching 'the warmest month.'", difficulty: 2 },
  { title: "Solar capacity growth in two countries (2015→2020)", unit: "GW", bars: [{ label: "Country A 2015", value: 12 }, { label: "Country A 2020", value: 48 }, { label: "Country B 2015", value: 20 }, { label: "Country B 2020", value: 26 }],
    blurb: "Between 2015 and 2020, one country's capacity grew far faster than the other's, since ___",
    question: "Which choice best completes the text?",
    options: [
      { t: "Country A quadrupled while Country B rose only slightly.", correct: true },
      { t: "both countries grew by the same amount.", trap: "A rose 36, B only 6.", trapType: "opposite" },
      { t: "Country B started at a lower level than A.", trap: "B actually started higher.", trapType: "opposite" },
      { t: "Country A now has the cleanest air on Earth.", trap: "The graph has no air-quality data.", trapType: "out-of-scope" },
    ], why: "A went 12→48 (fourfold), B 20→26 (a nudge), so A grew far faster.", difficulty: 3 },
  { title: "Library visitors by time of day", unit: "people", bars: [{ label: "Morning", value: 40 }, { label: "Afternoon", value: 120 }, { label: "Evening", value: 210 }, { label: "Late night", value: 30 }],
    blurb: "Attendance peaked in one part of the day, which implies the library was busiest ___",
    question: "Which choice best completes the text?",
    options: [
      { t: "in the evening.", correct: true },
      { t: "at night.", trap: "Late night's 30 is the fewest.", trapType: "opposite" },
      { t: "in the morning.", trap: "Morning is only 40.", trapType: "opposite" },
      { t: "at exactly the same rate all day.", trap: "The times differ clearly.", trapType: "opposite" },
    ], why: "Evening's 210 is the peak.", difficulty: 1 },
  { title: "Tensile strength of four materials", unit: "MPa", bars: [{ label: "Aluminum", value: 310 }, { label: "Titanium", value: 900 }, { label: "Carbon steel", value: 500 }, { label: "Copper", value: 220 }],
    blurb: "The strongest material tested was far stronger than the weakest, as shown when ___",
    question: "Which choice best supports the claim?",
    options: [
      { t: "titanium reached 900 MPa versus copper's 220.", correct: true },
      { t: "aluminum measured 310 MPa.", trap: "One data point can't show 'far stronger.'", trapType: "too-narrow" },
      { t: "carbon steel and aluminum were about equal.", trap: "They aren't close, and they're not the extremes.", trapType: "opposite" },
      { t: "titanium is cheaper than copper.", trap: "The graph has no price data.", trapType: "out-of-scope" },
    ], why: "Comparing the strongest (titanium 900) with the weakest (copper 220) shows 'far stronger.'", difficulty: 2 },
  { title: "Annual rainfall in a city", unit: "mm", bars: [{ label: "2016", value: 820 }, { label: "2017", value: 760 }, { label: "2018", value: 690 }, { label: "2019", value: 640 }],
    blurb: "Over these four years, annual rainfall ___",
    question: "Which choice best describes the overall trend?",
    options: [
      { t: "decreased each year from 2016 to 2019.", correct: true },
      { t: "increased sharply after 2016.", trap: "It actually fell year by year.", trapType: "opposite" },
      { t: "dropped only between 2018 and 2019.", trap: "Covers one span; incomplete summary.", trapType: "too-narrow" },
      { t: "will certainly keep falling forever.", trap: "An absolute claim about the future.", trapType: "too-extreme" },
    ], why: "A trend summary must cover the whole range: 820→640, falling every year.", difficulty: 2 },
  { title: "Daily foraging time of four birds", unit: "hours", bars: [{ label: "Sparrow", value: 6 }, { label: "Hawk", value: 3 }, { label: "Hummingbird", value: 8 }, { label: "Owl", value: 4 }],
    blurb: "The bird that spent the most time foraging did so for ___",
    question: "Which choice best completes the text with data from the graph?",
    options: [
      { t: "eight hours a day.", correct: true },
      { t: "three hours a day.", trap: "Three hours is the hawk, the fewest.", trapType: "opposite" },
      { t: "the same time as the owl.", trap: "Hummingbird 8, owl 4—different.", trapType: "opposite" },
      { t: "longer than any bird ever recorded.", trap: "The graph doesn't compare all birds.", trapType: "fictitious-comparison" },
    ], why: "The hummingbird's 8 hours is the longest.", difficulty: 1 },
  { title: "Online course completion rate by length", unit: "%", bars: [{ label: "<1 hr", value: 74 }, { label: "1–3 hr", value: 52 }, { label: "3–6 hr", value: 33 }, { label: ">6 hr", value: 18 }],
    blurb: "As course length increased, completion rates ___",
    question: "Which choice best completes the text?",
    options: [
      { t: "fell steadily.", correct: true },
      { t: "rose steadily.", trap: "They actually fall as length grows.", trapType: "opposite" },
      { t: "stayed above 70% throughout.", trap: "Most groups are far below 70%.", trapType: "opposite" },
      { t: "prove longer courses are worthless.", trap: "The graph supports no value judgment.", trapType: "out-of-scope" },
    ], why: "74→52→33→18 falls as length grows.", difficulty: 2 },
  { title: "Average commute time by mode", unit: "minutes", bars: [{ label: "Bicycle", value: 22 }, { label: "Bus", value: 35 }, { label: "Subway", value: 18 }],
    blurb: "The fastest commute option in the data was ___",
    question: "Which choice best completes the text?",
    options: [
      { t: "the subway, at 18 minutes.", correct: true },
      { t: "the bus, at 35 minutes.", trap: "The bus is the slowest.", trapType: "opposite" },
      { t: "the bicycle, at 18 minutes.", trap: "The bicycle is 22 minutes, not 18.", trapType: "same-word" },
      { t: "faster than any car trip.", trap: "The graph has no car data.", trapType: "out-of-scope" },
    ], why: "The subway's 18 minutes is fastest.", difficulty: 1 },
  { title: "Survival rate: control vs treatment", unit: "%", bars: [{ label: "Control", value: 45 }, { label: "Low dose", value: 62 }, { label: "High dose", value: 88 }],
    blurb: "Survival rose as dosage increased, indicating that the treatment ___",
    question: "Which choice best completes the text?",
    options: [
      { t: "improved survival relative to the control group.", correct: true },
      { t: "had no effect on survival.", trap: "Survival rises clearly.", trapType: "opposite" },
      { t: "guaranteed survival for every subject.", trap: "Even the highest is only 88%.", trapType: "too-extreme" },
      { t: "worked better than all other drugs.", trap: "No comparison with other drugs.", trapType: "fictitious-comparison" },
    ], why: "45→62→88 rises with dose, so treatment improved survival vs the control.", difficulty: 2 },
  { title: "Sales by quarter", unit: "$1000s", bars: [{ label: "Q1", value: 120 }, { label: "Q2", value: 150 }, { label: "Q3", value: 90 }, { label: "Q4", value: 200 }],
    blurb: "The single strongest quarter for sales was ___",
    question: "Which choice best completes the text?",
    options: [
      { t: "Q4, at 200.", correct: true },
      { t: "Q3, at 90.", trap: "Q3 is the lowest.", trapType: "opposite" },
      { t: "Q1, the highest of the year.", trap: "Q1 isn't the highest.", trapType: "opposite" },
      { t: "every quarter equally.", trap: "The quarters differ clearly.", trapType: "opposite" },
    ], why: "Q4 = 200 is the year's high.", difficulty: 1 },
  { title: "Species richness in three forests", unit: "species", bars: [{ label: "Old-growth", value: 240 }, { label: "Secondary", value: 130 }, { label: "Plantation", value: 60 }],
    blurb: "Species richness was greatest where forests were least disturbed, so ___",
    question: "Which choice best completes the text?",
    options: [
      { t: "old-growth forest held the most species.", correct: true },
      { t: "plantations held the most species.", trap: "Plantations are the fewest.", trapType: "opposite" },
      { t: "all three forests were equally rich.", trap: "They differ greatly.", trapType: "opposite" },
      { t: "old-growth forest is the oldest on Earth.", trap: "The graph has no age comparison.", trapType: "out-of-scope" },
    ], why: "Old-growth's 240 species is the most, matching 'least disturbed.'", difficulty: 2 },
  { title: "Phone battery capacity after charge cycles", unit: "%", bars: [{ label: "0 cycles", value: 100 }, { label: "300 cycles", value: 88 }, { label: "600 cycles", value: 76 }, { label: "900 cycles", value: 61 }],
    blurb: "As charge cycles accumulated, battery capacity ___",
    question: "Which choice best completes the text?",
    options: [
      { t: "gradually declined.", correct: true },
      { t: "increased with more cycles.", trap: "Capacity falls with cycles.", trapType: "opposite" },
      { t: "dropped only after 600 cycles.", trap: "It already dropped by 300 cycles.", trapType: "too-narrow" },
      { t: "fell to zero by 900 cycles.", trap: "At 900 it's still 61%.", trapType: "too-extreme" },
    ], why: "100→88→76→61 falls with cycles.", difficulty: 2 },
  { title: "Test averages: two teaching methods", unit: "score", bars: [{ label: "Lecture pre", value: 54 }, { label: "Lecture post", value: 61 }, { label: "Inquiry pre", value: 55 }, { label: "Inquiry post", value: 78 }],
    blurb: "Compared with the lecture group, the inquiry group's scores ___",
    question: "Which choice best completes the text?",
    options: [
      { t: "improved much more from pre-test to post-test.", correct: true },
      { t: "improved less than the lecture group.", trap: "Inquiry gained 23, lecture only 7.", trapType: "opposite" },
      { t: "started far higher on the pre-test.", trap: "The pre-tests are close (54 vs 55).", trapType: "opposite" },
      { t: "prove inquiry is the only good method.", trap: "The graph doesn't support that absolute.", trapType: "too-extreme" },
    ], why: "Inquiry 55→78 (+23) far beats lecture 54→61 (+7).", difficulty: 3 },
  { title: "Street temperature vs tree cover", unit: "°C", bars: [{ label: "No trees", value: 34 }, { label: "Few trees", value: 31 }, { label: "Dense shade", value: 27 }],
    blurb: "More tree cover was associated with ___",
    question: "Which choice best completes the text?",
    options: [
      { t: "lower street temperatures.", correct: true },
      { t: "higher street temperatures.", trap: "More trees means cooler.", trapType: "opposite" },
      { t: "no change in temperature.", trap: "34→27 is a clear difference.", trapType: "opposite" },
      { t: "cooling the whole planet by itself.", trap: "Blown up to a global scale.", trapType: "too-extreme" },
    ], why: "34→31→27: denser shade, cooler street.", difficulty: 1 },
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
  { kind: "redundancy", before: "They agreed to meet at", after: "in the town square.", doors: ["12 noon", "noon"], correctIndex: 1, why: "'Noon' already means 12:00, so '12 noon' is redundant.", difficulty: 2 },
  { kind: "redundancy", before: "Please", after: "the two files before sending.", doors: ["combine together", "combine"], correctIndex: 1, why: "'Combine' already means 'together,' so 'combine together' is redundant.", difficulty: 2 },
  { kind: "redundancy", before: "The result was a", after: "surprise to everyone.", doors: ["unexpected surprise", "surprise"], correctIndex: 1, why: "A surprise is by definition unexpected—'unexpected surprise' is redundant.", difficulty: 2 },
  { kind: "redundancy", before: "We need to", after: "the plan in advance.", doors: ["plan ahead", "plan"], correctIndex: 1, why: "'Plan' already implies 'ahead,' so 'plan ahead / in advance' is redundant.", difficulty: 3 },
  { kind: "redundancy", before: "She gave a brief", after: "of the main points.", doors: ["summary", "short summary"], correctIndex: 0, why: "A summary is already brief—'short summary' is redundant.", difficulty: 2 },
  { kind: "redundancy", before: "The events happened at the", after: ".", doors: ["same identical time", "same time"], correctIndex: 1, why: "'Same' and 'identical' mean the same thing—stacking them is redundant.", difficulty: 2 },
  { kind: "redundancy", before: "He returned the book and then", after: "it again later.", doors: ["revisited", "revisited again"], correctIndex: 0, why: "'Re-' already means 'again,' so 'revisited again' is redundant.", difficulty: 3 },
  { kind: "redundancy", before: "The two designs are", after: "in every way.", doors: ["exactly identical", "identical"], correctIndex: 1, why: "'Identical' already means exactly the same—'exactly identical' is redundant.", difficulty: 2 },
  { kind: "redundancy", before: "The final", after: "will be announced Friday.", doors: ["outcome", "end outcome"], correctIndex: 0, why: "An outcome is already the end result—'end outcome' is redundant.", difficulty: 2 },
  { kind: "redundancy", before: "Each student must", after: "cooperate with the group.", doors: ["mutually cooperate", "cooperate"], correctIndex: 1, why: "'Cooperate' already implies 'mutually,' so 'mutually cooperate' is redundant.", difficulty: 3 },
  { kind: "redundancy", before: "They will", after: "the meeting to next week.", doors: ["postpone", "postpone until later"], correctIndex: 0, why: "'Postpone' already means 'put off until later'—adding 'until later' is redundant.", difficulty: 3 },
  { kind: "redundancy", before: "A", after: "of history repeats itself here.", doors: ["past history", "history"], correctIndex: 1, why: "History is by definition past—'past history' is redundant.", difficulty: 2 },
  { kind: "apostrophe", before: "The", after: "tails wagged as they ran.", doors: ["dogs", "dogs'"], correctIndex: 1, why: "Plural possessive: the tails of several dogs → dogs'.", difficulty: 2 },
  { kind: "apostrophe", before: "That is the", after: "office at the end of the hall.", doors: ["manager's", "managers"], correctIndex: 0, why: "Singular possessive: one manager's office → manager's.", difficulty: 1 },
  { kind: "apostrophe", before: "The two", after: "cars were both blue.", doors: ["sister's", "sisters'"], correctIndex: 1, why: "Plural possessive: two sisters' cars → sisters'.", difficulty: 2 },
  { kind: "apostrophe", before: "The cat licked", after: "paw.", doors: ["its", "it's"], correctIndex: 0, why: "'Its' is possessive; 'it's' = it is. Here it means 'its paw.'", difficulty: 2 },
  { kind: "apostrophe", before: "The", after: "decision surprised the whole class.", doors: ["teacher's", "teachers"], correctIndex: 0, why: "Singular possessive: the teacher's decision → teacher's.", difficulty: 1 },
  { kind: "apostrophe", before: "All the", after: "desks were cleaned overnight.", doors: ["student's", "students'"], correctIndex: 1, why: "Plural possessive: all the students' desks → students'.", difficulty: 2 },
  { kind: "apostrophe", before: "I think", after: "going to rain later.", doors: ["its", "it's"], correctIndex: 1, why: "'It's' = it is, as in 'it's going to rain.'", difficulty: 2 },
  { kind: "apostrophe", before: "The", after: "wings were spread wide.", doors: ["bird's", "birds"], correctIndex: 0, why: "Singular possessive: that one bird's wings → bird's.", difficulty: 1 },
  { kind: "apostrophe", before: "The", after: "uniforms were navy blue.", doors: ["players'", "players"], correctIndex: 0, why: "Plural possessive: the players' uniforms → players'.", difficulty: 2 },
  { kind: "apostrophe", before: "This is my", after: "house, not mine.", doors: ["parents'", "parents"], correctIndex: 0, why: "Plural possessive: my parents' house → parents'.", difficulty: 2 },
  { kind: "apostrophe", before: "The company changed", after: "logo last year.", doors: ["its", "it's"], correctIndex: 0, why: "Possessive 'its': the company's logo.", difficulty: 2 },
  { kind: "apostrophe", before: "The", after: "handle had broken off.", doors: ["kettle's", "kettles"], correctIndex: 0, why: "Singular possessive: the kettle's handle → kettle's.", difficulty: 1 },
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

  // Gate Run deepening: append (don't wipe existing), tagged [p5] for idempotency
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
