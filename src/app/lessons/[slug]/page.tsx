import Link from "next/link";
import { notFound } from "next/navigation";
import { LESSONS, getLesson } from "@/content/lessons";
import { UNITS } from "@/lib/lesson-types";
import { TRAP_LABEL, TRAP_TIP } from "@/lib/trap-types";
import { LessonRunner } from "./lesson-runner";

export function generateStaticParams() {
  return LESSONS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lesson = getLesson(slug);
  return { title: lesson ? `${lesson.title} · SAT Game` : "Lesson · SAT Game" };
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lesson = getLesson(slug);
  if (!lesson) notFound();

  const unit = UNITS.find((u) => u.unit === lesson.unit);
  const ordered = LESSONS.filter((l) => l.unit === lesson.unit).sort((a, b) => a.order - b.order);
  const flat = [...LESSONS].sort((a, b) => a.unit - b.unit || a.order - b.order);
  const at = flat.findIndex((l) => l.slug === lesson.slug);
  const prev = flat[at - 1];
  const next = flat[at + 1];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Link href="/lessons" className="text-xs font-semibold text-slate-400 hover:text-slate-600">
        ← Unit {lesson.unit}: {unit?.title}
      </Link>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">{lesson.title}</h1>
      <p className="mt-1 text-sm text-slate-500">{lesson.blurb}</p>

      {/* ---------- Learn ---------- */}
      <section className="mt-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Learn</h2>

        <div className="mt-2 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">How you&apos;ll recognize it</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {lesson.stems.map((s, i) => (
              <li key={i} className="rounded-lg bg-slate-50 px-3 py-1.5 italic">
                “{s}”
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <h3 className="text-sm font-semibold text-emerald-800">🧭 The strategy</h3>
          <ol className="mt-2 space-y-2">
            {lesson.steps.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span>
                  <span className="font-semibold text-emerald-900">{s.title}</span>
                  <span className="block text-emerald-900/70">{s.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        {lesson.signals?.length ? (
          <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">Signals to look for</h3>
            <div className="mt-2 space-y-2">
              {lesson.signals.map((g, i) => (
                <div key={i}>
                  <div className="text-xs font-semibold text-slate-500">{g.label}</div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {g.items.map((it, j) => (
                      <span key={j} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700">
                        {it}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {lesson.traps.length ? (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/60 p-4">
            <h3 className="text-sm font-semibold text-rose-800">⚠️ Traps this type loves</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {lesson.traps.map((t) => (
                <li key={t}>
                  <span className="font-semibold text-rose-900">{TRAP_LABEL[t]}</span>
                  <span className="block text-rose-900/70">{TRAP_TIP[t]}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {/* ---------- Worked example + Practice ---------- */}
      <LessonRunner slug={lesson.slug} example={lesson.workedExample} steps={lesson.steps} />

      {/* ---------- Train it in a game ---------- */}
      {lesson.trainWith?.length ? (
        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Train this move</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {lesson.trainWith.map((g) => (
              <Link
                key={g.href}
                href={g.href}
                className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 hover:border-slate-900 hover:text-slate-900"
              >
                {g.label} →
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* ---------- Prev / next ---------- */}
      <nav className="mt-8 flex items-center justify-between border-t border-slate-200 pt-4 text-sm">
        {prev ? (
          <Link href={`/lessons/${prev.slug}`} className="text-slate-500 hover:text-slate-900">
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/lessons/${next.slug}`} className="text-right font-semibold text-slate-900">
            {next.title} →
          </Link>
        ) : (
          <span />
        )}
      </nav>

      <p className="mt-4 text-xs text-slate-400">
        Unit {lesson.unit} · lesson {lesson.order + 1} of {ordered.length}
      </p>
    </main>
  );
}
