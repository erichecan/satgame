"use client";

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

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/login", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  if (pathname === "/login") return null;

  return (
    <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-4 overflow-x-auto px-4 py-3 text-sm">
        <Link href="/" className="font-semibold text-slate-900 shrink-0">
          SAT Game
        </Link>
        <Link
          href="/study"
          className={`shrink-0 rounded-full px-3 py-1 ${
            pathname === "/study" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          背单词
        </Link>
        <Link
          href="/daily-quiz"
          className={`shrink-0 rounded-full px-3 py-1 ${
            pathname === "/daily-quiz" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          测验
        </Link>
        {GAMES.map((g) => (
          <Link
            key={g.href}
            href={g.href}
            className={`shrink-0 rounded-full px-3 py-1 ${
              pathname === g.href
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {g.label}
          </Link>
        ))}
        <Link
          href="/notebook"
          className={`shrink-0 rounded-full px-3 py-1 ${
            pathname === "/notebook" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          生词本
        </Link>
        <Link
          href="/insights"
          className={`shrink-0 rounded-full px-3 py-1 ${
            pathname === "/insights" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          错误 DNA
        </Link>
        <button onClick={handleLogout} className="ml-auto shrink-0 text-slate-400 hover:text-slate-600">
          退出
        </button>
      </div>
    </nav>
  );
}
