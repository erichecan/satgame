"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const GAMES = [
  { href: "/vocab/clusters", label: "Clusters" },
  { href: "/rw/closer", label: "Closer" },
  { href: "/vocab/morphology", label: "Morphology" },
  { href: "/vocab/connotation", label: "Connotation" },
  { href: "/rw/read-the-green", label: "Read the Green" },
  { href: "/rw/paraphrase", label: "Paraphrase Match" },
  { href: "/rw/inference", label: "Inference" },
  { href: "/rw/graphic", label: "Graphic" },
  { href: "/rw/trim", label: "Trim the Sentence" },
  { href: "/rw/trap-spotter", label: "Trap Spotter" },
  { href: "/rw/gate-run", label: "Gate Run" },
  { href: "/math/dissector", label: "Dissector" },
];

const pill = (active: boolean) =>
  `shrink-0 rounded-full px-3 py-1 ${active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`;

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [gamesOpen, setGamesOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/login", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  if (pathname === "/login") return null;

  const gameActive = GAMES.some((g) => g.href === pathname);

  return (
    <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
        <Link href="/" className="shrink-0 font-semibold text-slate-900">
          SAT Game
        </Link>
        <Link href="/study" className={pill(pathname === "/study")}>
          Vocab
        </Link>
        <Link href="/daily-quiz" className={pill(pathname === "/daily-quiz")}>
          Quiz
        </Link>

        {/* Games dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setGamesOpen((o) => !o)}
            className={pill(gameActive || gamesOpen)}
            aria-expanded={gamesOpen}
          >
            Games <span className="text-xs">▾</span>
          </button>
          {gamesOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setGamesOpen(false)} />
              <div className="absolute left-0 z-20 mt-2 grid w-56 grid-cols-1 gap-0.5 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                {GAMES.map((g) => (
                  <Link
                    key={g.href}
                    href={g.href}
                    onClick={() => setGamesOpen(false)}
                    className={`rounded-lg px-3 py-1.5 text-sm ${
                      pathname === g.href ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {g.label}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        <Link href="/notebook" className={pill(pathname === "/notebook")}>
          Notebook
        </Link>
        <Link href="/insights" className={pill(pathname === "/insights")}>
          Error DNA
        </Link>
        <button onClick={handleLogout} className="ml-auto shrink-0 text-slate-400 hover:text-slate-600">
          Log out
        </button>
      </div>
    </nav>
  );
}
