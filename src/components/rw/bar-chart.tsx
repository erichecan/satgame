import type { Chart } from "@/lib/lesson-types";

// 共享的横向条形图：Graphic 游戏与 Quantitative Evidence 技巧课共用
export function BarChart({ title, unit, bars }: Chart) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      {unit && <div className="text-xs text-slate-400">Unit: {unit}</div>}
      <div className="mt-3 space-y-2">
        {bars.map((b, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-28 shrink-0 text-right text-slate-600">{b.label}</span>
            <div className="h-4 flex-1 overflow-hidden rounded bg-slate-100">
              <div className="h-full rounded bg-slate-800" style={{ width: `${(b.value / max) * 100}%` }} />
            </div>
            <span className="w-12 shrink-0 font-mono text-slate-700">{b.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
