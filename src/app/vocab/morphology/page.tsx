"use client";

import { useEffect, useMemo, useState } from "react";
import { useGameItems } from "@/lib/use-game-items";
import { recordProgress } from "@/lib/record-progress";
import { MethodCard } from "@/components/rw/method-card";
import { METHODS } from "@/lib/rw-methods";

type Segment = { text: string; kind: "prefix" | "root" | "suffix"; gloss: string };
type MorphItem = {
  id: string;
  payload: {
    word: string;
    segments: Segment[];
    pos: "noun" | "verb" | "adjective" | "adverb";
    meaning: string;
    distractors: string[];
    connotation: "+" | "-" | "0";
  };
};

type Phase = "split" | "pos" | "meaning" | "conn" | "done";

const KIND_LABEL = { prefix: "前缀", root: "词根", suffix: "后缀" };
const POS_OPTIONS: MorphItem["payload"]["pos"][] = ["noun", "verb", "adjective", "adverb"];
const POS_LABEL = { noun: "名词", verb: "动词", adjective: "形容词", adverb: "副词" };
const CONN_LABEL = { "+": "褒义", "-": "贬义", "0": "中性" };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MorphologyPage() {
  const { items, loading } = useGameItems<MorphItem>("morphology");
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("split");
  const [cuts, setCuts] = useState<Set<number>>(new Set());
  const [firstTry, setFirstTry] = useState(true);
  const [posPick, setPosPick] = useState<string | null>(null);
  const [meaningPick, setMeaningPick] = useState<string | null>(null);
  const [connPick, setConnPick] = useState<string | null>(null);
  const [clean, setClean] = useState(0);

  const item = items[idx];

  // 期望切分位置:每个 segment 结束处的累计字母数(不含末尾)
  const expectedCuts = useMemo(() => {
    if (!item) return new Set<number>();
    const s = new Set<number>();
    let acc = 0;
    item.payload.segments.forEach((seg, i) => {
      acc += seg.text.length;
      if (i < item.payload.segments.length - 1) s.add(acc);
    });
    return s;
  }, [item]);

  const meaningOptions = useMemo(
    () => (item ? shuffle([item.payload.meaning, ...item.payload.distractors]) : []),
    [item]
  );

  useEffect(() => {
    setPhase("split");
    setCuts(new Set());
    setFirstTry(true);
    setPosPick(null);
    setMeaningPick(null);
    setConnPick(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  if (loading) return <main className="mx-auto max-w-lg flex-1 px-4 py-8 text-slate-500">加载中…</main>;
  if (items.length === 0) return <main className="mx-auto max-w-lg flex-1 px-4 py-8 text-slate-500">暂无题目。</main>;

  if (idx >= items.length) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">本轮完成</h1>
        <p className="mt-2 text-slate-500">{clean} / {items.length} 词一次全对。</p>
        <button className="mt-6 rounded-full bg-slate-900 px-6 py-2 font-semibold text-white"
          onClick={() => { setIdx(0); setClean(0); }}>再来一轮</button>
      </main>
    );
  }

  const { word, segments, pos, meaning, connotation } = item.payload;
  const cutsMatch = cuts.size === expectedCuts.size && [...cuts].every((c) => expectedCuts.has(c));

  function toggleCut(pos: number) {
    if (phase !== "split") return;
    setCuts((prev) => {
      const n = new Set(prev);
      n.has(pos) ? n.delete(pos) : n.add(pos);
      return n;
    });
  }

  function checkSplit() {
    if (!cutsMatch) { setFirstTry(false); return; }
    setPhase("pos");
  }

  function pickPos(p: string) {
    if (phase !== "pos" || posPick) return;
    setPosPick(p);
    if (p !== pos) setFirstTry(false);
    setTimeout(() => setPhase("meaning"), 700);
  }

  function pickMeaning(m: string) {
    if (phase !== "meaning" || meaningPick) return;
    setMeaningPick(m);
    if (m !== meaning) setFirstTry(false);
    setTimeout(() => setPhase("conn"), 700);
  }

  function pickConn(c: string) {
    if (phase !== "conn" || connPick) return;
    setConnPick(c);
    const allRight = firstTry && c === connotation;
    if (allRight) setClean((n) => n + 1);
    recordProgress({ gameType: "morphology", skill: "word_structure", itemId: item.id, result: firstTry && c === connotation ? "correct" : "incorrect" });
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
        <span>{clean} 词一次全对</span>
      </div>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Morphology</h1>
      <p className="mt-1 text-sm text-slate-500">拆词猜义：切分 → 定词性 → 判词义与褒贬。</p>

      <MethodCard {...METHODS.morphology} />

      {/* 第一步:切分 */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
        <div className="text-xs font-semibold uppercase text-slate-400">
          {phase === "split" ? "点字母之间的缝，把词切成 前缀/词根/后缀" : "词的构成"}
        </div>
        {phase === "split" ? (
          <div className="mt-3 flex items-center justify-center text-2xl font-mono tracking-wide">
            {word.split("").map((ch, i) => (
              <span key={i} className="flex items-center">
                <span>{ch}</span>
                {i < word.length - 1 && (
                  <span
                    onClick={() => toggleCut(i + 1)}
                    className={`mx-0.5 inline-block h-7 w-1 cursor-pointer rounded ${
                      cuts.has(i + 1) ? "bg-rose-400" : "bg-slate-100 hover:bg-slate-300"
                    }`}
                  />
                )}
              </span>
            ))}
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {segments.map((s, i) => (
              <div key={i} className="rounded-lg bg-slate-50 px-3 py-2 text-center">
                <div className="font-mono text-lg font-semibold text-slate-900">{s.text}</div>
                <div className="text-[11px] text-slate-400">{KIND_LABEL[s.kind]} · {s.gloss}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {phase === "split" && (
        <button onClick={checkSplit} className="mt-4 w-full rounded-lg bg-slate-900 py-2 font-semibold text-white">
          检查切分
        </button>
      )}
      {phase === "split" && !firstTry && !cutsMatch && (
        <p className="mt-2 text-sm text-rose-500">还没切对。提示：这个词有 {segments.length} 段。</p>
      )}

      {/* 第二步:词性(看后缀) */}
      {phase !== "split" && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-900">
            看后缀 “{segments[segments.length - 1].text}” —— 这是什么词性？
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {POS_OPTIONS.map((p) => (
              <button key={p} onClick={() => pickPos(p)} disabled={phase === "pos" ? false : true}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  posPick && p === pos ? "border-emerald-400 bg-emerald-50 font-semibold text-emerald-700"
                  : posPick === p ? "border-rose-300 bg-rose-50 text-rose-600"
                  : phase !== "pos" ? "opacity-40" : "border-slate-200 text-slate-600 hover:border-slate-400"
                }`}>
                {POS_LABEL[p]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 第三步:词义(前缀+词根) */}
      {(phase === "meaning" || phase === "conn" || phase === "done") && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-900">前缀+词根合起来 —— 这个词是什么意思？</p>
          <div className="mt-2 space-y-2">
            {meaningOptions.map((m, i) => (
              <button key={i} onClick={() => pickMeaning(m)} disabled={phase !== "meaning"}
                className={`w-full rounded-lg border p-2.5 text-left text-sm transition ${
                  meaningPick && m === meaning ? "border-emerald-400 bg-emerald-50 font-semibold text-emerald-700"
                  : meaningPick === m ? "border-rose-300 bg-rose-50 text-rose-600"
                  : phase !== "meaning" ? "opacity-40" : "border-slate-200 bg-slate-50 hover:border-slate-400"
                }`}>
                {m}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 第四步:褒贬 */}
      {(phase === "conn" || phase === "done") && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-900">拆完看整体 —— 这个词偏褒 / 贬 / 中性？</p>
          <div className="mt-2 flex gap-2">
            {(["+", "-", "0"] as const).map((c) => (
              <button key={c} onClick={() => pickConn(c)} disabled={phase !== "conn"}
                className={`flex-1 rounded-lg border py-2 text-sm transition ${
                  connPick && c === connotation ? "border-emerald-400 bg-emerald-50 font-semibold text-emerald-700"
                  : connPick === c ? "border-rose-300 bg-rose-50 text-rose-600"
                  : phase !== "conn" ? "opacity-40" : "border-slate-200 text-slate-600 hover:border-slate-400"
                }`}>
                {CONN_LABEL[c]}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
          <div className="font-semibold text-slate-900">{word} · {POS_LABEL[pos]} · {CONN_LABEL[connotation]}</div>
          <p className="mt-1 text-slate-600">{meaning}</p>
          <button onClick={next} className="mt-3 w-full rounded-lg bg-slate-900 py-2 font-semibold text-white">
            {idx === items.length - 1 ? "看总结" : "下一个词"}
          </button>
        </div>
      )}
    </main>
  );
}
