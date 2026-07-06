"use client";

import { useEffect, useState } from "react";
import { useGameItems } from "@/lib/use-game-items";
import { recordProgress } from "@/lib/record-progress";
import { MethodCard } from "@/components/rw/method-card";
import { METHODS } from "@/lib/rw-methods";
import { TrapType, TRAP_LABEL } from "@/lib/trap-types";

type ExOpt = { t: string; correct?: boolean };
type Opt = { t: string; correct?: boolean; trap?: string; trapType?: TrapType };
type InfItem = {
  id: string;
  payload: { text: string; exigenceOptions: ExOpt[]; options: Opt[]; why: string };
};

type Phase = "exigence" | "complete" | "done";

export default function InferencePage() {
  const { items, loading } = useGameItems<InfItem>("inference");
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("exigence");
  const [firstTry, setFirstTry] = useState(true);
  const [exPick, setExPick] = useState<number | null>(null);
  const [optPick, setOptPick] = useState<number | null>(null);
  const [clean, setClean] = useState(0);

  const item = items[idx];

  useEffect(() => {
    setPhase("exigence");
    setFirstTry(true);
    setExPick(null);
    setOptPick(null);
  }, [item?.id]);

  if (loading) return <main className="mx-auto max-w-lg flex-1 px-4 py-8 text-slate-500">加载中…</main>;
  if (items.length === 0) return <main className="mx-auto max-w-lg flex-1 px-4 py-8 text-slate-500">暂无题目。</main>;

  if (idx >= items.length) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">本轮完成</h1>
        <p className="mt-2 text-slate-500">{clean} / {items.length} 题一次做对。</p>
        <button className="mt-6 rounded-full bg-slate-900 px-6 py-2 font-semibold text-white"
          onClick={() => { setIdx(0); setClean(0); }}>再来一轮</button>
      </main>
    );
  }

  const { text, exigenceOptions, options, why } = item.payload;
  const filled = optPick !== null ? text.replace("___", `【${options[optPick].t}】`) : text;

  function pickExigence(i: number) {
    if (phase !== "exigence" || !item) return;
    if (exigenceOptions[i].correct) {
      setExPick(i);
      setPhase("complete");
    } else {
      setFirstTry(false);
      setExPick(i);
    }
  }

  function pickOption(i: number) {
    if (phase !== "complete" || optPick !== null || !item) return;
    setOptPick(i);
    const ok = !!options[i].correct;
    const wholeRight = firstTry && ok;
    if (wholeRight) setClean((c) => c + 1);
    recordProgress({
      gameType: "inference",
      skill: "info_ideas",
      itemId: item.id,
      result: wholeRight ? "correct" : "incorrect",
      errorTag: ok ? undefined : options[i].trapType,
    });
    setPhase("done");
  }

  function next() {
    if (idx === items.length - 1) { setIdx(items.length); return; }
    setIdx((i) => i + 1);
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
        <span>{idx + 1} / {items.length}</span>
        <span>{clean} 题一次做对</span>
      </div>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Inference</h1>
      <p className="mt-1 text-sm text-slate-500">先想作者写这段的目的，再选最合逻辑的补全。</p>

      <MethodCard {...METHODS.inference} />

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-[15px] leading-relaxed text-slate-800">
        {phase === "done" ? filled : text}
      </div>

      {/* 第一步:作者目的 */}
      <div className="mt-4">
        <p className="text-sm font-semibold text-slate-900">这段话，作者的目的（exigence）是？</p>
        <div className="mt-2 space-y-2">
          {exigenceOptions.map((o, i) => (
            <button key={i} onClick={() => pickExigence(i)} disabled={phase !== "exigence"}
              className={`w-full rounded-lg border p-2.5 text-left text-sm transition ${
                phase !== "exigence" && o.correct ? "border-emerald-400 bg-emerald-50 font-semibold text-emerald-700"
                : exPick === i && !o.correct ? "border-rose-300 bg-rose-50 text-rose-600"
                : phase !== "exigence" ? "opacity-40" : "border-slate-200 bg-slate-50 hover:border-slate-400"
              }`}>
              {o.t}
            </button>
          ))}
        </div>
        {phase === "exigence" && exPick !== null && !exigenceOptions[exPick].correct && (
          <p className="mt-1 text-sm text-rose-500">再想想：作者为什么要写这段？</p>
        )}
      </div>

      {/* 第二步:补全 */}
      {(phase === "complete" || phase === "done") && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-900">哪一项最合逻辑地补全这段话？</p>
          <div className="mt-2 space-y-2">
            {options.map((o, i) => {
              const reveal = phase === "done" && (o.correct || i === optPick);
              return (
                <div key={i}>
                  <button onClick={() => pickOption(i)} disabled={phase !== "complete"}
                    className={`w-full rounded-lg border p-2.5 text-left text-sm transition ${
                      phase === "done" && o.correct ? "border-emerald-400 bg-emerald-50 font-semibold text-emerald-700"
                      : phase === "done" && i === optPick ? "border-rose-300 bg-rose-50 text-rose-600"
                      : phase === "done" ? "opacity-40" : "border-slate-200 bg-slate-50 hover:border-slate-400"
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
        </div>
      )}

      {phase === "done" && (
        <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
          <div className="font-semibold text-emerald-600">合逻辑的补全</div>
          <p className="mt-1 text-slate-600">{why}</p>
          <button onClick={next} className="mt-3 w-full rounded-lg bg-slate-900 py-2 font-semibold text-white">
            {idx === items.length - 1 ? "看总结" : "下一题"}
          </button>
        </div>
      )}
    </main>
  );
}
