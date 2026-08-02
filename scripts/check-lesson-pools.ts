// 技巧课练习题池体检：每课能取到几题、结构是否完整、正确项位置是否分散。
// 用法：npx tsx scripts/check-lesson-pools.ts
import "dotenv/config";
import { LESSONS } from "../src/content/lessons";
import { loadPracticeItems } from "../src/lib/lesson-practice";

(async () => {
  let structural = 0;
  let thin = 0;
  const posCount: Record<number, number> = {};

  for (const lesson of LESSONS) {
    const items = await loadPracticeItems(lesson, 8, 0);
    const problems: string[] = [];

    for (const it of items) {
      const correct = it.options.filter((o) => o.correct).length;
      if (correct !== 1) problems.push(`${it.id} (${it.source}): ${correct} correct options`);
      if (!it.question) problems.push(`${it.id}: missing question`);
      if (it.options.length < 2) problems.push(`${it.id}: only ${it.options.length} options`);
    }

    const positions = items.map((i) => i.options.findIndex((o) => o.correct));
    for (const p of positions) posCount[p] = (posCount[p] ?? 0) + 1;

    const isThin = items.length < 8;
    if (isThin) thin++;
    console.log(
      `${lesson.slug.padEnd(26)} ${String(items.length).padStart(2)} items  pos=[${positions.join(",")}]${isThin ? "  ⚠️ THIN" : ""}`
    );
    if (problems.length) {
      structural++;
      problems.forEach((p) => console.log(`    ❌ ${p}`));
    }
  }

  console.log(`\nCorrect-answer position spread: ${JSON.stringify(posCount)}`);
  console.log(structural ? `❌ ${structural} lessons with structural problems` : "✅ no structural problems");
  console.log(thin ? `⚠️  ${thin} lessons have fewer than 8 practice items` : "✅ every lesson has a full set");
  process.exit(structural ? 1 : 0);
})();
