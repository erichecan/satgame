"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

type WordData = {
  id: string;
  word: string;
  partOfSpeech: string | null;
  definitionEn: string;
  definitionCn: string | null;
  exampleEn: string | null;
};

export function WordChip({ word, sourceGame }: { word: string; sourceGame?: string }) {
  const [data, setData] = useState<WordData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCn, setShowCn] = useState(false);
  const [saved, setSaved] = useState(false);

  async function loadWord() {
    if (data || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/words?word=${encodeURIComponent(word.toLowerCase())}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.word);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!data) return;
    await fetch("/api/vocab-notebook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId: data.id, reason: "manual", sourceGame }),
    });
    setSaved(true);
  }

  return (
    <Popover onOpenChange={(open) => open && loadWord()}>
      <PopoverTrigger className="cursor-pointer underline decoration-dotted underline-offset-4 hover:decoration-solid">
        {word}
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-2">
        {loading && <p className="text-sm text-slate-500">加载中...</p>}
        {!loading && !data && <p className="text-sm text-slate-500">未收录该词</p>}
        {data && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{data.word}</span>
              {data.partOfSpeech && <Badge variant="secondary">{data.partOfSpeech}</Badge>}
            </div>
            <p className="text-sm text-slate-700">{data.definitionEn}</p>
            {data.exampleEn && (
              <p className="text-sm italic text-slate-500">&ldquo;{data.exampleEn}&rdquo;</p>
            )}
            {showCn && data.definitionCn && (
              <p className="text-sm text-slate-600">{data.definitionCn}</p>
            )}
            <div className="flex items-center gap-3 pt-1 text-sm">
              {data.definitionCn && (
                <button className="text-slate-500 underline" onClick={() => setShowCn((v) => !v)}>
                  {showCn ? "隐藏中文" : "译成中文"}
                </button>
              )}
              <button
                className="text-amber-600 underline disabled:opacity-50"
                onClick={handleSave}
                disabled={saved}
              >
                {saved ? "已加入生词本 ✓" : "⭐ 加入生词本"}
              </button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
