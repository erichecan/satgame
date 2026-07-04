import "dotenv/config";
import { writeFileSync } from "fs";
import { join } from "path";
import { prisma } from "../src/lib/db";

async function main() {
  const words = await prisma.word.findMany({
    where: { isActive: true },
    select: {
      id: true,
      word: true,
      partOfSpeech: true,
      definitionEn: true,
      definitionCn: true,
      exampleEn: true,
      tier: true,
      rank: true,
      synonymGroup: true,
    },
    orderBy: [{ tier: "asc" }, { rank: "asc" }],
  });

  const outPath = join(__dirname, "..", "prisma", "content", "words-export.json");
  writeFileSync(outPath, JSON.stringify(words, null, 2));

  // synonymGroup 分布分析（Clusters 分组取材用）
  const groups: Record<string, string[]> = {};
  for (const w of words) {
    if (!w.synonymGroup) continue;
    (groups[w.synonymGroup] ??= []).push(w.word);
  }
  const groupSizes: Record<number, number> = {};
  for (const g of Object.values(groups)) {
    groupSizes[g.length] = (groupSizes[g.length] ?? 0) + 1;
  }

  console.log(`Total active words: ${words.length}`);
  console.log(`Words with a synonymGroup: ${words.filter((w) => w.synonymGroup).length}`);
  console.log(`Distinct synonymGroups: ${Object.keys(groups).length}`);
  console.log(`Group size distribution (size: count):`, groupSizes);
  console.log(`Sample groups:`);
  Object.entries(groups)
    .slice(0, 12)
    .forEach(([k, v]) => console.log(`  ${k}: ${v.join(", ")}`));
  console.log(`Exported to ${outPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
