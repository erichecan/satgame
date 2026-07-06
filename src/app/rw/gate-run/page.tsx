"use client";

import { useEffect, useRef, useState } from "react";

type GateItem = {
  id: string;
  payload: {
    kind: "punctuation" | "transition" | "redundancy" | "apostrophe";
    before: string;
    after: string;
    doors: [string, string];
    correctIndex: 0 | 1;
    why: string;
  };
};

export default function GateRunPage() {
  const [items, setItems] = useState<GateItem[]>([]);
  const [running, setRunning] = useState(false);
  const [hearts, setHearts] = useState(3);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [cur, setCur] = useState<GateItem | null>(null);
  const [feed, setFeed] = useState("Tap a door to start.");
  const [doorState, setDoorState] = useState<("right" | "wrong" | null)[]>([null, null]);
  const [timePct, setTimePct] = useState(100);
  const [gameOver, setGameOver] = useState(false);

  const poolRef = useRef<GateItem[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scoreRef = useRef(0);

  useEffect(() => {
    fetch("/api/game-items?gameType=gate_run&take=400")
      .then((r) => r.json())
      .then((d) => setItems(d.items));
  }, []);

  function refillPool() {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    poolRef.current = shuffled;
  }

  function nextGate() {
    if (poolRef.current.length === 0) refillPool();
    const gate = poolRef.current.pop()!;
    setCur(gate);
    setDoorState([null, null]);
    setFeed("");
    const span = Math.max(1800, 4200 - scoreRef.current * 90);
    setTimePct(100);
    if (timerRef.current) clearInterval(timerRef.current);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / span) * 100);
      setTimePct(pct);
      if (pct <= 0) {
        clearInterval(timerRef.current!);
        miss(gate, null);
      }
    }, 50);
  }

  function startGame() {
    setHearts(3);
    setScore(0);
    scoreRef.current = 0;
    setCombo(0);
    setBestCombo(0);
    setGameOver(false);
    setRunning(true);
    poolRef.current = [];
    nextGate();
  }

  function recordResult(gate: GateItem, correct: boolean) {
    fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameType: "gate_run",
        skill: "expression_conventions",
        itemId: gate.id,
        result: correct ? "correct" : "incorrect",
      }),
    });
  }

  function choose(i: 0 | 1) {
    if (!running) {
      startGame();
      return;
    }
    if (!cur) return;
    if (timerRef.current) clearInterval(timerRef.current);
    if (i === cur.payload.correctIndex) {
      setDoorState((s) => {
        const next = [...s] as ("right" | "wrong" | null)[];
        next[i] = "right";
        return next;
      });
      const nextScore = scoreRef.current + 1;
      scoreRef.current = nextScore;
      setScore(nextScore);
      setCombo((c) => {
        const nc = c + 1;
        setBestCombo((b) => Math.max(b, nc));
        return nc;
      });
      setFeed(cur.payload.why);
      recordResult(cur, true);
      setTimeout(nextGate, 500);
    } else {
      miss(cur, i);
    }
  }

  function miss(gate: GateItem, i: 0 | 1 | null) {
    setCombo(0);
    setDoorState((s) => {
      const next = [...s] as ("right" | "wrong" | null)[];
      if (i !== null) next[i] = "wrong";
      next[gate.payload.correctIndex] = "right";
      return next;
    });
    setHearts((h) => {
      const nh = h - 1;
      if (nh <= 0) {
        setRunning(false);
        setTimeout(() => setGameOver(true), 600);
      } else {
        setTimeout(nextGate, 900);
      }
      return nh;
    });
    setFeed((i === null ? "太慢了！" : "不对。") + " " + gate.payload.why);
    recordResult(gate, false);
  }

  if (items.length === 0) {
    return <main className="mx-auto max-w-lg flex-1 px-4 py-8 text-slate-500">加载中…</main>;
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Gate Run</h1>
      <p className="mt-1 text-sm text-slate-500">
        在计时条清空前选对门。标点和过渡词的速度练习，三次失误出局。
      </p>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-rose-500">{"♥".repeat(Math.max(hearts, 0))}</span>
        <span className="font-mono text-slate-500">
          得分 <b className="text-slate-900">{score}</b> · 最佳连击 <b className="text-slate-900">{bestCombo}</b>
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4 text-white">
        <div className="h-1.5 w-full overflow-hidden rounded bg-slate-700">
          <div className="h-full bg-emerald-400 transition-all" style={{ width: `${timePct}%` }} />
        </div>
        <div className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-400">
          {cur ? ({ punctuation: "标点", transition: "过渡词", redundancy: "冗余", apostrophe: "所有格" }[cur.payload.kind]) : "准备"}
        </div>
        <p className="mt-2 min-h-[3.5rem] text-lg">
          {cur ? (
            <>
              {cur.payload.before} <span className="mx-1 inline-block min-w-[2.5rem] border-b-2 border-emerald-400" />{" "}
              {cur.payload.after}
            </>
          ) : (
            "点击门开始"
          )}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <button
              key={i}
              onClick={() => choose(i as 0 | 1)}
              className={`rounded-xl border p-5 text-center text-lg font-bold transition ${
                doorState[i] === "right"
                  ? "border-emerald-400 bg-emerald-950 text-emerald-300"
                  : doorState[i] === "wrong"
                  ? "border-rose-400 bg-rose-950 text-rose-300"
                  : "border-slate-700 bg-slate-800 hover:border-emerald-400"
              }`}
            >
              {cur ? cur.payload.doors[i] : i === 0 ? "点击" : "开始"}
            </button>
          ))}
        </div>
        <p className="mt-3 min-h-5 text-sm text-slate-300">{feed}</p>
      </div>

      {gameOver && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 text-center">
          <h2 className="text-xl font-bold text-slate-900">本轮结束</h2>
          <p className="mt-1 text-slate-500">通过 {score} 关 · 最佳连击 {bestCombo}</p>
          <button
            onClick={startGame}
            className="mt-4 rounded-full bg-slate-900 px-6 py-2 font-semibold text-white"
          >
            再来一轮
          </button>
        </div>
      )}
    </main>
  );
}
