"use client";

import { useMemo, useState } from "react";
import { useGameItems } from "@/lib/use-game-items";
import { recordProgress } from "@/lib/record-progress";
import { MethodCard } from "@/components/rw/method-card";
import { METHODS } from "@/lib/rw-methods";

type Token = { text: string; core: boolean };
type TrimItem = {
  id: string;
  payload: { tokens: Token[]; gloss: string };
};

export default function TrimPage() {
  const { items, loading } = useGameItems<TrimItem>("trim");
  const [idx, setIdx] = useState(0);
  const [dropped, setDropped] = useState<Set<number>>(new Set());
  const [checked, setChecked] = useState(false);
  const [clean, setClean] = useState(0);

  const item = items[idx];

  const correct = useMemo(() => {
    if (!item) return false;
    return item.payload.tokens.every((t, i) => t.core === !dropped.has(i));
  }, [item, dropped]);

  function toggle(i: number) {
    if (checked) return;
    setDropped((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function check() {
    if (!item || checked) return;
    // 直接从当前 dropped 计算，避免依赖 memo 闭包的时序
    const ok = item.payload.tokens.every((t, i) => t.core === !dropped.has(i));
    setChecked(true);
    if (ok) setClean((c) => c + 1);
    recordProgress({ gameType: "trim", skill: "craft_structure", itemId: item.id, result: ok ? "correct" : "incorrect" });
  }

  function next() {
    if (idx === items.length - 1) {
      setIdx(items.length);
      return;
    }
    setIdx((i) => i + 1);
    setDropped(new Set());
    setChecked(false);
  }

  if (loading) {
    return <main className="mx-auto max-w-lg flex-1 px-4 py-8 text-slate-500">加载中…</main>;
  }
  if (items.length === 0) {
    return <main className="mx-auto max-w-lg flex-1 px-4 py-8 text-slate-500">暂无题目。</main>;
  }

  if (idx >= items.length) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">本轮完成</h1>
        <p className="mt-2 text-slate-500">
          {clean} / {items.length} 句一次就留对主干。
        </p>
        <button
          className="mt-6 rounded-full bg-slate-900 px-6 py-2 font-semibold text-white"
          onClick={() => {
            setIdx(0);
            setClean(0);
            setDropped(new Set());
            setChecked(false);
          }}
        >
          再来一轮
        </button>
      </main>
    );
  }

  const core = item.payload.tokens.filter((t) => t.core).map((t) => t.text).join(" ");

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
        <span>
          {idx + 1} / {items.length}
        </span>
        <span>{clean} 句留对主干</span>
      </div>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Trim the Sentence</h1>
      <p className="mt-1 text-sm text-slate-500">点掉修饰成分，只留下主干（主 + 谓 + 宾）。</p>

      <MethodCard {...METHODS.trim} />

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-lg leading-loose">
        {item.payload.tokens.map((t, i) => {
          const isDropped = dropped.has(i);
          const wrong = checked && t.core === isDropped; // 该留却删 / 该删却留
          return (
            <span
              key={i}
              onClick={() => toggle(i)}
              className={`cursor-pointer rounded px-0.5 ${
                isDropped ? "text-slate-300 line-through" : "text-slate-800"
              } ${wrong ? "bg-rose-100 ring-1 ring-rose-300" : checked && t.core ? "bg-emerald-100" : "hover:bg-slate-100"}`}
            >
              {t.text}{" "}
            </span>
          );
        })}
      </div>

      {!checked ? (
        <button onClick={check} className="mt-4 w-full rounded-lg bg-slate-900 py-2 font-semibold text-white">
          检查主干
        </button>
      ) : (
        <>
          <div className={`mt-4 rounded-lg p-3 text-sm ${correct ? "bg-emerald-50" : "bg-rose-50"}`}>
            <div className={`font-semibold ${correct ? "text-emerald-600" : "text-rose-500"}`}>
              {correct ? "主干留对了" : "还差一点"}
            </div>
            <p className="mt-1 text-slate-700">
              主干：<b>{core}</b>
            </p>
            <p className="mt-1 text-xs text-slate-500">{item.payload.gloss}</p>
          </div>
          <button onClick={next} className="mt-4 w-full rounded-lg bg-slate-900 py-2 font-semibold text-white">
            {idx === items.length - 1 ? "看总结" : "下一句"}
          </button>
        </>
      )}
    </main>
  );
}
