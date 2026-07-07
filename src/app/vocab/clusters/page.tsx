"use client";

import { useEffect, useMemo, useState } from "react";
import { WordChip } from "@/components/learning/word-chip";
import { Card } from "@/components/ui/card";

type Group = { theme: string; words: { word: string; gloss: string }[] };
type Tile = { word: string; gloss: string; groupIndex: number };
type PuzzleItem = { id: string; payload: { groups: Group[] } };

const TIER_COLORS = ["bg-amber-200", "bg-emerald-200", "bg-sky-200", "bg-fuchsia-200"];

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ClustersPage() {
  const [puzzles, setPuzzles] = useState<PuzzleItem[]>([]);
  const [pIdx, setPIdx] = useState(0);
  const [remaining, setRemaining] = useState<Tile[]>([]);
  const [selected, setSelected] = useState<Tile[]>([]);
  const [mistakes, setMistakes] = useState(4);
  const [solvedGroups, setSolvedGroups] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [recorded, setRecorded] = useState(false);

  useEffect(() => {
    fetch("/api/game-items?gameType=clusters")
      .then((r) => r.json())
      .then((d) => setPuzzles(d.items));
  }, []);

  const puzzle = puzzles[pIdx % Math.max(puzzles.length, 1)];

  useEffect(() => {
    if (!puzzle) return;
    const tiles: Tile[] = [];
    puzzle.payload.groups.forEach((g, gi) =>
      g.words.forEach((w) => tiles.push({ word: w.word, gloss: w.gloss, groupIndex: gi }))
    );
    setRemaining(shuffled(tiles));
    setSelected([]);
    setMistakes(4);
    setSolvedGroups([]);
    setMessage("");
    setRecorded(false);
  }, [puzzle]);

  const isDone = puzzle && (remaining.length === 0 || mistakes <= 0);

  function recordResult(correct: boolean) {
    if (recorded || !puzzle) return;
    setRecorded(true);
    fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameType: "clusters",
        skill: "craft_structure",
        itemId: puzzle.id,
        result: correct ? "correct" : "incorrect",
      }),
    });
  }

  function toggle(tile: Tile) {
    if (isDone) return;
    setSelected((sel) => {
      if (sel.includes(tile)) return sel.filter((t) => t !== tile);
      if (sel.length >= 4) return sel;
      return [...sel, tile];
    });
  }

  function submit() {
    if (selected.length !== 4 || !puzzle) return;
    const groupIndex = selected[0].groupIndex;
    const allSame = selected.every((t) => t.groupIndex === groupIndex);
    if (allSame) {
      setSolvedGroups((s) => [...s, groupIndex]);
      setRemaining((r) => r.filter((t) => t.groupIndex !== groupIndex));
      setSelected([]);
      const remainingAfter = remaining.filter((t) => t.groupIndex !== groupIndex);
      if (remainingAfter.length === 0) {
        setMessage(`All groups found — ${mistakes} lives left ✦`);
        recordResult(true);
      } else {
        setMessage("Right, keep going.");
      }
    } else {
      const counts: Record<number, number> = {};
      selected.forEach((t) => (counts[t.groupIndex] = (counts[t.groupIndex] ?? 0) + 1));
      const maxIn = Math.max(...Object.values(counts));
      const nextMistakes = mistakes - 1;
      setMistakes(nextMistakes);
      setMessage(maxIn === 3 ? "One off… try again." : "Not a group—think again.");
      if (nextMistakes <= 0) {
        setMessage("Out of chances—here are the correct groups.");
        recordResult(false);
      }
    }
  }

  const revealGroups = useMemo(() => {
    if (!puzzle || mistakes > 0) return solvedGroups;
    return puzzle.payload.groups.map((_, i) => i);
  }, [puzzle, mistakes, solvedGroups]);

  if (!puzzle) {
    return <main className="mx-auto max-w-lg flex-1 px-4 py-8 text-slate-500">Loading…</main>;
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Clusters</h1>
      <p className="mt-1 text-sm text-slate-500">
        Sort the 16 words into 4 groups by exact meaning. Some look like they belong together but mean different things. 4 mistakes allowed.
      </p>

      <div className="mt-4 space-y-2">
        {revealGroups.map((gi) => {
          const g = puzzle.payload.groups[gi];
          return (
            <div key={gi} className={`rounded-xl p-3 text-center ${TIER_COLORS[gi % 4]}`}>
              <div className="text-xs font-bold uppercase tracking-wide">{g.theme}</div>
              <div className="mt-1 flex flex-wrap justify-center gap-x-2 text-sm">
                {g.words.map((w) => (
                  <span key={w.word} className="font-semibold">
                    <WordChip word={w.word} sourceGame="clusters" /> — {w.gloss}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {!isDone && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {remaining.map((tile) => (
            <button
              key={tile.word}
              onClick={() => toggle(tile)}
              className={`aspect-[1.3/1] rounded-lg border p-1 text-center text-xs font-bold transition ${
                selected.includes(tile)
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-800 hover:border-slate-400"
              }`}
            >
              {tile.word}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
        <span>Lives left</span>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-2.5 w-2.5 rounded-full ${i < mistakes ? "bg-slate-900" : "bg-slate-200"}`}
          />
        ))}
      </div>
      <p className="mt-2 min-h-5 text-center text-sm font-semibold text-slate-900">{message}</p>

      {!isDone && (
        <div className="mt-3 flex justify-center gap-3">
          <button
            className="rounded-full border border-slate-900 px-5 py-2 text-sm font-bold disabled:opacity-30"
            disabled={selected.length === 0}
            onClick={() => setSelected([])}
          >
            Deselect
          </button>
          <button
            className="rounded-full border border-slate-900 bg-slate-900 px-5 py-2 text-sm font-bold text-white disabled:opacity-30"
            disabled={selected.length !== 4}
            onClick={submit}
          >
            Submit
          </button>
        </div>
      )}

      {isDone && (
        <button
          className="mt-4 w-full rounded-full bg-slate-900 py-3 text-sm font-bold text-white"
          onClick={() => setPIdx((i) => i + 1)}
        >
          Next group
        </button>
      )}
    </main>
  );
}
