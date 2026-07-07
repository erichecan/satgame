import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WordSearchBox } from "@/components/learning/word-search-box";

export const dynamic = "force-dynamic";

const REASON_LABEL: Record<string, string> = {
  wrong: "Wrong",
  asked_hint: "Hint",
  gave_up: "Gave up",
  manual: "Saved",
};

export default async function NotebookPage() {
  const notes = await prisma.vocabNote.findMany({
    include: { word: true },
    orderBy: [{ nextReview: "asc" }, { createdAt: "desc" }],
  });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <h1 className="mb-2 text-xl font-semibold text-slate-900">Notebook</h1>
      <p className="mb-4 text-sm text-slate-500">
        Words you miss or star in games are added automatically; you can also search and add words here by hand.
      </p>
      <WordSearchBox />
      {notes.length === 0 && (
        <p className="text-slate-500">No words yet—ones you miss or star in games will appear here automatically.</p>
      )}
      <div className="space-y-3">
        {notes.map((note) => {
          const due = note.nextReview && note.nextReview <= new Date();
          return (
            <Card key={note.id}>
              <CardHeader className="flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">{note.word.word}</CardTitle>
                <div className="flex gap-2">
                  {due && <Badge variant="destructive">Due</Badge>}
                  <Badge variant="secondary">{REASON_LABEL[note.addedFrom] ?? note.addedFrom}</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                {note.word.definitionEn}
                {note.word.exampleEn && (
                  <p className="mt-1 italic text-slate-400">&ldquo;{note.word.exampleEn}&rdquo;</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
