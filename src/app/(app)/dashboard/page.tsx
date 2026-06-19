"use client";

import { useEffect, useState } from "react";
import DayForm from "@/components/DayForm";
import { DayRecord, Sport, Settings, HabitStreaks } from "@/types";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const TODAY = format(new Date(), "yyyy-MM-dd");

const QUOTES = [
  "How many times would you be willing to fail if you knew success was only 20 failures away?",
  "La disciplina è il ponte tra gli obiettivi e i risultati.",
  "Ogni giorno è una nuova possibilità di migliorare.",
  "Il successo è la somma di piccoli sforzi ripetuti ogni giorno.",
  "Non contare i giorni, fai sì che i giorni contino.",
  "La costanza batte il talento quando il talento non è costante.",
  "Ogni grande viaggio inizia con un singolo passo.",
];

export default function DashboardPage() {
  const [day, setDay] = useState<DayRecord | null>(null);
  const [sports, setSports] = useState<Sport[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState<number>(0);
  const [habitStreaks, setHabitStreaks] = useState<HabitStreaks>({
    prayer: 0, music: 0, study: 0, economicProject: 0, workout: 0, sleep: 0, reading: 0, instagram: 0,
  });

  useEffect(() => {
    async function load() {
      const [dayRes, sportsRes, settingsRes, statsRes] = await Promise.all([
        fetch(`/api/days/${TODAY}`),
        fetch("/api/sports"),
        fetch("/api/settings"),
        fetch("/api/stats"),
      ]);

      const safeJson = async (res: Response) => {
        try { return await res.json(); } catch { return {}; }
      };

      const [dayData, sportsData, settingsData, statsData] = await Promise.all([
        safeJson(dayRes),
        safeJson(sportsRes),
        safeJson(settingsRes),
        safeJson(statsRes),
      ]);

      setDay(dayData.day ?? null);
      setSports(sportsData.sports ?? []);
      setSettings(settingsData.settings ?? null);
      setStreak(statsData.streak?.current ?? 0);
      setHabitStreaks(statsData.habitStreaks ?? { prayer: 0, music: 0, study: 0, economicProject: 0, workout: 0, sleep: 0, reading: 0, instagram: 0 });
      setLoading(false);
    }
    load();
  }, []);

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const quote = QUOTES[dayOfYear % QUOTES.length];

  if (loading || !settings) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-[max(env(safe-area-inset-top),1.5rem)] pb-4 border-b border-white/6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">DayTracker</p>
            <h1 className="text-2xl font-bold text-white capitalize leading-tight">
              {format(new Date(), "EEEE", { locale: it })}
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5 capitalize">
              {format(new Date(), "d MMMM yyyy", { locale: it })}
            </p>
          </div>
          {streak > 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 px-3 py-2 min-w-[56px]">
              <span className="text-xl leading-none">🔥</span>
              <span className="text-lg font-bold text-orange-300 leading-tight">{streak}</span>
              <span className="text-[9px] font-semibold uppercase tracking-wide text-orange-500/70">streak</span>
            </div>
          )}
        </div>
        {/* Citazione del giorno */}
        <div className="mt-4 rounded-xl border border-white/6 bg-white/3 px-4 py-3">
          <p className="text-xs text-zinc-400 italic leading-relaxed">&ldquo;{quote}&rdquo;</p>
        </div>
      </div>

      <DayForm
        date={TODAY}
        initialDay={day}
        sports={sports}
        settings={settings}
        habitStreaks={habitStreaks}
        onSaved={setDay}
      />
    </div>
  );
}
