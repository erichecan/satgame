import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const dir = join(__dirname, "..", "prisma", "content", "batches");
const files = readdirSync(dir).filter((f) => f.endsWith(".json"));

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

for (const file of files) {
  const path = join(dir, file);
  const data = JSON.parse(readFileSync(path, "utf-8"));
  for (const q of data.quizzes) {
    q.options = shuffle(q.options);
  }
  writeFileSync(path, JSON.stringify(data, null, 2));
  console.log(`${file}: shuffled ${data.quizzes.length} quiz option sets`);
}
