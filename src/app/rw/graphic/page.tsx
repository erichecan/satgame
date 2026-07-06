"use client";

import { useState } from "react";
import { useGameItems } from "@/lib/use-game-items";
import { recordProgress } from "@/lib/record-progress";
import { MethodCard } from "@/components/rw/method-card";
import { METHODS } from "@/lib/rw-methods";
import { TrapType, TRAP_LABEL } from "@/lib/trap-types";

type Bar = { label: string; value: number };
type Opt = { t: string; correct?: boolean; trap?: string; trapType?: TrapType };
type GraphicItem = {
  id: string;
  payload: { title: string; unit?: string; bars: Bar[]; blurb: string; question: string; options: Opt[]; why: string };
};

export default function GraphicPage() {
  const { items, loading } = useGameItems<GraphicItem>("graphic");
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [clean, setClean] = useState(0);

  const item = items[idx];

  function pick(i: number) {
    if (!item || picked !== null) return;
    setPicked(i);
    const ok = !!item.payload.options[i].correct;
    if (ok) setClean((c) => c + 1);
    recordProgress({
      gameType: "graphic",
      skill: "data_analysis",
      itemId: item.id,
      result: ok ? "correct" : "incorrect",
      errorTag: ok ? undefined : item.payload.options[i].trapType,
    });
  }

  function next() {
    if (idx === items.length - 1) { setIdx(items.length); return; }
    setIdx((i) => i + 1);
    setPicked(null);
  }

  if (loading) return <main className="mx-auto max-w-lg flex-1 px-4 py-8 text-slate-500">加载中…</main>;
  if (items.length === 0) return <main className="mx-auto max-w-lg flex-1 px-4 py-8 text-slate-500">暂无题目。</main>;

  if (idx >= items.length) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">本轮完成</h1>
        <p className="mt-2 text-slate-500">{clean} / {items.length} 题一次选对。</p>
        <button className="mt-6 rounded-full bg-slate-900 px-6 py-2 font-semibold text-white"
          onClick={() => { setIdx(0); setClean(0); setPicked(null); }}>再来一轮</button>
      </main>
    );
  }

  const { title, unit, bars, blurb, question, options, why } = item.payload;
  const max = Math.max(...bars.map((b) => b.value));
  const answered = picked !== null;

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
        <span>{idx + 1} / {items.length}</span>
        <span>{clean} 题一次选对</span>
      </div>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Graphic</h1>
      <p className="mt-1 text-sm text-slate-500">先读题，再读短文找结论，最后看图找规律。</p>

      <MethodCard {...METHODS.graphic} />

      {/* 图表 */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        {unit && <div className="text-xs text-slate-400">单位：{unit}</div>}
        <div className="mt-3 space-y-2">
          {bars.map((b, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="w-28 shrink-0 text-right text-slate-600">{b.label}</span>
              <div className="h-4 flex-1 overflow-hidden rounded bg-slate-100">
                <div className="h-full rounded bg-slate-800" style={{ width: `${(b.value / max) * 100}%` }} />
              </div>
              <span className="w-12 shrink-0 font-mono text-slate-700">{b.value}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{blurb}</p>
      <p className="mt-3 font-semibold text-slate-900">{question}</p>

      <div className="mt-2 space-y-2">
        {options.map((o, i) => {
          const reveal = answered && (o.correct || i === picked);
          return (
            <div key={i}>
              <button onClick={() => pick(i)} disabled={answered}
                className={`w-full rounded-lg border p-2.5 text-left text-sm transition ${
                  answered && o.correct ? "border-emerald-400 bg-emerald-50 font-semibold text-emerald-700"
                  : answered && i === picked ? "border-rose-300 bg-rose-50 text-rose-600"
                  : answered ? "opacity-40" : "border-slate-200 bg-slate-50 hover:border-slate-400"
                }`}>
                {o.t}
              </button>
              {reveal && !o.correct && (
                <p className="mt-1 px-1 text-xs text-slate-400">
                  {o.trapType && <span className="font-semibold">【{TRAP_LABEL[o.trapType]}】</span>} {o.trap}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {answered && (
        <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
          <div className="font-semibold text-emerald-600">读图要点</div>
          <p className="mt-1 text-slate-600">{why}</p>
          <button onClick={next} className="mt-3 w-full rounded-lg bg-slate-900 py-2 font-semibold text-white">
            {idx === items.length - 1 ? "看总结" : "下一题"}
          </button>
        </div>
      )}
    </main>
  );
}
