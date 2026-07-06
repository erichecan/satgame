"use client";

import { useEffect, useRef, useState } from "react";
import { useGameItems } from "@/lib/use-game-items";
import { recordProgress } from "@/lib/record-progress";
import { MethodCard } from "@/components/rw/method-card";
import { METHODS } from "@/lib/rw-methods";

type Conn = "+" | "-" | "0";
type ConnItem = { id: string; payload: { word: string; sentence: string; answer: Conn } };

const CHOICES: { key: Conn; label: string; cls: string }[] = [
  { key: "+", label: "褒义", cls: "border-emerald-400 text-emerald-700 hover:bg-emerald-50" },
  { key: "0", label: "中性", cls: "border-slate-300 text-slate-600 hover:bg-slate-100" },
  { key: "-", label: "贬义", cls: "border-rose-400 text-rose-600 hover:bg-rose-50" },
];

function renderSentence(sentence: string, word: string) {
  const re = new RegExp(`\\b(${word})\\b`, "i");
  const parts = sentence.split(re);
  return parts.map((p, i) => (re.test(p) ? <b key={i} className="text-slate-900 underline">{p}</b> : <span key={i}>{p}</span>));
}

export default function ConnotationPage() {
  const { items } = useGameItems<ConnItem>("connotation");
  const [running, setRunning] = useState(false);
  const [hearts, setHearts] = useState(3);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [cur, setCur] = useState<ConnItem | null>(null);
  const [feed, setFeed] = useState("");
  const [state, setState] = useState<Record<Conn, "right" | "wrong" | null>>({ "+": null, "0": null, "-": null });
  const [timePct, setTimePct] = useState(100);
  const [over, setOver] = useState(false);

  const poolRef = useRef<ConnItem[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scoreRef = useRef(0);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  function refill() {
    const s = [...items];
    for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; }
    poolRef.current = s;
  }

  function nextRound() {
    if (poolRef.current.length === 0) refill();
    const it = poolRef.current.pop()!;
    setCur(it);
    setState({ "+": null, "0": null, "-": null });
    setFeed("");
    const span = Math.max(2200, 5000 - scoreRef.current * 120);
    setTimePct(100);
    if (timerRef.current) clearInterval(timerRef.current);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const pct = Math.max(0, 100 - ((Date.now() - start) / span) * 100);
      setTimePct(pct);
      if (pct <= 0) { clearInterval(timerRef.current!); miss(it, null); }
    }, 50);
  }

  function start() {
    setHearts(3); setScore(0); scoreRef.current = 0; setBest(0); setOver(false); setRunning(true);
    poolRef.current = []; nextRound();
  }

  function choose(c: Conn) {
    if (!running) { start(); return; }
    if (!cur) return;
    if (timerRef.current) clearInterval(timerRef.current);
    if (c === cur.payload.answer) {
      setState((s) => ({ ...s, [c]: "right" }));
      const ns = scoreRef.current + 1; scoreRef.current = ns; setScore(ns); setBest((b) => Math.max(b, ns));
      recordProgress({ gameType: "connotation", skill: "connotation", itemId: cur.id, result: "correct" });
      setFeed("");
      setTimeout(nextRound, 350);
    } else {
      miss(cur, c);
    }
  }

  function miss(it: ConnItem, c: Conn | null) {
    setState((s) => {
      const n = { ...s };
      if (c) n[c] = "wrong";
      n[it.payload.answer] = "right";
      return n;
    });
    recordProgress({ gameType: "connotation", skill: "connotation", itemId: it.id, result: "incorrect" });
    setFeed(c === null ? "太慢了！正确的是绿色。" : "这个词在这句里的色彩看错了。");
    setHearts((h) => {
      const nh = h - 1;
      if (nh <= 0) { setRunning(false); setTimeout(() => setOver(true), 600); }
      else setTimeout(nextRound, 950);
      return nh;
    });
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Connotation</h1>
      <p className="mt-1 text-sm text-slate-500">在计时条清空前，判断加粗词在这句话里的褒贬色彩。</p>

      <MethodCard {...METHODS.connotation} />

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-rose-500">{"♥".repeat(Math.max(hearts, 0))}</span>
        <span className="font-mono text-slate-500">得分 <b className="text-slate-900">{score}</b> · 最佳 <b className="text-slate-900">{best}</b></span>
      </div>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4 text-white">
        <div className="h-1.5 w-full overflow-hidden rounded bg-slate-700">
          <div className="h-full bg-emerald-400 transition-all" style={{ width: `${timePct}%` }} />
        </div>
        <p className="mt-4 min-h-[4rem] text-base leading-relaxed">
          {cur ? renderSentence(cur.payload.sentence, cur.payload.word) : "点下方任意按钮开始"}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {CHOICES.map((ch) => (
            <button key={ch.key} onClick={() => choose(ch.key)}
              className={`rounded-xl border-2 bg-white p-3 text-center font-bold transition ${
                state[ch.key] === "right" ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                : state[ch.key] === "wrong" ? "border-rose-400 bg-rose-50 text-rose-600"
                : ch.cls
              }`}>
              {ch.label}
            </button>
          ))}
        </div>
        <p className="mt-3 min-h-5 text-sm text-slate-300">{feed}</p>
      </div>

      {over && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 text-center">
          <h2 className="text-xl font-bold text-slate-900">本轮结束</h2>
          <p className="mt-1 text-slate-500">连对 {best} 个</p>
          <button onClick={start} className="mt-4 rounded-full bg-slate-900 px-6 py-2 font-semibold text-white">再来一轮</button>
        </div>
      )}
    </main>
  );
}
