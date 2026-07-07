"use client";

import { useEffect, useRef, useState } from "react";
import { useGameItems } from "@/lib/use-game-items";
import { recordProgress } from "@/lib/record-progress";
import { MethodCard } from "@/components/rw/method-card";
import { METHODS } from "@/lib/rw-methods";

type WordItem = {
  id: string;
  payload: { word: string; pos: string; def: string; ex: string; contextClues?: string[] };
};

type Guess = { word: string; score: number; nudge: string; latest?: boolean };

function tierOf(score: number) {
  if (score >= 85) return { name: "Very close", color: "bg-rose-400" };
  if (score >= 65) return { name: "Getting close", color: "bg-emerald-400" };
  if (score >= 45) return { name: "Right direction", color: "bg-emerald-300" };
  if (score >= 25) return { name: "Somewhat related", color: "bg-lime-300" };
  return { name: "Still far", color: "bg-amber-200" };
}

// 揭晓时在例句里高亮目标词与上下文线索词
function renderExample(ex: string, word: string, clues?: string[]) {
  const full = ex.replace("{word}", word);
  const clueSet = new Set((clues ?? []).map((c) => c.toLowerCase()));
  const wl = word.toLowerCase();
  return full.split(/(\s+)/).map((tok, i) => {
    const n = tok.toLowerCase().replace(/[^a-z']/g, "");
    if (!n) return <span key={i}>{tok}</span>;
    if (n === wl) return <b key={i} className="text-slate-900">{tok}</b>;
    if (clueSet.has(n))
      return (
        <mark key={i} className="rounded bg-amber-100 px-0.5 text-amber-800">
          {tok}
        </mark>
      );
    return <span key={i}>{tok}</span>;
  });
}

export default function CloserPage() {
  const { items: pool, loading } = useGameItems<WordItem>("closer", 300);
  const [target, setTarget] = useState<WordItem | null>(null);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [input, setInput] = useState("");
  const [notice, setNotice] = useState("");
  const [hintStage, setHintStage] = useState(0);
  const [hint, setHint] = useState("");
  const [roundOver, setRoundOver] = useState(false);
  const [won, setWon] = useState(false);
  const [scoring, setScoring] = useState(false);
  const usedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (pool.length && !target) pickWord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool]);

  function pickWord() {
    let candidates = pool.filter((w) => !usedIds.current.has(w.id));
    if (candidates.length === 0) {
      usedIds.current.clear();
      candidates = pool;
    }
    // 优先出带上下文线索的词，先把「上下文猜义」方法演示出来
    const clued = candidates.filter((w) => (w.payload.contextClues?.length ?? 0) > 0);
    if (clued.length > 0) candidates = clued;
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    if (!next) return;
    usedIds.current.add(next.id);
    setTarget(next);
    setGuesses([]);
    setInput("");
    setNotice("");
    setHint("");
    setHintStage(0);
    setRoundOver(false);
    setWon(false);
  }

  function recordResult(correct: boolean) {
    if (!target) return;
    recordProgress({
      gameType: "closer",
      skill: "words_in_context",
      itemId: target.id,
      result: correct ? "correct" : "incorrect",
    });
  }

  async function submit() {
    if (!target || roundOver) return;
    const raw = input.trim().toLowerCase();
    setNotice("");
    if (!raw) return;
    if (/\s/.test(raw)) {
      setNotice("One word at a time.");
      return;
    }
    if (guesses.some((g) => g.word === raw)) {
      setNotice("You already guessed that word.");
      return;
    }

    setScoring(true);
    try {
      const res = await fetch("/api/semantic-distance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guess: raw, target: target.payload.word, pos: target.payload.pos }),
      });
      const r = await res.json();
      if (!r.valid) {
        setNotice(`"${raw}" does not seem to be a known word—try another.`);
      } else {
        const score = r.match ? 100 : Math.max(0, Math.min(100, r.score | 0));
        const entry: Guess = { word: raw, score, nudge: r.match ? "" : r.nudge, latest: true };
        setGuesses((gs) => [...gs, entry]);
        setInput("");
        if (r.match || score === 100) {
          setRoundOver(true);
          setWon(true);
          recordResult(true);
        }
      }
    } catch {
      setNotice("Cannot reach the scoring service right now—please retry.");
    } finally {
      setScoring(false);
    }
  }

  function giveUp() {
    setRoundOver(true);
    setWon(false);
    recordResult(false);
  }

  function requestHint() {
    if (!target) return;
    const stage = hintStage + 1;
    setHintStage(stage);
    const t = target.payload;
    if (stage === 1) {
      setHint(`Hint: it is ${t.pos === "verb" ? "a verb" : "an adjective"}.`);
    } else if (stage === 2) {
      setHint(`Hint: it starts with "${t.word[0].toUpperCase()}" and has ${t.word.length} letters.`);
    } else {
      setHint("Out of hints—tap below to reveal the answer.");
    }
  }

  if (loading || !target) {
    return <main className="mx-auto max-w-lg flex-1 px-4 py-8 text-slate-500">Loading…</main>;
  }

  const sorted = [...guesses].sort((a, b) => b.score - a.score);
  const cloze = target.payload.ex.replace("{word}", "＿＿＿＿");

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Closer</h1>
      <p className="mt-1 text-sm text-slate-500">
        Read the sentence and use context clues to guess the missing SAT word. Each guess shows how close it is in meaning.
      </p>

      <MethodCard {...METHODS.contextClue} />

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="text-xs font-semibold uppercase text-slate-400">
          Blank · {target.payload.pos}
        </div>
        <p className="mt-1 text-base text-slate-800">{cloze}</p>
      </div>

      <div className="mt-4 rounded-xl bg-slate-900 p-4 text-white">
        <div className="text-xs uppercase text-slate-400">Latest distance</div>
        <div className="mt-1 text-sm text-slate-200">
          {guesses.length === 0 ? "Guess a word first." : tierOf(guesses[guesses.length - 1].score).name}
        </div>
      </div>

      {!roundOver && (
        <div className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Type a word…"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
          />
          <button
            onClick={submit}
            disabled={scoring}
            className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            {scoring ? "Scoring…" : "Guess"}
          </button>
        </div>
      )}
      {notice && <p className="mt-2 text-sm text-rose-500">{notice}</p>}

      {!roundOver && (
        <div className="mt-2 flex items-center justify-between text-sm text-slate-500">
          <span>{guesses.length} guesses</span>
          <button onClick={requestHint} className="text-slate-600 underline">
            Need a hint?
          </button>
        </div>
      )}
      {hint && (
        <p className="mt-1 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
          {hint}
          {hintStage >= 3 && (
            <button onClick={giveUp} className="ml-2 font-semibold text-rose-500 underline">
              Reveal answer →
            </button>
          )}
        </p>
      )}

      <ul className="mt-4 space-y-2">
        {sorted.map((g) => {
          const t = tierOf(g.score);
          return (
            <li key={g.word} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{g.word}</span>
                <span className="text-sm text-slate-500">{g.score}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-slate-200">
                <div className={`h-full ${t.color}`} style={{ width: `${g.score}%` }} />
              </div>
              {g.nudge && <p className="mt-1 text-xs text-slate-500">{g.nudge}</p>}
            </li>
          );
        })}
      </ul>

      {roundOver && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase text-slate-400">
            {won ? "You got it" : "Answer"}
          </div>
          <h2 className="mt-1 text-xl font-bold text-slate-900">{target.payload.word}</h2>
          <p className="text-sm italic text-slate-500">{target.payload.pos}</p>
          <p className="mt-2 text-sm text-slate-700">{target.payload.def}</p>
          <p className="mt-2 rounded-lg bg-emerald-50 p-2 text-sm text-slate-700">
            {renderExample(target.payload.ex, target.payload.word, target.payload.contextClues)}
          </p>
          {target.payload.contextClues && target.payload.contextClues.length > 0 && (
            <p className="mt-1 text-xs text-amber-700">Highlighted words are the context clues that hint at the meaning.</p>
          )}
          <button
            onClick={pickWord}
            className="mt-4 w-full rounded-lg bg-rose-500 py-2 font-semibold text-white"
          >
            Next word
          </button>
        </div>
      )}
    </main>
  );
}
