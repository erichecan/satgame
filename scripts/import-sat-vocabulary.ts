import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import sat262 from "../prisma/content/262-sat-vocab.json";
import questionBankWords from "../prisma/content/questionbank-vocab.json";
import questionBankFrequency from "../prisma/content/questionbank-frequency.json";
import synonymClusters from "../prisma/content/sat-vocab-synonym-clusters.json";

type Entry = {
  word: string;
  partOfSpeech: string | null;
  definitionEn: string;
  exampleEn: string | null;
  synonyms?: string[];
  sourceTags: string[];
  source?: string;
  rank?: number;
  questionCount?: number;
  mentionCount?: number;
  wicCorrectOptionCount?: number;
};

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const groupByWord = new Map<string, (typeof synonymClusters)[number]>();
  for (const group of synonymClusters) {
    for (const word of group.words) groupByWord.set(word.toLowerCase(), group);
  }

  const merged = new Map<string, Entry>();
  sat262.forEach((entry, index) => merged.set(entry.word.toLowerCase(), { ...entry, rank: 5000 + index }));
  questionBankWords.forEach((entry, index) => {
    const key = entry.word.toLowerCase();
    const prior = merged.get(key);
    merged.set(key, prior
      ? { ...entry, ...prior, sourceTags: [...new Set([...entry.sourceTags, ...prior.sourceTags])], rank: prior.rank }
      : { ...entry, rank: 7000 + index });
  });

  for (const entry of merged.values()) {
    const key = entry.word.toLowerCase();
    const old = await prisma.word.findUnique({ where: { word: key } });
    const group = groupByWord.get(key);
    const tags = [...new Set([...(old?.sourceTags ?? []), ...entry.sourceTags])];
    const synonyms = group
      ? group.words.filter((candidate) => candidate.toLowerCase() !== key)
      : entry.synonyms ?? old?.synonyms ?? [];
    const stats = {
      qbankQuestionCount: entry.questionCount ?? old?.qbankQuestionCount ?? 0,
      qbankMentionCount: entry.mentionCount ?? old?.qbankMentionCount ?? 0,
      qbankWicAnswerCount: entry.wicCorrectOptionCount ?? old?.qbankWicAnswerCount ?? 0,
    };
    const data = {
      partOfSpeech: old?.partOfSpeech ?? entry.partOfSpeech,
      definitionEn: old?.definitionEn || entry.definitionEn,
      exampleEn: old?.exampleEn || entry.exampleEn,
      synonyms,
      sourceTags: tags,
      synonymGroup: group?.key ?? old?.synonymGroup ?? null,
      tier: old?.tier ?? "sat_core",
      rank: old?.rank === 9999 || !old ? entry.rank ?? 9999 : old.rank,
      ...stats,
    };
    await prisma.word.upsert({
      where: { word: key },
      create: { word: key, ...data },
      update: data,
    });
  }

  // Clear then reapply snapshot counts so words absent from the public bank stay at zero.
  await prisma.word.updateMany({
    data: { qbankQuestionCount: 0, qbankMentionCount: 0, qbankWicAnswerCount: 0 },
  });
  const statsRows = Object.entries(questionBankFrequency.wordStats).map(([word, stats]) => ({
    word: word.toLowerCase(),
    questionCount: stats.questionCount,
    mentionCount: stats.mentionCount,
    wicCorrectOptionCount: stats.wicCorrectOptionCount,
  }));
  await prisma.$executeRaw`
    UPDATE "Word" AS target
    SET "qbankQuestionCount" = source."questionCount",
        "qbankMentionCount" = source."mentionCount",
        "qbankWicAnswerCount" = source."wicCorrectOptionCount"
    FROM jsonb_to_recordset(${JSON.stringify(statsRows)}::jsonb)
      AS source("word" text, "questionCount" integer, "mentionCount" integer, "wicCorrectOptionCount" integer)
    WHERE lower(target."word") = source."word"
  `;

  const imported262 = await prisma.word.count({ where: { sourceTags: { has: "sat_262" } } });
  const importedQbank = await prisma.word.count({ where: { sourceTags: { has: "qbank_wic" } } });
  console.log(JSON.stringify({ imported262, importedQbank, snapshotQuestions: questionBankFrequency.questionCount }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
