import "dotenv/config";
import { prisma } from "../src/lib/db";

type ClustersPayload = { groups: { words: { word: string }[] }[] };
type CloserPayload = { word: string };
type ReadTheGreenPayload = { sentences: string[] };
type GateRunPayload = { kind: string; doors: string[]; correctIndex: number };

async function wordIdMap(): Promise<Map<string, string>> {
  const words = await prisma.word.findMany({ select: { id: true, word: true } });
  return new Map(words.map((w) => [w.word.toLowerCase(), w.id]));
}

function findWordsInText(text: string, map: Map<string, string>): string[] {
  const tokens = text.toLowerCase().match(/[a-z']+/g) ?? [];
  const found = new Set<string>();
  for (const t of tokens) {
    const id = map.get(t);
    if (id) found.add(id);
  }
  return [...found];
}

async function main() {
  const map = await wordIdMap();
  let updated = 0;
  let skipped = 0;

  const items = await prisma.gameItem.findMany();
  for (const item of items) {
    let wordIds: string[] = [];

    if (item.gameType === "clusters") {
      const payload = item.payload as unknown as ClustersPayload;
      const ids = new Set<string>();
      payload.groups.forEach((g) =>
        g.words.forEach((w) => {
          const id = map.get(w.word.toLowerCase());
          if (id) ids.add(id);
        })
      );
      wordIds = [...ids];
    } else if (item.gameType === "closer") {
      const payload = item.payload as unknown as CloserPayload;
      const id = map.get(payload.word.toLowerCase());
      wordIds = id ? [id] : [];
    } else if (item.gameType === "read_the_green") {
      const payload = item.payload as unknown as ReadTheGreenPayload;
      const ids = new Set<string>();
      payload.sentences.forEach((s) => findWordsInText(s, map).forEach((id) => ids.add(id)));
      wordIds = [...ids];
    } else if (item.gameType === "gate_run") {
      const payload = item.payload as unknown as GateRunPayload;
      if (payload.kind === "transition") {
        const correctWord = payload.doors[payload.correctIndex];
        const id = correctWord ? map.get(correctWord.toLowerCase()) : undefined;
        wordIds = id ? [id] : [];
      }
      // punctuation kind: no word linkage, wordIds stays []
    }
    // dissector: no word linkage by design, wordIds stays []

    if (wordIds.length > 0) {
      await prisma.gameItem.update({ where: { id: item.id }, data: { wordIds } });
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`Updated ${updated} items with wordIds, ${skipped} left unlinked (by design or no match).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
