"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type QuizOption = { t: string; correct?: boolean };
type QuizData = {
  id: string;
  passage: string;
  question: string;
  options: QuizOption[];
  explanation: string | null;
};

export default function DailyQuizPage() {
  const [quizItems, setQuizItems] = useState<QuizData[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [dailyComplete, setDailyComplete] = useState(false);

  useEffect(() => {
    fetch("/api/daily")
      .then((r) => r.json())
      .then((d) => {
        setQuizItems(d.quizItems);
        setAnswers(d.assignment.quizAnswers ?? {});
        setDailyComplete(!!d.assignment.completedAt);
        setLoading(false);
      });
  }, []);

  const remaining = quizItems.filter((q) => !(q.id in answers));
  const current = remaining[0];

  async function pick(index: number) {
    if (!current || picked !== null) return;
    setPicked(index);
    const correct = !!current.options[index].correct;
    const res = await fetch("/api/daily/quiz-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizItemId: current.id, result: correct ? "correct" : "incorrect" }),
    });
    const data = await res.json();
    setDailyComplete(!!data.assignment?.completedAt);
  }

  function next() {
    if (!current) return;
    const correct = current.options[picked!].correct ? "correct" : "incorrect";
    setAnswers((a) => ({ ...a, [current.id]: correct }));
    setPicked(null);
  }

  if (loading) {
    return <main className="mx-auto max-w-lg flex-1 px-4 py-8 text-slate-500">加载中…</main>;
  }

  if (!current) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 text-center lg:max-w-3xl">
        <h1 className="text-2xl font-bold text-slate-900">今天的测验做完了</h1>
        <p className="mt-2 text-slate-500">
          {Object.keys(answers).length} / {quizItems.length} 题完成
        </p>
        {dailyComplete ? (
          <p className="mt-4 rounded-lg bg-emerald-50 p-3 font-semibold text-emerald-700">
            今日打卡成功 ✦
          </p>
        ) : (
          <p className="mt-4 text-sm text-slate-500">还差游戏没玩完，去首页看看今日任务吧。</p>
        )}
        <Link href="/" className="mt-6 inline-block rounded-full bg-slate-900 px-6 py-2 font-semibold text-white">
          回首页
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 lg:max-w-3xl">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
        <span>每日测验</span>
        <span>
          {Object.keys(answers).length} / {quizItems.length}
        </span>
      </div>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Daily Quiz</h1>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 leading-relaxed">
        {current.passage}
      </div>

      <p className="mt-4 font-semibold text-slate-900">{current.question}</p>
      <div className="mt-2 space-y-2">
        {current.options.map((o, i) => (
          <button
            key={i}
            onClick={() => pick(i)}
            disabled={picked !== null}
            className={`w-full rounded-lg border p-3 text-left text-sm transition ${
              picked === i
                ? o.correct
                  ? "border-emerald-400 bg-emerald-50 font-semibold text-emerald-700"
                  : "border-rose-300 bg-rose-50"
                : picked !== null
                ? "opacity-40"
                : "border-slate-200 bg-slate-50 hover:border-slate-400"
            }`}
          >
            {o.t}
          </button>
        ))}
      </div>

      {picked !== null && (
        <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          {current.explanation}
        </div>
      )}

      {picked !== null && (
        <button onClick={next} className="mt-4 w-full rounded-lg bg-slate-900 py-2 font-semibold text-white">
          下一题
        </button>
      )}
    </main>
  );
}
