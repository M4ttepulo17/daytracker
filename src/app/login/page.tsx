"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) { setError("Email o password non corretti."); return; }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 overflow-x-hidden">
      <div className="w-full max-w-sm animate-scale-in">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-indigo-500/20 bg-indigo-500/10 overflow-hidden shadow-xl shadow-indigo-500/10">
            <img src="/icon.svg" alt="DayTracker" className="h-14 w-14" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">DayTracker</h1>
          <p className="mt-2 text-sm text-zinc-500">Il tuo diario personale</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-white/8 bg-white/4 p-6 backdrop-blur-sm">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-3 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="tu@esempio.com" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-zinc-500">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
              <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-3 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="••••••••" />
            </div>
          </div>
          {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-sm text-red-400 animate-fade-in">{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-indigo-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 active:scale-[0.98] disabled:opacity-60 mt-1">
            {loading ? "Accesso in corso..." : "Accedi →"}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-zinc-700">Spazio privato e protetto — solo per te</p>
      </div>
    </main>
  );
}
