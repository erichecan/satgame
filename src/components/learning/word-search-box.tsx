"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type WordData = {
  id: string;
  word: string;
  partOfSpeech: string | null;
  definitionEn: string;
  definitionCn: string | null;
  exampleEn: string | null;
};

export function WordSearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [data, setData] = useState<WordData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function search() {
    const word = query.trim();
    if (!word) return;
    setLoading(true);
    setData(null);
    setNotFound(false);
    setSaved(false);
    try {
      const res = await fetch(`/api/words?word=${encodeURIComponent(word.toLowerCase())}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.word);
      } else {
        setNotFound(true);
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
      body: JSON.stringify({ wordId: data.id, reason: "manual", sourceGame: "notebook_search" }),
    });
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search a word, e.g. ubiquitous"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
        />
        <Button onClick={search} disabled={loading || !query.trim()}>
          {loading ? "Searching…" : "Search"}
        </Button>
      </div>

      {notFound && (
        <div className="mt-3 space-y-1">
          <p className="text-sm text-slate-500">This word is not in our list yet (~1500 common SAT words). Look it up in a dictionary:</p>
          <a
            className="text-sm text-amber-600 underline"
            href={`https://www.merriam-webster.com/dictionary/${encodeURIComponent(query.trim().toLowerCase())}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Merriam-Webster: {query.trim()}
          </a>
        </div>
      )}

      {data && (
        <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{data.word}</span>
            {data.partOfSpeech && <Badge variant="secondary">{data.partOfSpeech}</Badge>}
          </div>
          <p className="text-sm text-slate-700">{data.definitionEn}</p>
          {data.exampleEn && (
            <p className="text-sm italic text-slate-500">&ldquo;{data.exampleEn}&rdquo;</p>
          )}
          <button
            className="text-sm text-amber-600 underline disabled:opacity-50"
            onClick={handleSave}
            disabled={saved}
          >
            {saved ? "Added to notebook ✓" : "⭐ Add to notebook"}
          </button>
        </div>
      )}
    </div>
  );
}
