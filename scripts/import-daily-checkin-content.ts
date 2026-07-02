import "dotenv/config";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { prisma } from "../src/lib/db";

type WordEntry = {
  word: string;
  pos: string;
  definitionEn: string;
  exampleEn: string;
  tier: "foundation" | "sat_core";
  rank: number;
  synonymGroup?: string;
};

type QuizEntry = {
  passage: string;
  question: string;
  options: { t: string; correct?: boolean }[];
  words: string[];
  domain: string;
  explanation: string;
};

type Batch = {
  words: WordEntry[];
  quizzes: QuizEntry[];
};

async function main() {
  const contentDir = join(__dirname, "..", "prisma", "content", "batches");
  const files = readdirSync(contentDir).filter((f) => f.endsWith(".json"));
  console.log(`Found ${files.length} batch files`);

  let wordsCreated = 0;
  let wordsSkipped = 0;
  let quizzesCreated = 0;
  let quizzesSkipped = 0;

  for (const file of files) {
    const batch: Batch = JSON.parse(readFileSync(join(contentDir, file), "utf-8"));

    for (const w of batch.words) {
      const existing = await prisma.word.findUnique({ where: { word: w.word } });
      if (existing) {
        wordsSkipped++;
        continue;
      }
      await prisma.word.create({
        data: {
          word: w.word,
          partOfSpeech: w.pos,
          definitionEn: w.definitionEn,
          exampleEn: w.exampleEn,
          difficulty: w.tier === "sat_core" ? 2 : 1,
          tier: w.tier,
          rank: w.rank,
          synonymGroup: w.synonymGroup,
        },
      });
      wordsCreated++;
    }

    for (const q of batch.quizzes) {
      const wordRows = await prisma.word.findMany({
        where: { word: { in: q.words } },
        select: { id: true, word: true },
      });
      const wordIds = wordRows.map((r) => r.id);
      if (wordIds.length === 0) {
        quizzesSkipped++;
        continue;
      }
      await prisma.quizItem.create({
        data: {
          passage: q.passage,
          question: q.question,
          options: q.options,
          wordIds,
          domain: q.domain,
          difficulty: 2,
          explanation: q.explanation,
        },
      });
      quizzesCreated++;
    }

    console.log(`${file}: ${batch.words.length} words, ${batch.quizzes.length} quizzes processed`);
  }

  console.log("---");
  console.log(`Words created: ${wordsCreated}, skipped (duplicate): ${wordsSkipped}`);
  console.log(`Quizzes created: ${quizzesCreated}, skipped (no matching words): ${quizzesSkipped}`);

  const totalWords = await prisma.word.count();
  const totalQuizzes = await prisma.quizItem.count();
  console.log(`Final DB totals — Word: ${totalWords}, QuizItem: ${totalQuizzes}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
