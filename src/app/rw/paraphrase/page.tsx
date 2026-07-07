"use client";

import { useState } from "react";
import { useGameItems } from "@/lib/use-game-items";
import { recordProgress } from "@/lib/record-progress";
import { MethodCard } from "@/components/rw/method-card";
import { METHODS } from "@/lib/rw-methods";

type Option = { t: string; correct?: boolean; why: string };
type ParaItem = {
  id: string;
  payload: { source: string; options: Option[] };
};

export default function ParaphrasePage() {
  const { items, loading } = useGameItems<ParaItem>("paraphrase");
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [clean, setClean] = useState(0);

  const item = items[idx];

  function pick(i: number) {
    if (!item || picked !== null) return;
    setPicked(i);
    const correct = !!item.payload.options[i].correct;
    if (correct) setClean((c) => c + 1);
    recordProgress({ gameType: "paraphrase", skill: "info_ideas", itemId: item.id, result: correct ? "correct" : "incorrect" });
  }

  function next() {
    if (idx === items.length - 1) {
      setIdx(items.length);
      return;
    }
    setIdx((i) => i + 1);
    setPicked(null);
  }

  if (loading) {
    return <main className="mx-auto max-w-lg flex-1 px-4 py-8 text-slate-500">Loading…</main>;
  }
  if (items.length === 0) {
    return <main className="mx-auto max-w-lg flex-1 px-4 py-8 text-slate-500">No items yet.</main>;
  }

  if (idx >= items.length) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Round complete</h1>
        <p className="mt-2 text-slate-500">
          {clean} / {items.length} questions with the right paraphrase on the first try.
        </p>
        <button
          className="mt-6 rounded-full bg-slate-900 px-6 py-2 font-semibold text-white"
          onClick={() => {
            setIdx(0);
            setClean(0);
            setPicked(null);
          }}
        >
          Play again
        </button>
      </main>
    );
  }

  const answered = picked !== null;

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
        <span>
          {idx + 1} / {items.length}
        </span>
        <span>{clean} first-try</span>
      </div>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Paraphrase Match</h1>
      <p className="mt-1 text-sm text-slate-500">Pick the paraphrase closest in meaning to this sentence.</p>

      <MethodCard {...METHODS.paraphrase} />

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="text-xs font-semibold uppercase text-slate-400">Source</div>
        <p className="mt-1 text-base text-slate-800">{item.payload.source}</p>
      </div>

      <div className="mt-4 space-y-2">
        {item.payload.options.map((o, i) => {
          const reveal = answered && (o.correct || i === picked);
          return (
            <div key={i}>
              <button
                onClick={() => pick(i)}
                disabled={answered}
                className={`w-full rounded-lg border p-3 text-left text-sm transition ${
                  answered && o.correct
                    ? "border-emerald-400 bg-emerald-50 font-semibold text-emerald-700"
                    : answered && i === picked
                    ? "border-rose-300 bg-rose-50 text-rose-600"
                    : answered
                    ? "opacity-40"
                    : "border-slate-200 bg-slate-50 hover:border-slate-400"
                }`}
              >
                {o.t}
              </button>
              {reveal && (
                <p className={`mt-1 px-1 text-xs ${o.correct ? "text-emerald-600" : "text-slate-400"}`}>
                  {o.correct ? "✓ " : "✗ "}
                  {o.why}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {answered && (
        <button onClick={next} className="mt-4 w-full rounded-lg bg-slate-900 py-2 font-semibold text-white">
          {idx === items.length - 1 ? "See summary" : "Next"}
        </button>
      )}
    </main>
  );
}
