"use client";

import { useState } from "react";
import { useGameItems } from "@/lib/use-game-items";
import { recordProgress } from "@/lib/record-progress";
import { MethodCard } from "@/components/rw/method-card";
import { METHODS } from "@/lib/rw-methods";
import { TrapType, TRAP_LABEL, TRAP_TIP, TRAP_TYPES } from "@/lib/trap-types";

type Verdict = "correct" | TrapType;
type SpotItem = {
  id: string;
  payload: { passage?: string; question: string; option: string; verdict: Verdict };
};

export default function TrapSpotterPage() {
  const { items, loading } = useGameItems<SpotItem>("trap_spotter");
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<Verdict | null>(null);
  const [clean, setClean] = useState(0);

  const item = items[idx];

  function pick(v: Verdict) {
    if (!item || picked !== null) return;
    setPicked(v);
    const ok = v === item.payload.verdict;
    if (ok) setClean((c) => c + 1);
    // 判错时，记录"没认出的那类陷阱"(item 的真实 verdict,若确为陷阱)
    const missed = !ok && item.payload.verdict !== "correct" ? item.payload.verdict : undefined;
    recordProgress({ gameType: "trap_spotter", skill: "info_ideas", itemId: item.id, result: ok ? "correct" : "incorrect", errorTag: missed });
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
          {clean} / {items.length} judged correctly on the first try.
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
  const verdict = item.payload.verdict;
  const gotIt = picked === verdict;

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
        <span>
          {idx + 1} / {items.length}
        </span>
        <span>{clean} first-try</span>
      </div>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Trap Spotter</h1>
      <p className="mt-1 text-sm text-slate-500">Is this option the correct answer, or which kind of trap?</p>

      <MethodCard {...METHODS.trapTaxonomy} />

      {item.payload.passage && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700">
          {item.payload.passage}
        </div>
      )}
      <p className="mt-3 font-semibold text-slate-900">{item.payload.question}</p>
      <div className="mt-2 rounded-lg border-2 border-slate-300 bg-slate-50 p-3 text-sm text-slate-800">
        {item.payload.option}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => pick("correct")}
          disabled={answered}
          className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
            answered && verdict === "correct"
              ? "border-emerald-400 bg-emerald-50 text-emerald-700"
              : answered && picked === "correct"
              ? "border-rose-300 bg-rose-50 text-rose-600"
              : answered
              ? "opacity-40"
              : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          ✓ Correct answer
        </button>
        {TRAP_TYPES.map((tt) => (
          <button
            key={tt}
            onClick={() => pick(tt)}
            disabled={answered}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              answered && verdict === tt
                ? "border-emerald-400 bg-emerald-50 font-semibold text-emerald-700"
                : answered && picked === tt
                ? "border-rose-300 bg-rose-50 text-rose-600"
                : answered
                ? "opacity-40"
                : "border-slate-200 text-slate-600 hover:border-slate-400"
            }`}
          >
            {TRAP_LABEL[tt]}
          </button>
        ))}
      </div>

      {answered && (
        <div className={`mt-4 rounded-lg p-3 text-sm ${gotIt ? "bg-emerald-50" : "bg-rose-50"}`}>
          <div className={`font-semibold ${gotIt ? "text-emerald-600" : "text-rose-500"}`}>
            {gotIt ? "Correct" : "Think again"}
            {verdict !== "correct" && <span className="ml-1 text-slate-500">· This is “{TRAP_LABEL[verdict]}”</span>}
          </div>
          <p className="mt-1 text-slate-600">
            {verdict === "correct" ? "This option really is correct: it paraphrases the passage without twisting the meaning." : TRAP_TIP[verdict]}
          </p>
          <button onClick={next} className="mt-3 w-full rounded-lg bg-slate-900 py-2 font-semibold text-white">
            {idx === items.length - 1 ? "See summary" : "Next"}
          </button>
        </div>
      )}
    </main>
  );
}
