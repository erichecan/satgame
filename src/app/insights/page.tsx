import Link from "next/link";
import { prisma } from "@/lib/db";
import { TRAP_LABEL, TRAP_TIP, TrapType } from "@/lib/trap-types";

export const dynamic = "force-dynamic";

const GAME_LABEL: Record<string, string> = {
  read_the_green: "Read the Green",
  paraphrase: "Paraphrase Match",
  trim: "Trim the Sentence",
  trap_spotter: "Trap Spotter",
  inference: "Inference",
  morphology: "Morphology",
  closer: "Closer",
  clusters: "Clusters",
  gate_run: "Gate Run",
  dissector: "Dissector",
};

export default async function InsightsPage() {
  const total = await prisma.progress.count();
  const correct = await prisma.progress.count({ where: { result: "correct" } });

  const byError = await prisma.progress.groupBy({
    by: ["errorTag"],
    where: { errorTag: { not: null } },
    _count: { _all: true },
  });
  const errors = byError
    .map((e) => ({ tag: e.errorTag as TrapType, count: e._count._all }))
    .filter((e) => e.tag in TRAP_LABEL)
    .sort((a, b) => b.count - a.count);
  const totalErrors = errors.reduce((s, e) => s + e.count, 0);

  const byGame = await prisma.progress.groupBy({
    by: ["gameType", "result"],
    _count: { _all: true },
  });
  const gameMap = new Map<string, { correct: number; total: number }>();
  for (const row of byGame) {
    const g = gameMap.get(row.gameType) ?? { correct: 0, total: 0 };
    g.total += row._count._all;
    if (row.result === "correct") g.correct += row._count._all;
    gameMap.set(row.gameType, g);
  }
  const games = [...gameMap.entries()].sort((a, b) => b[1].total - a[1].total);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">错误 DNA</h1>
      <p className="mt-1 text-sm text-slate-500">
        从你做过的题里，找出你最常掉进的陷阱类型和最弱的技能——对症下药，比盲目刷题快。
      </p>

      {total === 0 ? (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-500">
          还没有做题记录。先去玩几个游戏，这里就会长出你的错误画像。
        </div>
      ) : (
        <>
          <div className="mt-6 rounded-xl border border-slate-900 bg-slate-900 p-5 text-white">
            <div className="text-sm text-slate-300">当前掌握率</div>
            <div className="mt-1 text-3xl font-bold">
              {total > 0 ? Math.round((correct / total) * 100) : 0}%
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {correct} / {total} 道题目当前答对
            </div>
          </div>

          <section className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900">你最常掉进的陷阱</h2>
            {errors.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                目前没有记录到分类错误——继续玩 Read the Green / Trap Spotter / Inference，掉进的陷阱会归类到这里。
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {errors.map((e) => {
                  const pct = Math.round((e.count / totalErrors) * 100);
                  return (
                    <li key={e.tag} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{TRAP_LABEL[e.tag]}</span>
                        <span className="text-sm text-slate-500">
                          {e.count} 次 · {pct}%
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-slate-100">
                        <div className="h-full bg-rose-400" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{TRAP_TIP[e.tag]}</p>
                    </li>
                  );
                })}
              </ul>
            )}
            {errors.length > 0 && (
              <Link
                href="/rw/trap-spotter"
                className="mt-4 inline-block rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white"
              >
                去 Trap Spotter 专项训练 →
              </Link>
            )}
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900">各游戏正确率</h2>
            <ul className="mt-3 space-y-2">
              {games.map(([g, s]) => {
                const pct = Math.round((s.correct / s.total) * 100);
                return (
                  <li key={g} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
                    <span className="w-36 shrink-0 text-sm font-medium text-slate-700">{GAME_LABEL[g] ?? g}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded bg-slate-100">
                      <div className={`h-full ${pct >= 70 ? "bg-emerald-400" : pct >= 40 ? "bg-amber-300" : "bg-rose-400"}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-16 shrink-0 text-right text-sm text-slate-500">
                      {pct}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
