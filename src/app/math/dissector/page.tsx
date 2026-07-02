"use client";

import { useEffect, useMemo, useState } from "react";

type Choice = { en: string; zh: string; correct?: boolean };
type DissectorItem = {
  id: string;
  payload: {
    textEn: string;
    textZh: string;
    ask: Choice[];
    tool: Choice[];
    cueEn: string;
    cueZh: string;
    turns: number;
    steps: { en: string; zh: string }[];
    workEn: string;
    workZh: string;
    answerEn: string;
    answerZh: string;
  };
};

type Phase = "ask" | "tool" | "turns" | "order" | "reveal";

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function DissectorPage() {
  const [items, setItems] = useState<DissectorItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [lang, setLang] = useState<"en" | "zh">("en");
  const [phase, setPhase] = useState<Phase>("ask");
  const [firstTry, setFirstTry] = useState(true);
  const [clean, setClean] = useState(0);
  const [feed, setFeed] = useState("");
  const [askPicked, setAskPicked] = useState<number | null>(null);
  const [toolPicked, setToolPicked] = useState<number | null>(null);
  const [turnsPicked, setTurnsPicked] = useState<number | null>(null);
  const [orderNext, setOrderNext] = useState(0);
  const [orderLocked, setOrderLocked] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    fetch("/api/game-items?gameType=dissector")
      .then((r) => r.json())
      .then((d) => setItems(d.items));
  }, []);

  const item = items[idx];
  const shuffledAsk = useMemo(() => (item ? shuffled(item.payload.ask) : []), [item]);
  const shuffledTool = useMemo(() => (item ? shuffled(item.payload.tool) : []), [item]);
  const shuffledSteps = useMemo(
    () => (item ? shuffled(item.payload.steps.map((s, i) => ({ ...s, i }))) : []),
    [item]
  );

  function resetRound() {
    setPhase("ask");
    setFirstTry(true);
    setFeed("");
    setAskPicked(null);
    setToolPicked(null);
    setTurnsPicked(null);
    setOrderNext(0);
    setOrderLocked([]);
  }

  function recordResult(itemId: string, correct: boolean) {
    fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameType: "dissector", skill: "math", itemId, result: correct ? "correct" : "incorrect" }),
    });
  }

  function pickAsk(c: Choice, i: number) {
    if (phase !== "ask") return;
    if (c.correct) {
      setAskPicked(i);
      setTimeout(() => {
        setPhase("tool");
        setFeed("");
      }, 400);
    } else {
      setFirstTry(false);
      setFeed(lang === "en" ? "Look again at the last sentence of the problem." : "再看一眼题目最后一句。");
    }
  }

  function pickTool(c: Choice, i: number) {
    if (phase !== "tool" || !item) return;
    if (c.correct) {
      setToolPicked(i);
      setFeed((lang === "en" ? "Cue: " : "识别线索：") + (lang === "en" ? item.payload.cueEn : item.payload.cueZh));
      setTimeout(() => {
        setPhase("turns");
        setFeed("");
      }, 1400);
    } else {
      setFirstTry(false);
      setFeed(lang === "en" ? "Think about the cue — what kind of change is described?" : "想想识别线索：关键词是什么类型的变化？");
    }
  }

  function pickTurns(n: number) {
    if (phase !== "turns" || !item) return;
    setTurnsPicked(n);
    if (n === item.payload.turns) {
      setFeed(lang === "en" ? `Right — ${n} turns. Now lay them out.` : `对，${n} 个弯。下面把这几步排出来。`);
    } else {
      setFirstTry(false);
      setFeed(
        lang === "en"
          ? `It's actually ${item.payload.turns} turns — laying out the steps makes it clear.`
          : `其实是 ${item.payload.turns} 个弯 —— 排一下步骤就看清楚了。`
      );
    }
    setTimeout(() => {
      setPhase("order");
      setFeed("");
    }, 1000);
  }

  function pickStep(originalIndex: number) {
    if (phase !== "order" || !item) return;
    if (orderLocked.includes(originalIndex)) return;
    if (originalIndex === orderNext) {
      const nextOrder = orderNext + 1;
      setOrderNext(nextOrder);
      setOrderLocked((l) => [...l, originalIndex]);
      if (nextOrder === item.payload.steps.length) {
        if (firstTry) setClean((c) => c + 1);
        recordResult(item.id, firstTry);
        setTimeout(() => setPhase("reveal"), 400);
      }
    } else {
      setFirstTry(false);
      setFeed(lang === "en" ? "That step can't go yet — what intermediate value must you find first?" : "这一步还排不上 —— 想想要先求出哪个中间量。");
    }
  }

  function next() {
    if (idx === items.length - 1) {
      setFinished(true);
      return;
    }
    setIdx((i) => i + 1);
    resetRound();
  }

  if (items.length === 0) {
    return <main className="mx-auto max-w-lg flex-1 px-4 py-8 text-slate-500">加载中…</main>;
  }

  if (finished) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          {lang === "en" ? `${items.length} problems dissected` : `拆完 ${items.length} 道题`}
        </h1>
        <p className="mt-2 text-slate-500">
          {lang === "en"
            ? `You dissected ${clean} of them cleanly (no missteps).`
            : `其中 ${clean} 道一路利落拆完（没走错）。`}
        </p>
        <button
          className="mt-6 rounded-full bg-slate-900 px-6 py-2 font-semibold text-white"
          onClick={() => {
            setIdx(0);
            setClean(0);
            setFinished(false);
            resetRound();
          }}
        >
          {lang === "en" ? "Again" : "再来一轮"}
        </button>
      </main>
    );
  }

  const stepLabels = {
    ask: lang === "en" ? "What is the problem actually asking for?" : "这道题到底在求什么？",
    tool: lang === "en" ? "Which method / concept does this need?" : "这题该用哪个方法/考点？",
    turns: lang === "en" ? "Guess first: how many turns (steps) does this take?" : "先猜：这题要转几个弯（分几步）？",
    order: lang === "en" ? "Tap the solution steps in order:" : "按顺序点出解题步骤：",
  };

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{lang === "en" ? "Dissect" : "拆题"}</h1>
        <button
          onClick={() => setLang((l) => (l === "en" ? "zh" : "en"))}
          className="rounded-full border border-slate-300 px-3 py-1 text-sm font-semibold"
        >
          {lang === "en" ? "中文" : "EN"}
        </button>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        {lang === "en"
          ? "Don't compute — just read: what's it asking → which method → how many turns."
          : "不用算，只练读题：在问什么 → 用什么方法 → 转几个弯。"}
      </p>

      <div className="mt-4 flex justify-between text-xs font-semibold text-slate-400">
        <span>
          {idx + 1} / {items.length}
        </span>
        <span>{lang === "en" ? "Clean" : "利落"} {clean}</span>
      </div>

      <div className="mt-3 rounded-xl bg-slate-900 p-4 text-white">
        <div className="text-xs font-bold uppercase text-slate-400">{lang === "en" ? "Problem" : "题目"}</div>
        <p className="mt-1 leading-relaxed">{lang === "en" ? item.payload.textEn : item.payload.textZh}</p>
      </div>

      {phase !== "reveal" && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <p className="font-semibold text-slate-900">{stepLabels[phase]}</p>

          {(phase === "ask" || phase === "tool") && (
            <div className="mt-3 space-y-2">
              {(phase === "ask" ? shuffledAsk : shuffledTool).map((c, i) => {
                const picked = phase === "ask" ? askPicked : toolPicked;
                return (
                  <button
                    key={i}
                    onClick={() => (phase === "ask" ? pickAsk(c, i) : pickTool(c, i))}
                    disabled={picked !== null}
                    className={`w-full rounded-lg border p-3 text-left text-sm transition ${
                      picked === i
                        ? c.correct
                          ? "border-emerald-400 bg-emerald-50 font-semibold text-emerald-700"
                          : "border-rose-300 bg-rose-50"
                        : picked !== null
                        ? "opacity-40"
                        : "border-slate-200 bg-slate-50 hover:border-slate-400"
                    }`}
                  >
                    {lang === "en" ? c.en : c.zh}
                  </button>
                );
              })}
            </div>
          )}

          {phase === "turns" && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => pickTurns(n)}
                  disabled={turnsPicked !== null}
                  className={`rounded-lg border p-4 text-center text-xl font-bold ${
                    turnsPicked === n
                      ? n === item.payload.turns
                        ? "border-emerald-400 text-emerald-600"
                        : "border-rose-400 text-rose-500"
                      : "border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          )}

          {phase === "order" && (
            <div className="mt-3 space-y-2">
              {shuffledSteps.map((s) => (
                <button
                  key={s.i}
                  onClick={() => pickStep(s.i)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm ${
                    orderLocked.includes(s.i)
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-slate-200 bg-slate-50 hover:border-slate-400"
                  }`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold">
                    {orderLocked.includes(s.i) ? orderLocked.indexOf(s.i) + 1 : "·"}
                  </span>
                  {lang === "en" ? s.en : s.zh}
                </button>
              ))}
            </div>
          )}

          {feed && <p className="mt-3 text-sm text-slate-500">{feed}</p>}
        </div>
      )}

      {phase === "reveal" && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">{lang === "en" ? "It works out to ——" : "解出来是 ——"}</p>
          <div className="mt-1 text-2xl font-bold text-blue-600">
            {lang === "en" ? item.payload.answerEn : item.payload.answerZh}
          </div>
          <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-100 p-3 font-mono text-sm text-slate-700">
            {lang === "en" ? item.payload.workEn : item.payload.workZh}
          </pre>
          <p className="mt-2 text-sm text-slate-500">
            {lang === "en"
              ? `This was a ${item.payload.turns}-turn problem. You ${
                  firstTry ? "dissected it cleanly ✦" : "stumbled a bit — a few more and it clicks"
                }.`
              : `这是一道 ${item.payload.turns} 个弯的题。你这一题${firstTry ? "一路利落拆完 ✦" : "拆得有点磕绊，多练几道就顺了"}。`}
          </p>
          <button onClick={next} className="mt-4 w-full rounded-lg bg-slate-900 py-2 font-semibold text-white">
            {idx === items.length - 1 ? (lang === "en" ? "See summary" : "看总结") : lang === "en" ? "Next" : "下一题"}
          </button>
        </div>
      )}
    </main>
  );
}
