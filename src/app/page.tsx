import Link from "next/link";
import { prisma } from "@/lib/db";
import { getStats } from "@/lib/gamification";
import { getOrCreateDailyAssignment } from "@/lib/daily";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const GAMES = [
  { href: "/vocab/clusters", title: "Clusters", domain: "Word nuance", gameType: "clusters" },
  { href: "/rw/closer", title: "Closer", domain: "Words in context", gameType: "closer" },
  { href: "/vocab/morphology", title: "Morphology", domain: "Word roots", gameType: "morphology" },
  { href: "/vocab/connotation", title: "Connotation", domain: "Connotation", gameType: "connotation" },
  { href: "/rw/read-the-green", title: "Read the Green", domain: "Reading / evidence", gameType: "read_the_green" },
  { href: "/rw/paraphrase", title: "Paraphrase Match", domain: "Paraphrase", gameType: "paraphrase" },
  { href: "/rw/inference", title: "Inference", domain: "Inference", gameType: "inference" },
  { href: "/rw/graphic", title: "Graphic", domain: "Charts", gameType: "graphic" },
  { href: "/rw/trim", title: "Trim the Sentence", domain: "Sentence core", gameType: "trim" },
  { href: "/rw/trap-spotter", title: "Trap Spotter", domain: "Trap types", gameType: "trap_spotter" },
  { href: "/rw/gate-run", title: "Gate Run", domain: "Punctuation / transitions", gameType: "gate_run" },
  { href: "/math/dissector", title: "Dissector", domain: "Math reading", gameType: "dissector" },
];

export default async function Home() {
  const stats = await getStats();
  const daily = await getOrCreateDailyAssignment();
  const dueCount = await prisma.progress.count({
    where: { nextReview: { lte: new Date() } },
  });
  const notebookDueCount = await prisma.vocabNote.count({
    where: { nextReview: { lte: new Date() } },
  });

  const wordsDone = daily.wordsViewed.length;
  const wordsTotal = daily.wordIds.length;
  const quizDone = Object.keys(daily.quizAnswers as Record<string, string>).length;
  const quizTotal = daily.quizItemIds.length;
  const gamesDone = daily.gamesPlayed.length;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <Card className="mb-8 border-slate-900">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Today's tasks</span>
            {daily.completedAt && <Badge variant="secondary">✦ Checked in today</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link href="/study" className="rounded-lg border border-slate-200 p-3 hover:border-slate-400">
            <div className="text-sm text-slate-500">Vocab</div>
            <div className="text-lg font-semibold text-slate-900">
              {wordsDone} / {wordsTotal}
            </div>
          </Link>
          <Link href="/daily-quiz" className="rounded-lg border border-slate-200 p-3 hover:border-slate-400">
            <div className="text-sm text-slate-500">Quiz</div>
            <div className="text-lg font-semibold text-slate-900">
              {quizDone} / {quizTotal}
            </div>
          </Link>
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="text-sm text-slate-500">Games</div>
            <div className="text-lg font-semibold text-slate-900">{gamesDone} / 12</div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">XP</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.xp}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Streak</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.streak} d</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Due today</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{dueCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Notebook due</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            <Link href="/notebook" className="hover:underline">
              {notebookDueCount}
            </Link>
          </CardContent>
        </Card>
      </div>

      {stats.badges.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {stats.badges.map((b) => (
            <Badge key={b.id} variant="secondary" title={b.description}>
              🏅 {b.name}
            </Badge>
          ))}
        </div>
      )}

      <h2 className="mb-4 text-lg font-semibold text-slate-900">Today's tasks · Games</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((g) => (
          <Link key={g.href} href={g.href}>
            <Card className="h-full transition hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{g.title}</span>
                  {daily.gamesPlayed.includes(g.gameType) && <span className="text-emerald-600">✓</span>}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-500">{g.domain}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
