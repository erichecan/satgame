import Link from "next/link";
import { prisma } from "@/lib/db";
import { LESSONS } from "@/content/lessons";
import { UNITS, MASTERY_LABEL, masteryOf, type Mastery } from "@/lib/lesson-types";

export const dynamic = "force-dynamic";

const DOT: Record<Mastery, string> = {
  "not-started": "bg-slate-200",
  familiar: "bg-amber-400",
  proficient: "bg-sky-500",
  mastered: "bg-emerald-500",
};

const BADGE: Record<Mastery, string> = {
  "not-started": "text-slate-400",
  familiar: "text-amber-600",
  proficient: "text-sky-600",
  mastered: "text-emerald-600",
};

export default async function LessonsPage() {
  const rows = await prisma.progress.groupBy({
    by: ["skill"],
    where: { gameType: "lesson" },
    _avg: { masteryScore: true },
    _count: { _all: true },
  });
  const bySkill = new Map(rows.map((r) => [r.skill, { avg: r._avg.masteryScore, n: r._count._all }]));

  const mastery = (slug: string): Mastery => {
    const p = bySkill.get(slug);
    return masteryOf(p?.avg, (p?.n ?? 0) > 0);
  };

  const done = LESSONS.filter((l) => mastery(l.slug) === "mastered").length;
  const started = LESSONS.filter((l) => mastery(l.slug) !== "not-started").length;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Course</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Reading &amp; Writing Strategies</h1>
      <p className="mt-2 text-sm text-slate-500">
        Every question type on the Digital SAT, one strategy at a time. Read the method, walk through a worked
        example, then practice until it sticks.
      </p>

      <div className="mt-4 flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
        <div>
          <div className="text-lg font-bold text-slate-900">
            {done}
            <span className="text-sm font-normal text-slate-400"> / {LESSONS.length}</span>
          </div>
          <div className="text-xs text-slate-500">Mastered</div>
        </div>
        <div className="h-8 w-px bg-slate-200" />
        <div>
          <div className="text-lg font-bold text-slate-900">{started}</div>
          <div className="text-xs text-slate-500">Started</div>
        </div>
        <div className="ml-auto flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
          {(["familiar", "proficient", "mastered"] as Mastery[]).map((m) => (
            <span key={m} className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${DOT[m]}`} />
              {MASTERY_LABEL[m]}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {UNITS.map((u) => {
          const lessons = LESSONS.filter((l) => l.unit === u.unit).sort((a, b) => a.order - b.order);
          if (!lessons.length) return null;
          return (
            <section key={u.unit}>
              <h2 className="text-sm font-bold text-slate-900">
                Unit {u.unit}: {u.title}
              </h2>
              <p className="text-xs text-slate-500">{u.blurb}</p>
              <ul className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
                {lessons.map((l) => {
                  const m = mastery(l.slug);
                  return (
                    <li key={l.slug}>
                      <Link
                        href={`/lessons/${l.slug}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
                      >
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT[m]}`} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-900">{l.title}</span>
                          <span className="block truncate text-xs text-slate-500">{l.blurb}</span>
                        </span>
                        <span className={`shrink-0 text-xs font-semibold ${BADGE[m]}`}>{MASTERY_LABEL[m]}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
