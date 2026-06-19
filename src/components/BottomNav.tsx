"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History, BarChart3, Settings } from "lucide-react";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Oggi", icon: Home },
  { href: "/history", label: "Storico", icon: History },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/settings", label: "Impostazioni", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/6 bg-[#0a0a0f]/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-between px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href} className="flex flex-1 flex-col items-center gap-1 py-3 transition-all">
              <div className={clsx(
                "flex h-8 w-8 items-center justify-center rounded-xl transition-all",
                active ? "bg-indigo-500/20" : ""
              )}>
                <Icon className={clsx("h-5 w-5 transition-colors", active ? "text-indigo-400" : "text-zinc-600")} strokeWidth={active ? 2.5 : 2} />
              </div>
              <span className={clsx("text-[10px] font-semibold tracking-wide transition-colors", active ? "text-indigo-400" : "text-zinc-600")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
