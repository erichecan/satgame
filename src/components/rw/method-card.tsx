"use client";

import { useState } from "react";

// 方法卡：每个 RW 游戏入口的「先教方法再练」教学层，可随时折叠/展开。
export function MethodCard({ title, points }: { title: string; points: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2 text-left text-sm font-semibold text-emerald-800"
      >
        <span>🧭 Method · {title}</span>
        <span className="text-emerald-500">{open ? "Collapse" : "Expand"}</span>
      </button>
      {open && (
        <ol className="list-decimal space-y-1 px-8 pb-3 text-sm text-emerald-900/80">
          {points.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
