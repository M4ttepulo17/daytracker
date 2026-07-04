"use client";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/6 bg-[#0a0a0f]/80 px-5 py-4 pt-[max(env(safe-area-inset-top),1rem)] backdrop-blur-xl min-w-0">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-white truncate">{title}</h1>
        {subtitle && <p className="text-xs text-zinc-500 mt-0.5 truncate">{subtitle}</p>}
      </div>
      <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex-shrink-0 rounded-xl p-2 text-zinc-600 transition hover:bg-white/6 hover:text-zinc-400" aria-label="Esci">
        <LogOut className="h-4 w-4" />
      </button>
    </header>
  );
}
