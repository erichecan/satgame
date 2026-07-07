"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ClickablePassage } from "@/components/learning/clickable-passage";
import { WordChip } from "@/components/learning/word-chip";

type WordData = {
  id: string;
  word: string;
  partOfSpeech: string | null;
  definitionEn: string;
  definitionCn: string | null;
  exampleEn: string | null;
  synonymGroup: string | null;
};

export default function StudyPage() {
  const [words, setWords] = useState<WordData[]>([]);
  const [viewed, setViewed] = useState<string[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/daily")
      .then((r) => r.json())
      .then((d) => {
        setWords(d.words);
        setViewed(d.assignment.wordsViewed);
        setLoading(false);
      });
  }, []);

  const remaining = useMemo(() => words.filter((w) => !viewed.includes(w.id)), [words, viewed]);
  const current = remaining[0];

  const discriminationWords = useMemo(() => {
    if (!current?.synonymGroup) return [];
    return words.filter((w) => w.synonymGroup === current.synonymGroup && w.id !== current.id);
  }, [current, words]);

  async function respond(unknown: boolean) {
    if (!current) return;
    await fetch("/api/daily/word-viewed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId: current.id, unknown }),
    });
    setViewed((v) => [...v, current.id]);
    setFlipped(false);
  }

  if (loading) {
    return <main className="mx-auto max-w-lg flex-1 px-4 py-8 text-slate-500">Loading…</main>;
  }

  if (!current) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 text-center lg:max-w-3xl">
        <h1 className="text-2xl font-bold text-slate-900">All of today's words are done</h1>
        <p className="mt-2 text-slate-500">
          {viewed.length} / {words.length} words done
        </p>
        <Link
          href="/daily-quiz"
          className="mt-6 inline-block rounded-full bg-slate-900 px-6 py-2 font-semibold text-white"
        >
          Go practice →
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 lg:max-w-4xl">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
        <span>Vocab</span>
        <span>
          {viewed.length} / {words.length}
        </span>
      </div>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Study</h1>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900">{current.word}</span>
            {current.partOfSpeech && (
              <span className="text-sm italic text-slate-400">{current.partOfSpeech}</span>
            )}
          </div>

          {!flipped ? (
            <button
              onClick={() => setFlipped(true)}
              className="mt-6 w-full rounded-lg bg-slate-100 py-3 font-semibold text-slate-700"
            >
              Flip for the meaning
            </button>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-slate-700">{current.definitionEn}</p>
              {current.exampleEn && (
                <p className="rounded-lg bg-slate-50 p-3 text-sm italic text-slate-500">
                  <ClickablePassage text={current.exampleEn} sourceGame="study" />
                </p>
              )}
              {discriminationWords.length > 0 && (
                <div className="rounded-lg bg-amber-50 p-3 text-sm text-slate-600">
                  <div className="mb-1 font-semibold text-amber-700">Nuance</div>
                  {discriminationWords.map((w) => (
                    <p key={w.id}>
                      <b>
                        <WordChip word={w.word} sourceGame="study" />
                      </b>{" "}
                      — {w.definitionEn}
                    </p>
                  ))}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => respond(false)}
                  className="flex-1 rounded-lg bg-emerald-600 py-3 font-semibold text-white"
                >
                  Know it
                </button>
                <button
                  onClick={() => respond(true)}
                  className="flex-1 rounded-lg bg-rose-500 py-3 font-semibold text-white"
                >
                  Don't know
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="hidden rounded-xl border border-slate-200 bg-white p-4 lg:block">
          <div className="text-sm font-semibold text-slate-900">Today's progress</div>
          <ul className="mt-2 space-y-1 text-sm text-slate-500">
            {words.map((w) => (
              <li key={w.id} className={viewed.includes(w.id) ? "text-slate-300 line-through" : ""}>
                {w.word}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
