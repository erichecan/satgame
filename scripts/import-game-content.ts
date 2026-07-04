import "dotenv/config";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { prisma } from "../src/lib/db";

type BatchItem = {
  gameType: string;
  domain: string;
  difficulty?: number;
  payload: unknown;
  explanation?: string | null;
  words?: string[];
};

type Batch = { items: BatchItem[] };

const VALID_GAME_TYPES = new Set([
  "clusters",
  "closer",
  "read_the_green",
  "gate_run",
  "dissector",
]);

async function main() {
  const dirArg = process.argv[2] ?? join("prisma", "content", "game-batches");
  const contentDir = join(__dirname, "..", dirArg);
  const files = readdirSync(contentDir).filter((f) => f.endsWith(".json"));
  console.log(`Importing from ${contentDir} — found ${files.length} batch files`);

  // 预取全部单词，做 word -> id 映射（小写）
  const allWords = await prisma.word.findMany({ select: { id: true, word: true } });
  const wordIdMap = new Map(allWords.map((w) => [w.word.toLowerCase(), w.id]));

  let created = 0;
  let skipped = 0;
  const perType: Record<string, number> = {};

  for (const file of files) {
    const batch: Batch = JSON.parse(readFileSync(join(contentDir, file), "utf-8"));
    for (const item of batch.items) {
      if (!VALID_GAME_TYPES.has(item.gameType)) {
        skipped++;
        continue;
      }
      const words = item.words ?? [];
      const wordIds = words
        .map((w) => wordIdMap.get(w.toLowerCase()))
        .filter((id): id is string => Boolean(id));

      await prisma.gameItem.create({
        data: {
          gameType: item.gameType,
          domain: item.domain,
          difficulty: item.difficulty ?? 2,
          payload: item.payload as object,
          wordIds,
          explanation: item.explanation ?? null,
        },
      });
      created++;
      perType[item.gameType] = (perType[item.gameType] ?? 0) + 1;
    }
    console.log(`${file}: ${batch.items.length} items processed`);
  }

  console.log("---");
  console.log(`GameItems created: ${created}, skipped (bad gameType): ${skipped}`);
  console.log(`Per game type:`, perType);

  const totals = await prisma.gameItem.groupBy({ by: ["gameType"], _count: true });
  console.log(`DB totals per game type:`, totals);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
