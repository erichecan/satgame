// P2 content: Morphology game. Inserts only gameType=morphology. Idempotent.
// Verified: segments joined must === word.
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
  { word: "unchangeable", segments: [P("un", "not"), R("change", "change"), S("able", "able to (adj)")], pos: "adjective", meaning: "impossible to change", distractors: ["easy to change", "changing often", "worth changing"], connotation: "0", difficulty: 1 },
  { word: "incontrovertible", segments: [P("in", "not"), P("contro", "against"), R("vert", "turn"), S("ible", "able to (adj)")], pos: "adjective", meaning: "impossible to dispute; certain", distractors: ["open to debate", "easily disproven", "vague and unclear"], connotation: "+", difficulty: 4 },
  { word: "metamorphosis", segments: [P("meta", "change"), R("morph", "shape"), S("osis", "process (noun)")], pos: "noun", meaning: "a complete change of form", distractors: ["a short nap", "a kind of insect", "a measurement of shape"], connotation: "0", difficulty: 3 },
  { word: "intolerant", segments: [P("in", "not"), R("toler", "endure"), S("ant", "-ing (adj)")], pos: "adjective", meaning: "unwilling to accept views unlike one's own", distractors: ["very patient", "physically weak", "eager to help"], connotation: "-", difficulty: 2 },
  { word: "benevolent", segments: [P("bene", "good"), R("vol", "wish"), S("ent", "-ing (adj)")], pos: "adjective", meaning: "kind and generous", distractors: ["wishing harm", "cold and indifferent", "greedy"], connotation: "+", difficulty: 3 },
  { word: "malevolent", segments: [P("male", "bad"), R("vol", "wish"), S("ent", "-ing (adj)")], pos: "adjective", meaning: "wishing harm to others", distractors: ["kind and friendly", "unimportant", "highly talented"], connotation: "-", difficulty: 3 },
  { word: "innovation", segments: [P("in", "into"), R("nov", "new"), S("ation", "process (noun)")], pos: "noun", meaning: "a new method or idea", distractors: ["an old tradition", "a failure", "a repeated action"], connotation: "+", difficulty: 2 },
  { word: "novice", segments: [R("nov", "new"), S("ice", "person (noun)")], pos: "noun", meaning: "a beginner", distractors: ["an expert", "a drink", "a leader"], connotation: "0", difficulty: 2 },
  { word: "retrospect", segments: [P("retro", "backward"), R("spect", "look")], pos: "noun", meaning: "a review of past events", distractors: ["a prediction of the future", "a close-up look", "a telescope"], connotation: "0", difficulty: 2 },
  { word: "introspection", segments: [P("intro", "inward"), R("spect", "look"), S("ion", "noun")], pos: "noun", meaning: "examination of one's own thoughts", distractors: ["watching other people", "outdoor adventure", "public speaking"], connotation: "0", difficulty: 3 },
  { word: "circumscribe", segments: [P("circum", "around"), R("scribe", "write/draw")], pos: "verb", meaning: "to restrict; draw a line around", distractors: ["to expand freely", "to read aloud", "to erase completely"], connotation: "0", difficulty: 3 },
  { word: "inscribe", segments: [P("in", "on"), R("scribe", "write/carve")], pos: "verb", meaning: "to write or carve on a surface", distractors: ["to erase", "to translate", "to buy"], connotation: "0", difficulty: 2 },
  { word: "prescribe", segments: [P("pre", "before"), R("scribe", "write")], pos: "verb", meaning: "to recommend as a remedy", distractors: ["to forbid", "to describe an appearance", "to doodle"], connotation: "0", difficulty: 2 },
  { word: "transport", segments: [P("trans", "across"), R("port", "carry")], pos: "verb", meaning: "to carry from one place to another", distractors: ["to keep still", "to destroy", "to buy"], connotation: "0", difficulty: 1 },
  { word: "export", segments: [P("ex", "out"), R("port", "carry")], pos: "verb", meaning: "to send goods abroad", distractors: ["to bring goods in", "to hide valuables", "to count amounts"], connotation: "0", difficulty: 1 },
  { word: "audible", segments: [R("aud", "hear"), S("ible", "able to (adj)")], pos: "adjective", meaning: "able to be heard", distractors: ["able to be seen", "impossible to hear", "edible"], connotation: "0", difficulty: 1 },
  { word: "inaudible", segments: [P("in", "not"), R("aud", "hear"), S("ible", "able to (adj)")], pos: "adjective", meaning: "impossible to hear", distractors: ["very loud", "easy to read", "visible"], connotation: "0", difficulty: 2 },
  { word: "credible", segments: [R("cred", "believe"), S("ible", "able to (adj)")], pos: "adjective", meaning: "believable; trustworthy", distractors: ["absurd", "invisible", "illegal"], connotation: "+", difficulty: 2 },
  { word: "incredible", segments: [P("in", "not"), R("cred", "believe"), S("ible", "able to (adj)")], pos: "adjective", meaning: "hard to believe; amazing", distractors: ["dull and ordinary", "completely believable", "trivial"], connotation: "+", difficulty: 2 },
  { word: "revive", segments: [P("re", "again"), R("vive", "live")], pos: "verb", meaning: "to bring back to life or use", distractors: ["to destroy utterly", "to put to sleep", "to forget"], connotation: "+", difficulty: 2 },
  { word: "survive", segments: [P("sur", "over/beyond"), R("vive", "live")], pos: "verb", meaning: "to continue to live", distractors: ["to die", "to flee", "to surrender"], connotation: "+", difficulty: 1 },
  { word: "intervene", segments: [P("inter", "between"), R("vene", "come")], pos: "verb", meaning: "to come between to alter events", distractors: ["to stay out of it", "to arrive at the same time", "to leave entirely"], connotation: "0", difficulty: 3 },
  { word: "convene", segments: [P("con", "together"), R("vene", "come")], pos: "verb", meaning: "to come together for a meeting", distractors: ["to disband", "to leave alone", "to refuse to attend"], connotation: "0", difficulty: 3 },
  { word: "illegible", segments: [P("il", "not"), R("leg", "read"), S("ible", "able to (adj)")], pos: "adjective", meaning: "impossible to read; badly written", distractors: ["clear and readable", "lawful", "loud"], connotation: "-", difficulty: 3 },
  { word: "immortal", segments: [P("im", "not"), R("mort", "death"), S("al", "-al (adj)")], pos: "adjective", meaning: "living forever", distractors: ["dying soon", "highly moral", "moving"], connotation: "+", difficulty: 2 },
  { word: "immature", segments: [P("im", "not"), R("mature", "mature")], pos: "adjective", meaning: "not fully developed; childish", distractors: ["fully grown", "enormous", "dangerous"], connotation: "-", difficulty: 1 },
  { word: "benefactor", segments: [P("bene", "good"), R("fact", "do/make"), S("or", "person (noun)")], pos: "noun", meaning: "a person who gives help", distractors: ["a person who receives help", "a factory worker", "an opponent"], connotation: "+", difficulty: 3 },
  { word: "contradict", segments: [P("contra", "against"), R("dict", "say")], pos: "verb", meaning: "to say the opposite of; to conflict with", distractors: ["to agree with", "to predict the future", "to repeat loudly"], connotation: "0", difficulty: 2 },
  { word: "predict", segments: [P("pre", "before"), R("dict", "say")], pos: "verb", meaning: "to say what will happen", distractors: ["to recall the past", "to forbid", "to translate"], connotation: "0", difficulty: 1 },
  { word: "dehydrate", segments: [P("de", "remove"), R("hydr", "water"), S("ate", "make (verb)")], pos: "verb", meaning: "to remove water from; to dry out", distractors: ["to add water", "to boil", "to freeze"], connotation: "-", difficulty: 3 },
  { word: "synchronize", segments: [P("syn", "together"), R("chron", "time"), S("ize", "make (verb)")], pos: "verb", meaning: "to make happen at the same time", distractors: ["to delay", "to do separately", "to keep time"], connotation: "0", difficulty: 3 },
  { word: "anonymous", segments: [P("an", "without"), R("onym", "name"), S("ous", "-ous (adj)")], pos: "adjective", meaning: "without a known name", distractors: ["signed", "famous", "unique"], connotation: "0", difficulty: 2 },
  { word: "antagonist", segments: [P("ant", "against"), R("agon", "struggle"), S("ist", "person (noun)")], pos: "noun", meaning: "an opponent or adversary", distractors: ["an ally", "a bystander", "the hero's helper"], connotation: "-", difficulty: 3 },
  { word: "philanthropy", segments: [R("phil", "love"), R("anthrop", "human"), S("y", "noun")], pos: "noun", meaning: "love of humankind shown by giving", distractors: ["hatred of people", "the study of nature", "personal ambition"], connotation: "+", difficulty: 4 },
  { word: "omnipotent", segments: [P("omni", "all"), R("potent", "power")], pos: "adjective", meaning: "having unlimited power", distractors: ["weak and powerless", "present everywhere", "knowing nothing"], connotation: "0", difficulty: 4 },
  { word: "disharmony", segments: [P("dis", "not/lack of"), R("harmony", "harmony")], pos: "noun", meaning: "lack of agreement; discord", distractors: ["perfect agreement", "loud music", "a quiet setting"], connotation: "-", difficulty: 2 },
];

async function main() {
  for (const w of WORDS) {
    const joined = w.segments.map((s) => s.text).join("");
    if (joined !== w.word) throw new Error(`segment mismatch: ${w.word} != ${joined}`);
  }

  await prisma.gameItem.deleteMany({ where: { gameType: "morphology" } });
  for (const w of WORDS) {
    const { difficulty, ...payload } = w;
    await prisma.gameItem.create({ data: { gameType: "morphology", domain: "words_in_context", difficulty, payload } });
  }
  console.log(`morphology: ${WORDS.length}`);
  console.log("P2 seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
