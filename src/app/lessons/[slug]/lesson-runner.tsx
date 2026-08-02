"use client";

import { useEffect, useState } from "react";
import { BarChart } from "@/components/rw/bar-chart";
import { ClickablePassage } from "@/components/learning/clickable-passage";
import { recordProgress } from "@/lib/record-progress";
import { TRAP_LABEL, type TrapType } from "@/lib/trap-types";
import type { LessonStep, PracticeItem, PracticeOption, WorkedExample } from "@/lib/lesson-types";

const LETTER = ["A", "B", "C", "D", "E", "F", "G", "H"];

function optionClass(revealed: boolean, o: PracticeOption, picked: boolean) {
  if (!revealed)
    return picked
      ? "border-slate-900 bg-slate-50"
      : "border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50";
  if (o.correct) return "border-emerald-500 bg-emerald-50";
  if (picked) return "border-rose-400 bg-rose-50";
  return "border-slate-200 bg-white opacity-60";
}

function Options({
  options,
  picked,
  revealed,
  onPick,
}: {
  options: PracticeOption[];
  picked: number | null;
  revealed: boolean;
  onPick: (i: number) => void;
}) {
  return (
    <div className="mt-3 space-y-2">
      {options.map((o, i) => (
        <button
          key={i}
          onClick={() => onPick(i)}
          disabled={revealed}
          className={`flex w-full gap-2.5 rounded-lg border p-3 text-left text-sm transition ${optionClass(
            revealed,
            o,
            picked === i
          )}`}
        >
          <span className="font-mono text-xs text-slate-400">{LETTER[i]}</span>
          <span className="flex-1 text-slate-800">{o.t}</span>
          {revealed && o.correct && <span className="text-xs font-semibold text-emerald-600">Correct</span>}
          {revealed && !o.correct && picked === i && o.trapType && (
            <span className="shrink-0 text-xs font-semibold text-rose-500">{TRAP_LABEL[o.trapType]}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ---------- Worked example: pick first, then reveal the strategy step by step ---------- */

function WorkedExampleBlock({ example, steps }: { example: WorkedExample; steps: LessonStep[] }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [shown, setShown] = useState(0);

  const revealed = picked !== null;
  const wasRight = revealed && example.options[picked]?.correct === true;

  return (
    <section className="mt-6">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Worked example</h2>
      <p className="mt-1 text-sm text-slate-500">
        Try it yourself first. Then walk through how the strategy gets you there.
      </p>

      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
        {example.chart && (
          <div className="mb-3">
            <BarChart {...example.chart} />
          </div>
        )}
        {example.passage && (
          <p className="rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
            <ClickablePassage text={example.passage} sourceGame="lesson" />
          </p>
        )}
        <p className="mt-3 font-semibold text-slate-900">{example.question}</p>

        <Options options={example.options} picked={picked} revealed={revealed} onPick={setPicked} />

        {revealed && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className={`text-sm font-semibold ${wasRight ? "text-emerald-600" : "text-rose-500"}`}>
              {wasRight ? "That's it. Here's why it works." : "Not quite — here's how the strategy gets there."}
            </p>
            <ol className="mt-2 space-y-2">
              {example.walkthrough.slice(0, shown + 1).map((w, i) => {
                const strategy = steps[w.step ?? i];
                return (
                  <li key={i} className="rounded-lg bg-slate-50 p-3 text-sm">
                    <span className="font-semibold text-slate-900">
                      Step {i + 1} · {w.label}
                    </span>
                    <p className="mt-0.5 text-slate-600">{w.text}</p>
                    {strategy && <p className="mt-1 text-xs text-slate-400">Strategy: {strategy.title}</p>}
                  </li>
                );
              })}
            </ol>
            {shown < example.walkthrough.length - 1 && (
              <button
                onClick={() => setShown((s) => s + 1)}
                className="mt-3 rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white"
              >
                Next step →
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- Practice: 8 questions, immediate feedback, progress recorded ---------- */

function PracticeBlock({ slug }: { slug: string }) {
  const [round, setRound] = useState(0);
  const [items, setItems] = useState<PracticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    let active = true;
    fetch(`/api/lessons/${slug}/items?take=8&round=${round}`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        setItems((d.items ?? []) as PracticeItem[]);
        setIdx(0);
        setPicked(null);
        setScore(0);
      })
      .catch(() => active && setItems([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [slug, round]);

  const item = items[idx];
  const revealed = picked !== null;

  function pick(i: number) {
    if (!item || revealed) return;
    setPicked(i);
    const opt = item.options[i];
    const right = opt.correct === true;
    if (right) setScore((s) => s + 1);
    recordProgress({
      gameType: "lesson",
      skill: slug,
      itemId: item.id,
      result: right ? "correct" : "incorrect",
      errorTag: right ? undefined : opt.trapType,
    });
  }

  if (loading) {
    return (
      <section className="mt-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Practice</h2>
        <p className="mt-2 text-sm text-slate-400">Loading questions…</p>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className="mt-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Practice</h2>
        <p className="mt-2 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
          No practice questions for this lesson yet. Work through the example above, then train the same move in
          the games linked below.
        </p>
      </section>
    );
  }

  // 一组做完：结算
  if (idx >= items.length) {
    const pct = Math.round((score / items.length) * 100);
    return (
      <section className="mt-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Practice</h2>
        <div className="mt-2 rounded-xl border border-slate-200 bg-white p-6 text-center">
          <div className="text-3xl font-bold text-slate-900">
            {score} / {items.length}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {pct >= 85
              ? "Mastered this set. Try a harder round or move on."
              : pct >= 50
                ? "Getting there. Run another set to lock it in."
                : "Re-read the strategy above, then run another set."}
          </p>
          <button
            onClick={() => {
              setLoading(true);
              setRound((r) => r + 1);
            }}
            className="mt-4 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white"
          >
            Practice another set →
          </button>
        </div>
      </section>
    );
  }

  const trap = revealed && !item.options[picked!].correct ? item.options[picked!].trapType : undefined;

  return (
    <section className="mt-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Practice</h2>
        <span className="text-xs text-slate-400">
          {idx + 1} / {items.length} · {score} correct
        </span>
      </div>
      <div className="mt-1 h-1 w-full overflow-hidden rounded bg-slate-200">
        <div
          className="h-full bg-slate-900 transition-all"
          style={{ width: `${(idx / items.length) * 100}%` }}
        />
      </div>

      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Difficulty {item.difficulty}</span>
        </div>
        {item.chart && (
          <div className="mt-2">
            <BarChart {...item.chart} />
          </div>
        )}
        {item.passage && (
          <p className="mt-2 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
            <ClickablePassage text={item.passage} sourceGame="lesson" />
          </p>
        )}
        <p className="mt-3 font-semibold text-slate-900">{item.question}</p>

        <Options options={item.options} picked={picked} revealed={revealed} onPick={pick} />

        {revealed && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            {trap && (
              <p className="text-sm font-semibold text-rose-500">
                You fell into: {TRAP_LABEL[trap as TrapType]}
              </p>
            )}
            {item.options[picked!].trap && (
              <p className="mt-1 text-sm text-slate-600">{item.options[picked!].trap}</p>
            )}
            {item.why && <p className="mt-1 text-sm text-slate-600">{item.why}</p>}
            <button
              onClick={() => {
                setIdx((i) => i + 1);
                setPicked(null);
              }}
              className="mt-3 rounded-full bg-slate-900 px-5 py-1.5 text-sm font-semibold text-white"
            >
              {idx + 1 === items.length ? "See results →" : "Next question →"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export function LessonRunner({
  slug,
  example,
  steps,
}: {
  slug: string;
  example: WorkedExample;
  steps: LessonStep[];
}) {
  return (
    <>
      <WorkedExampleBlock example={example} steps={steps} />
      <PracticeBlock slug={slug} />
    </>
  );
}
