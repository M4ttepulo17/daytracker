"use client";

import { useEffect, useState } from "react";
import DayForm from "@/components/DayForm";
import { DayRecord, Sport, Settings, HabitStreaks } from "@/types";
import { format, subDays, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { Clock } from "lucide-react";

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
  const [effectiveDate, setEffectiveDate] = useState<string | null>(null);
  const [waitingForNewDay, setWaitingForNewDay] = useState(false);
  const [habitStreaks, setHabitStreaks] = useState<HabitStreaks>({
    prayer: 0, music: 0, study: 0, economicProject: 0, workout: 0, sleep: 0, reading: 0, instagram: 0,
  });

  useEffect(() => {
    async function load() {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const yesterdayStr = format(subDays(new Date(), 1), "yyyy-MM-dd");

      const safeJson = async (res: Response) => { try { return await res.json(); } catch { return {}; } };

      // Controlla se ieri è già stato compilato
      const yesterdayRes = await fetch(`/api/days/${yesterdayStr}`);
      const yesterdayData = await safeJson(yesterdayRes);
      const yesterdayFilled = !!yesterdayData.day;

      // Se ieri non è ancora compilato, la giornata da mostrare resta quella di ieri
      const dateToFill = yesterdayFilled ? todayStr : yesterdayStr;
      setEffectiveDate(dateToFill);
      setWaitingForNewDay(false);

      const [dayRes, sportsRes, settingsRes, statsRes] = await Promise.all([
        fetch(`/api/days/${dateToFill}`),
        fetch("/api/sports"),
        fetch("/api/settings"),
        fetch("/api/stats"),
      ]);

      const [dayData, sportsData, settingsData, statsData] = await Promise.all([
        safeJson(dayRes), safeJson(sportsRes), safeJson(settingsRes), safeJson(statsRes),
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

  function handleSaved(savedDay: DayRecord) {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    setDay(savedDay);
    // Se abbiamo appena compilato un giorno che NON è oggi, mostra l'attesa
    if (effectiveDate && effectiveDate !== todayStr) {
      setWaitingForNewDay(true);
    }
  }

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const quote = QUOTES[dayOfYear % QUOTES.length];

  if (loading || !settings || !effectiveDate) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (waitingForNewDay) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center animate-fade-in">
        <div className="relative mb-6">
          <div className="absolute inset-0 animate-ping rounded-full bg-indigo-500/20" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-indigo-500/15 border border-indigo-500/30">
            <Clock className="h-9 w-9 text-indigo-400" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Giornata salvata! 🎉</h1>
        <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">
          Ottimo lavoro! La prossima giornata sarà disponibile automaticamente domani, quando si aggiornerà la data.
        </p>
        <p className="text-xs text-zinc-600 mt-4">
          Puoi modificare quanto inserito dalla sezione <span className="text-indigo-400">Cronologia</span>.
        </p>
      </div>
    );
  }

  const isToday = effectiveDate === format(new Date(), "yyyy-MM-dd");
  const displayDate = format(parseISO(effectiveDate), "EEEE d MMMM", { locale: it });

  return (
    <div className="animate-fade-in w-full max-w-full overflow-x-hidden">
      <div className="px-5 pt-[max(env(safe-area-inset-top),1.5rem)] pb-4 border-b border-white/6 min-w-0">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">DayTracker</p>
            <h1 className="text-2xl font-bold text-white capitalize leading-tight truncate">
              {format(parseISO(effectiveDate), "EEEE", { locale: it })}
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5 capitalize truncate">{displayDate}</p>
            {!isToday && (
              <p className="text-[11px] text-amber-400 mt-1">Giornata di ieri ancora da completare</p>
            )}
          </div>
          {streak > 0 && (
            <div className="flex flex-shrink-0 flex-col items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 px-3 py-2 min-w-[56px]">
              <span className="text-xl leading-none">🔥</span>
              <span className="text-lg font-bold text-orange-300 leading-tight">{streak}</span>
              <span className="text-[9px] font-semibold uppercase tracking-wide text-orange-500/70">streak</span>
            </div>
          )}
        </div>
        <div className="mt-4 rounded-xl border border-white/6 bg-white/3 px-4 py-3 min-w-0">
          <p className="text-xs text-zinc-400 italic leading-relaxed break-words">&ldquo;{quote}&rdquo;</p>
        </div>
      </div>

      <DayForm date={effectiveDate} initialDay={day} sports={sports} settings={settings} habitStreaks={habitStreaks} onSaved={handleSaved} />
    </div>
  );
}
