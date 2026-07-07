"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Login failed");
        return;
      }
      router.push(searchParams.get("next") || "/");
      router.refresh();
    } catch {
      setError("Network error, please retry");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-8 shadow-sm"
    >
      <h1 className="text-xl font-semibold text-slate-900">SAT Game</h1>
      <p className="text-sm text-slate-500">Enter the access code to continue</p>
      <input
        type="password"
        inputMode="numeric"
        value={passcode}
        onChange={(e) => setPasscode(e.target.value)}
        placeholder="Access code"
        className="w-full rounded-lg border border-slate-200 px-4 py-2 text-lg tracking-widest outline-none focus:border-slate-400"
        autoFocus
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading || !passcode}
        className="w-full rounded-lg bg-slate-900 py-2 text-white disabled:opacity-40"
      >
        {loading ? "Signing in..." : "Enter"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
