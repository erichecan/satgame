"use client";

import { useEffect, useMemo, useState } from "react";
import { useGameItems } from "@/lib/use-game-items";
import { recordProgress } from "@/lib/record-progress";
import { MethodCard } from "@/components/rw/method-card";
import { METHODS } from "@/lib/rw-methods";
import { TrapType, TRAP_LABEL } from "@/lib/trap-types";

type Option = { t: string; correct?: boolean; trap?: string; trapType?: TrapType };
type ReadItem = {
  id: string;
  payload: {
    sentences: string[];
    question: string;
    options: Option[];
    evidenceIndex: number;
    evidenceWhy: string;
    keywords?: string[];
  };
};

type Phase = "keyword" | "answer" | "evidence" | "done";

const norm = (s: string) => s.toLowerCase().replace(/[^a-z']/g, "");

export default function ReadTheGreenPage() {
  const { items: rawItems, loading } = useGameItems<ReadItem>("read_the_green", 200);
  // 带「关键词定位」的增强题排前，让四步法方法论内容先露出；其余保持原有(最近学词)顺序
  const items = useMemo(
    () =>
      [...rawItems].sort(
        (a, b) => (b.payload.keywords?.length ? 1 : 0) - (a.payload.keywords?.length ? 1 : 0)
      ),
    [rawItems]
  );
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("answer");
  const [firstTry, setFirstTry] = useState(true);
  const [clean, setClean] = useState(0);
  const [pickedOption, setPickedOption] = useState<number | null>(null);
  const [wrongOption, setWrongOption] = useState<number | null>(null);
  const [pickedEvidence, setPickedEvidence] = useState<number | null>(null);
  const [pickedKeywords, setPickedKeywords] = useState<Set<number>>(new Set());
  const [errTag, setErrTag] = useState<TrapType | undefined>(undefined);
  const [note, setNote] = useState<{ head: string; body: string; extra?: string; tone: string } | null>(null);

  const item = items[idx];

  const keywordSet = useMemo(
    () => new Set((item?.payload.keywords ?? []).map(norm)),
    [item]
  );
  const questionTokens = useMemo(() => (item ? item.payload.question.split(/(\s+)/) : []), [item]);
  const hasKeywordStage = keywordSet.size > 0;

  function startRound(it: ReadItem | undefined) {
    setPhase((it?.payload.keywords ?? []).length > 0 ? "keyword" : "answer");
    setFirstTry(true);
    setPickedOption(null);
    setWrongOption(null);
    setPickedEvidence(null);
    setPickedKeywords(new Set());
    setErrTag(undefined);
    setNote(null);
  }

  // 首个 item 到位或换题时初始化阶段
  useEffect(() => {
    if (item) startRound(item);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  const foundKeywords = [...pickedKeywords].filter((i) => keywordSet.has(norm(questionTokens[i]))).length;

  function toggleKeyword(i: number) {
    if (phase !== "keyword") return;
    const token = norm(questionTokens[i]);
    if (!token) return;
    setPickedKeywords((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function pickAnswer(i: number) {
    if (!item || phase !== "answer") return;
    const opt = item.payload.options[i];
    if (opt.correct) {
      setPickedOption(i);
      setPhase("evidence");
      setNote({ head: "答对了", body: "现在回到原文，点出证明这个答案的那句话。", tone: "go" });
    } else {
      setFirstTry(false);
      setWrongOption(i);
      if (!errTag) setErrTag(opt.trapType);
      setNote({ head: "这是个陷阱", body: opt.trap ?? "", extra: "再看看，选另一个。", tone: "no" });
    }
  }

  function pickEvidence(i: number) {
    if (!item || phase !== "evidence") return;
    if (i === item.payload.evidenceIndex) {
      setPickedEvidence(i);
      setPhase("done");
      if (firstTry) setClean((c) => c + 1);
      recordProgress({ gameType: "read_the_green", skill: "info_ideas", itemId: item.id, result: firstTry ? "correct" : "incorrect", errorTag: firstTry ? undefined : errTag });
      const traps = item.payload.options
        .filter((o) => !o.correct)
        .map((o) => `• ${o.trapType ? `【${TRAP_LABEL[o.trapType]}】` : ""}${o.trap ?? ""}`)
        .join("\n");
      setNote({ head: "就是这句", body: item.payload.evidenceWhy, extra: `其他选项为什么不对：\n${traps}`, tone: "ok" });
    } else {
      setFirstTry(false);
      setNote({
        head: "不是最有力的证据",
        body: "这句话是真的，但不能直接证明答案。找出说得最清楚的那句。",
        tone: "no",
      });
    }
  }

  function next() {
    if (idx === items.length - 1) {
      setIdx(items.length);
      return;
    }
    setIdx((i) => i + 1);
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
          {clean} / {items.length} 篇一次就读对答案和证据。
        </p>
        <button
          className="mt-6 rounded-full bg-slate-900 px-6 py-2 font-semibold text-white"
          onClick={() => {
            setIdx(0);
            setClean(0);
          }}
        >
          再来一轮
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
        <span>
          {idx + 1} / {items.length}
        </span>
        <span>{clean} 篇干净通过</span>
      </div>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Read the Green</h1>
      <p className="mt-1 text-sm text-slate-500">细节题四步：读题 → 抓关键词 → 回原文定位 → 选同义改写。</p>

      <MethodCard {...METHODS.detailFourStep} />

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 leading-relaxed">
        {item.payload.sentences.map((s, i) => (
          <span
            key={i}
            onClick={() => phase === "evidence" && pickEvidence(i)}
            className={`rounded px-0.5 ${phase === "evidence" ? "cursor-pointer hover:bg-emerald-50" : ""} ${
              pickedEvidence === i ? "bg-emerald-100 shadow-[inset_0_-2px_0_#3FA76A]" : ""
            }`}
          >
            {s}{" "}
          </span>
        ))}
      </div>

      {phase === "keyword" ? (
        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-900">先点出题干里该回原文定位的关键词：</p>
          <p className="mt-2 leading-relaxed">
            {questionTokens.map((tok, i) =>
              /\s+/.test(tok) || norm(tok) === "" ? (
                <span key={i}>{tok}</span>
              ) : (
                <span
                  key={i}
                  onClick={() => toggleKeyword(i)}
                  className={`cursor-pointer rounded px-0.5 ${
                    pickedKeywords.has(i)
                      ? keywordSet.has(norm(tok))
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-600"
                      : "hover:bg-slate-100"
                  }`}
                >
                  {tok}
                </span>
              )
            )}
          </p>
          <button
            onClick={() => setPhase("answer")}
            disabled={foundKeywords < keywordSet.size}
            className="mt-3 w-full rounded-lg bg-slate-900 py-2 font-semibold text-white disabled:opacity-40"
          >
            {foundKeywords < keywordSet.size ? `再找 ${keywordSet.size - foundKeywords} 个关键词` : "进入选项 →"}
          </button>
        </div>
      ) : (
        <>
          <p className="mt-4 font-semibold text-slate-900">{item.payload.question}</p>
          <div className="mt-2 space-y-2">
            {item.payload.options.map((o, i) => (
              <button
                key={i}
                onClick={() => pickAnswer(i)}
                disabled={phase !== "answer"}
                className={`w-full rounded-lg border p-3 text-left text-sm transition ${
                  pickedOption === i
                    ? "border-emerald-400 bg-emerald-50 font-semibold text-emerald-700"
                    : wrongOption === i
                    ? "border-rose-300 bg-rose-50"
                    : phase !== "answer"
                    ? "opacity-40"
                    : "border-slate-200 bg-slate-50 hover:border-slate-400"
                }`}
              >
                {o.t}
              </button>
            ))}
          </div>
        </>
      )}

      {phase === "evidence" && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          提示：正确答案是原文的<b>换词说法</b>，不是原词照搬。回原文找证明它的那一句。
        </p>
      )}

      {note && (
        <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
          <div
            className={`font-semibold ${
              note.tone === "ok" ? "text-emerald-600" : note.tone === "no" ? "text-rose-500" : "text-slate-900"
            }`}
          >
            {note.head}
          </div>
          <p className="mt-1 whitespace-pre-line text-slate-600">{note.body}</p>
          {note.extra && <p className="mt-1 whitespace-pre-line text-xs text-slate-400">{note.extra}</p>}
        </div>
      )}

      {phase === "done" && (
        <button onClick={next} className="mt-4 w-full rounded-lg bg-slate-900 py-2 font-semibold text-white">
          {idx === items.length - 1 ? "看总结" : "下一篇"}
        </button>
      )}
    </main>
  );
}
