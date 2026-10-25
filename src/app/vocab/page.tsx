"use client";

import { useEffect, useMemo, useState } from "react";

type Skill = "recognition" | "definition_recall" | "context_choice";
type Progress = {
  skill: Skill;
  masteryLevel: number;
  consecutiveCorrect: number;
  reviewCount: number;
  correctCount: number;
  nextReview: string | null;
};
type Word = {
  id: string;
  word: string;
  partOfSpeech: string | null;
  definitionEn: string;
  exampleEn: string | null;
  synonyms: string[];
  rank: number;
  qbankQuestionCount: number;
  qbankMentionCount: number;
  qbankWicAnswerCount: number;
  skillProgress: Progress[];
};
type Choice = { value: string; label: string };
type Snapshot = { questionCount: number; asOf: string; itemDateRangeUtc: number[] };

const SKILLS: { id: Skill; title: string; subtitle: string }[] = [
  { id: "recognition", title: "能认出", subtitle: "看到单词，识别它的英英释义" },
  { id: "definition_recall", title: "能从释义想起", subtitle: "从简单英文解释中主动回忆单词" },
  { id: "context_choice", title: "能在语境中选准", subtitle: "根据句意线索选择最准确的词" },
];
const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function maskHeadword(example: string, word: string) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`\\b${escaped}(?:s|es|ed|d|ing)?\\b`, "i");
  return example.replace(pattern, "________");
}

export default function VocabPage() {
  const [source, setSource] = useState("sat_262");
  const [words, setWords] = useState<Word[]>([]);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [skill, setSkill] = useState<Skill>("recognition");
  const [queue, setQueue] = useState<Word[]>([]);
  const [position, setPosition] = useState(0);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [answer, setAnswer] = useState("");
  const [typed, setTyped] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadWords(nextSource = source, showLoading = true) {
    if (showLoading) setLoading(true);
    const res = await fetch(`/api/vocab?source=${nextSource}`);
    const data = await res.json();
    setWords(data.words ?? []);
    setSnapshot(data.questionBankSnapshot ?? null);
    setLoading(false);
  }

  useEffect(() => {
    void loadWords(source);
    // Source changes are handled by this effect; the function itself is stable for this request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  const current = queue[position];
  const completed = useMemo(() => {
    const now = Date.now();
    const bySkill = new Map(words.map((w) => [w.id, w.skillProgress.find((p) => p.skill === skill)]));
    const eligible = skill === "context_choice" ? words.filter((w) => w.exampleEn) : words;
    return eligible.reduce(
      (counts, word) => {
        const p = bySkill.get(word.id);
        if (p?.masteryLevel && p.masteryLevel >= 5) counts.mastered++;
        if (!p || !p.nextReview || new Date(p.nextReview).getTime() <= now) counts.due++;
        return counts;
      },
      { mastered: 0, due: 0 }
    );
  }, [words, skill]);

  function choicesFor(word: Word, skillId: Skill, deck: Word[]): Choice[] {
    if (skillId === "recognition") {
      const others = shuffle(deck.filter((w) => w.id !== word.id && w.definitionEn !== word.definitionEn)).slice(0, 3);
      return shuffle([{ value: word.id, label: word.definitionEn }, ...others.map((w) => ({ value: w.id, label: w.definitionEn }))]);
    }
    const posWords = deck.filter((w) => w.id !== word.id && w.partOfSpeech === word.partOfSpeech);
    const fallback = deck.filter((w) => w.id !== word.id);
    const others = shuffle(posWords.length >= 3 ? posWords : fallback).slice(0, 3);
    return shuffle([{ value: word.id, label: word.word }, ...others.map((w) => ({ value: w.id, label: w.word }))]);
  }

  function setQuestion(nextWord: Word, nextSkill = skill, deck = words) {
    setAnswer("");
    setTyped("");
    setFeedback(null);
    setChoices(choicesFor(nextWord, nextSkill, deck));
  }

  function start(nextSkill = skill) {
    const now = Date.now();
    const forSkill = (word: Word) => word.skillProgress.find((p) => p.skill === nextSkill);
    const eligible = nextSkill === "context_choice" ? words.filter((w) => w.exampleEn) : words;
    const due = eligible.filter((w) => {
      const progress = forSkill(w);
      return !progress?.nextReview || new Date(progress.nextReview).getTime() <= now;
    });
    const ordered = source === "sat_262" ? due.sort((a, b) => a.rank - b.rank) : due;
    const selected = ordered.slice(0, 10);
    setSkill(nextSkill);
    setQueue(selected);
    setPosition(0);
    if (selected[0]) setQuestion(selected[0], nextSkill);
  }

  async function submit(choice: string) {
    if (!current || feedback || saving) return;
    const correct = skill === "definition_recall"
      ? normalize(choice) === normalize(current.word)
      : choice === current.id;
    setAnswer(choice);
    setFeedback(correct ? "correct" : "incorrect");
    setSaving(true);
    await fetch("/api/vocab/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId: current.id, skill, correct }),
    });
    await loadWords(source, false);
    setSaving(false);
  }

  function next() {
    if (position + 1 >= queue.length) {
      setQueue([]);
      setPosition(0);
      return;
    }
    const nextPosition = position + 1;
    setPosition(nextPosition);
    setQuestion(queue[nextPosition]);
  }

  if (loading) return <main className="mx-auto max-w-4xl flex-1 px-4 py-8 text-slate-500">Loading vocabulary…</main>;

  const sourceTitle = source === "sat_262" ? "262 SAT 词表" : "SAT Question Bank 词汇";
  const mastery = (word: Word, skillId: Skill) => word.skillProgress.find((p) => p.skill === skillId);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-indigo-600">SAT Vocabulary</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">单词记忆</h1>
          <p className="mt-1 text-sm text-slate-500">每个词分别练识别、主动回忆和语境选词。</p>
        </div>
        <select
          value={source}
          onChange={(e) => { setQueue([]); setSource(e.target.value); }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="sat_262">附件：262 SAT 词表</option>
          <option value="qbank_wic">Question Bank：Words in Context</option>
        </select>
      </div>

      {queue.length > 0 && current ? (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>{SKILLS.find((s) => s.id === skill)?.title}</span>
            <span>{position + 1} / {queue.length}</span>
          </div>
          <div className="mt-5 min-h-40">
            {skill === "recognition" && <>
              <h2 className="text-3xl font-bold text-slate-900">{current.word}</h2>
              {current.partOfSpeech && <p className="mt-1 text-sm italic text-slate-400">{current.partOfSpeech}</p>}
              <p className="mt-5 font-medium text-slate-700">Choose the closest English explanation.</p>
            </>}
            {skill === "definition_recall" && <>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Definition</p>
              <h2 className="mt-2 text-xl font-medium leading-relaxed text-slate-900">{current.definitionEn}</h2>
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && typed.trim()) void submit(typed); }}
                disabled={!!feedback}
                placeholder="Type the word you remember"
                className="mt-5 w-full rounded-lg border border-slate-300 px-4 py-3 text-lg outline-none focus:border-indigo-500"
              />
              {!feedback && <button onClick={() => typed.trim() && void submit(typed)} className="mt-3 rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white disabled:opacity-40" disabled={!typed.trim()}>Check</button>}
            </>}
            {skill === "context_choice" && <>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Choose the precise word</p>
              <h2 className="mt-2 text-xl leading-relaxed text-slate-900">{current.exampleEn ? maskHeadword(current.exampleEn, current.word) : current.definitionEn}</h2>
              {current.partOfSpeech && <p className="mt-2 text-sm text-slate-500">Part of speech: {current.partOfSpeech}</p>}
            </>}
          </div>

          {(skill !== "definition_recall" || feedback) && (
            <div className="mt-5 grid gap-2">
              {choices.map((choice) => {
                const chosen = answer === choice.value;
                const isCorrect = choice.value === current.id;
                const style = feedback && isCorrect
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                  : feedback && chosen
                    ? "border-rose-400 bg-rose-50 text-rose-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50";
                return (
                  <button key={choice.value} onClick={() => void submit(choice.value)} disabled={!!feedback || saving} className={`rounded-lg border px-4 py-3 text-left ${style}`}>
                    {choice.label}
                  </button>
                );
              })}
            </div>
          )}

          {feedback && <div className={`mt-4 rounded-lg p-4 ${feedback === "correct" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
            <p className="font-semibold">{feedback === "correct" ? "Correct" : `Answer: ${current.word}`}</p>
            <p className="mt-1 text-sm">{current.definitionEn}</p>
            {current.synonyms.length > 0 && <p className="mt-2 text-sm"><b>Related:</b> {current.synonyms.join(" · ")}</p>}
            {current.qbankQuestionCount > 0 && <p className="mt-2 text-xs opacity-75">Appears in {current.qbankQuestionCount} Question Bank questions.</p>}
            <button onClick={next} className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">{position + 1 === queue.length ? "Finish session" : "Next word →"}</button>
          </div>}
        </section>
      ) : (
        <>
          <section className="mt-6 grid gap-3 sm:grid-cols-3">
            {SKILLS.map((item) => {
              const mastered = words.filter((w) => (mastery(w, item.id)?.masteryLevel ?? 0) >= 5).length;
              const started = words.filter((w) => (mastery(w, item.id)?.reviewCount ?? 0) > 0).length;
              return <button key={item.id} onClick={() => setSkill(item.id)} className={`rounded-xl border p-4 text-left ${skill === item.id ? "border-indigo-400 bg-indigo-50" : "border-slate-200 bg-white"}`}>
                <h2 className="font-semibold text-slate-900">{item.title}</h2>
                <p className="mt-1 min-h-10 text-sm text-slate-500">{item.subtitle}</p>
                <p className="mt-3 text-sm text-slate-700">已开始 {started}/{words.length} · 稳定掌握 {mastered}</p>
              </button>;
            })}
          </section>

          <section className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-900 p-5 text-white">
            <div>
              <p className="font-semibold">{sourceTitle}</p>
              <p className="mt-1 text-sm text-slate-300">{words.length} 个词 · 当前模式待复习/待学习 {completed.due} 个</p>
            </div>
            <button onClick={() => start(skill)} disabled={words.length === 0} className="rounded-lg bg-white px-5 py-2.5 font-semibold text-slate-900 disabled:opacity-40">开始 10 词练习</button>
          </section>

          {source === "qbank_wic" && <p className="mt-3 text-xs leading-relaxed text-slate-400">题库快照：截至 {snapshot?.asOf ?? "—"}，{snapshot?.questionCount ?? 0} 道 SAT Reading and Writing 题目；条目创建日期约为 2023–2026。频次表示该词出现在多少道当前公开题目中，不是十年正式考试场次。题干、文章和选项未存入系统。</p>}

          <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <span>{sourceTitle}</span><span>Question Bank</span>
            </div>
            {words.slice(0, 40).map((word) => <div key={word.id} className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0">
              <div><span className="font-semibold text-slate-800">{word.word}</span><span className="ml-2 text-sm text-slate-500">{word.definitionEn}</span></div>
              <span className="text-sm tabular-nums text-slate-500">{word.qbankQuestionCount}</span>
            </div>)}
            {words.length === 0 && <p className="p-5 text-sm text-slate-500">This set is being prepared.</p>}
          </section>
        </>
      )}
    </main>
  );
}
