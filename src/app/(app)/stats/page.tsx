"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/Header";
import { StatsResponse, Settings } from "@/types";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import {
  Moon, BookOpen, Instagram, GraduationCap, Star, Dumbbell,
  Flame, Trophy, HandHeart, Music, DollarSign, ChevronLeft, ChevronRight,
} from "lucide-react";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4"];

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-white/8 bg-white/4 p-4 min-w-0 ${className}`}>{children}</div>;
}

function StatRow({ icon, label, value, target, unit }: {
  icon: React.ReactNode; label: string; value: number | null; target?: number; unit: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-2 min-w-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">{icon}</div>
        <span className="text-sm text-zinc-300 truncate">{label}</span>
      </div>
      <div className="text-right flex-shrink-0">
        <span className="text-sm font-semibold text-white">{value !== null ? value : "—"} {unit}</span>
        {target !== undefined && <p className="text-[11px] text-zinc-600">obiettivo: {target} {unit}</p>}
      </div>
    </div>
  );
}

function HabitCountRow({ icon, label, week, month, weekTotal, monthTotal }: {
  icon: React.ReactNode; label: string; week: number; month: number; weekTotal: number; monthTotal: number;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-2 min-w-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">{icon}</div>
        <span className="text-sm text-zinc-300 truncate">{label}</span>
      </div>
      <div className="text-right flex-shrink-0 text-xs text-zinc-500 space-y-0.5">
        <div><span className="font-semibold text-white">{week}</span>/{weekTotal} sett</div>
        <div><span className="font-semibold text-white">{month}</span>/{monthTotal} mese</div>
      </div>
    </div>
  );
}

function HabitBar({ label, percentage, icon }: { label: string; percentage: number; icon: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-indigo-400 flex-shrink-0">{icon}</span>
          <span className="text-zinc-300 truncate">{label}</span>
        </div>
        <span className="font-semibold text-white flex-shrink-0">{percentage}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
        <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function PeriodNav({ label, onPrev, onNext, canNext }: {
  label: string; onPrev: () => void; onNext: () => void; canNext: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 mb-3">
      <button onClick={onPrev} className="rounded-xl p-1.5 text-zinc-400 hover:bg-white/8 transition flex-shrink-0">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm font-semibold text-white truncate text-center">{label}</span>
      <button onClick={onNext} disabled={!canNext} className="rounded-xl p-1.5 text-zinc-400 hover:bg-white/8 transition flex-shrink-0 disabled:opacity-30">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);

  const loadStats = useCallback(async (wOff: number, mOff: number) => {
    const res = await fetch(`/api/stats?weekOffset=${wOff}&monthOffset=${mOff}`);
    setStats(await res.json());
  }, []);

  useEffect(() => {
    async function load() {
      const [settingsRes] = await Promise.all([fetch("/api/settings")]);
      setSettings((await settingsRes.json()).settings);
      await loadStats(0, 0);
      setLoading(false);
    }
    load();
  }, [loadStats]);

  function changeWeek(delta: number) {
    const next = weekOffset + delta;
    if (next > 0) return;
    setWeekOffset(next);
    loadStats(next, monthOffset);
  }

  function changeMonth(delta: number) {
    const next = monthOffset + delta;
    if (next > 0) return;
    setMonthOffset(next);
    loadStats(weekOffset, next);
  }

  if (loading || !stats || !settings) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const trendData = stats.trend.map((t) => ({ ...t, label: format(parseISO(t.date), "d/M") }));
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const weekTotal = 7;
  const monthTotal = Math.abs(monthOffset) === 0 ? daysInMonth : 30;

  return (
    <div className="animate-fade-in w-full max-w-full overflow-x-hidden">
      <Header title="Statistiche" />
      <div className="space-y-4 px-4 pt-2 pb-4 min-w-0">

        {/* Streak */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="flex flex-col items-center justify-center gap-1 text-center">
            <Flame className="h-6 w-6 text-orange-500" />
            <span className="text-2xl font-bold text-white">{stats.streak.current}</span>
            <span className="text-xs text-zinc-500">streak attuale</span>
          </Card>
          <Card className="flex flex-col items-center justify-center gap-1 text-center">
            <Trophy className="h-6 w-6 text-amber-500" />
            <span className="text-2xl font-bold text-white">{stats.streak.longest}</span>
            <span className="text-xs text-zinc-500">streak record</span>
          </Card>
        </div>

        {/* Medie settimanali con navigazione */}
        <Card>
          <PeriodNav
            label={stats.weekLabel ?? "Questa settimana"}
            onPrev={() => changeWeek(-1)}
            onNext={() => changeWeek(1)}
            canNext={weekOffset < 0}
          />
          <div className="divide-y divide-white/6">
            <StatRow icon={<Moon className="h-4 w-4" />} label="Sonno medio" value={stats.weekly.avgSleepHours} target={settings.sleepTargetHours} unit="h" />
            <StatRow icon={<BookOpen className="h-4 w-4" />} label="Pagine medie" value={stats.weekly.avgPagesRead} target={settings.pagesTarget} unit="pag" />
            <StatRow icon={<GraduationCap className="h-4 w-4" />} label="Studio medio" value={stats.weekly.avgStudyMinutes} target={settings.studyTargetMinutes} unit="min" />
            <StatRow icon={<Instagram className="h-4 w-4" />} label="Instagram medio" value={stats.weekly.avgInstagramMinutes} target={settings.instagramMaxMinutes} unit="min" />
            <StatRow icon={<Star className="h-4 w-4" />} label="Voto giornata" value={stats.weekly.avgDayRating} unit="/10" />
            <StatRow icon={<Dumbbell className="h-4 w-4" />} label="Voto allenamento" value={stats.weekly.avgWorkoutRating} unit="/10" />
          </div>
        </Card>

        {/* Medie mensili con navigazione */}
        <Card>
          <PeriodNav
            label={stats.monthLabel ?? "Questo mese"}
            onPrev={() => changeMonth(-1)}
            onNext={() => changeMonth(1)}
            canNext={monthOffset < 0}
          />
          <div className="divide-y divide-white/6">
            <StatRow icon={<Moon className="h-4 w-4" />} label="Sonno medio" value={stats.monthly.avgSleepHours} target={settings.sleepTargetHours} unit="h" />
            <StatRow icon={<BookOpen className="h-4 w-4" />} label="Pagine medie" value={stats.monthly.avgPagesRead} target={settings.pagesTarget} unit="pag" />
            <StatRow icon={<GraduationCap className="h-4 w-4" />} label="Studio medio" value={stats.monthly.avgStudyMinutes} target={settings.studyTargetMinutes} unit="min" />
            <StatRow icon={<Instagram className="h-4 w-4" />} label="Instagram medio" value={stats.monthly.avgInstagramMinutes} target={settings.instagramMaxMinutes} unit="min" />
            <StatRow icon={<Star className="h-4 w-4" />} label="Voto giornata" value={stats.monthly.avgDayRating} unit="/10" />
            <StatRow icon={<Dumbbell className="h-4 w-4" />} label="Voto allenamento" value={stats.monthly.avgWorkoutRating} unit="/10" />
          </div>
        </Card>

        {/* Giorni completati per abitudine con navigazione settimana/mese */}
        <Card>
          <h2 className="mb-1 text-sm font-semibold text-white">Giorni completati per abitudine</h2>
          <p className="text-xs text-zinc-600 mb-3">Usa le frecce nelle sezioni sopra per cambiare periodo</p>
          <div className="divide-y divide-white/6">
            <HabitCountRow icon={<Moon className="h-4 w-4" />} label="Sonno (target)" week={stats.habitCounts.sleep.week} month={stats.habitCounts.sleep.month} weekTotal={weekTotal} monthTotal={monthTotal} />
            <HabitCountRow icon={<BookOpen className="h-4 w-4" />} label="Lettura (target)" week={stats.habitCounts.reading.week} month={stats.habitCounts.reading.month} weekTotal={weekTotal} monthTotal={monthTotal} />
            <HabitCountRow icon={<Instagram className="h-4 w-4" />} label="Instagram (limite)" week={stats.habitCounts.instagram.week} month={stats.habitCounts.instagram.month} weekTotal={weekTotal} monthTotal={monthTotal} />
            <HabitCountRow icon={<HandHeart className="h-4 w-4" />} label="Preghiera" week={stats.habitCounts.prayer.week} month={stats.habitCounts.prayer.month} weekTotal={weekTotal} monthTotal={monthTotal} />
            <HabitCountRow icon={<Dumbbell className="h-4 w-4" />} label="Allenamento" week={stats.habitCounts.workout.week} month={stats.habitCounts.workout.month} weekTotal={weekTotal} monthTotal={monthTotal} />
            <HabitCountRow icon={<Music className="h-4 w-4" />} label="Musica" week={stats.habitCounts.music.week} month={stats.habitCounts.music.month} weekTotal={weekTotal} monthTotal={monthTotal} />
            <HabitCountRow icon={<GraduationCap className="h-4 w-4" />} label="Studio" week={stats.habitCounts.study.week} month={stats.habitCounts.study.month} weekTotal={weekTotal} monthTotal={monthTotal} />
            <HabitCountRow icon={<DollarSign className="h-4 w-4" />} label="Progetto economico" week={stats.habitCounts.economicProject.week} month={stats.habitCounts.economicProject.month} weekTotal={weekTotal} monthTotal={monthTotal} />
          </div>
        </Card>

        {/* Abitudini storico totale - TUTTE le abitudini */}
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-white">Abitudini completate (storico totale)</h2>
          <HabitBar label="Sonno (target raggiunto)" percentage={stats.habits.sleep} icon={<Moon className="h-3.5 w-3.5" />} />
          <HabitBar label="Lettura (target raggiunto)" percentage={stats.habits.reading} icon={<BookOpen className="h-3.5 w-3.5" />} />
          <HabitBar label="Instagram (sotto limite)" percentage={stats.habits.instagram} icon={<Instagram className="h-3.5 w-3.5" />} />
          <HabitBar label="Preghiera" percentage={stats.habits.prayer} icon={<HandHeart className="h-3.5 w-3.5" />} />
          <HabitBar label="Allenamento" percentage={stats.habits.workout} icon={<Dumbbell className="h-3.5 w-3.5" />} />
          <HabitBar label="Musica" percentage={stats.habits.music} icon={<Music className="h-3.5 w-3.5" />} />
          <HabitBar label="Studio" percentage={stats.habits.study} icon={<GraduationCap className="h-3.5 w-3.5" />} />
          <HabitBar label="Progetto economico" percentage={stats.habits.economicProject} icon={<DollarSign className="h-3.5 w-3.5" />} />
        </Card>

        {/* Trend grafici */}
        {trendData.length > 1 && (
          <>
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-white">Trend voto giornata (30 giorni)</h2>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={trendData} margin={{ left: -20, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#71717a" />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} stroke="#71717a" width={24} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "none", background: "#18181b" }} />
                  <Line type="monotone" dataKey="dayRating" stroke="#6366f1" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-white">Trend sonno (30 giorni)</h2>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={trendData} margin={{ left: -20, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#71717a" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#71717a" width={24} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "none", background: "#18181b" }} />
                  <Line type="monotone" dataKey="sleepHours" stroke="#10b981" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-white">Trend studio e lettura (30 giorni)</h2>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={trendData} margin={{ left: -20, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#71717a" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#71717a" width={24} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "none", background: "#18181b" }} />
                  <Line type="monotone" dataKey="studyMinutes" name="Studio (min)" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="pagesRead" name="Pagine" stroke="#8b5cf6" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-white">Trend Instagram (30 giorni)</h2>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={trendData} margin={{ left: -20, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#71717a" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#71717a" width={24} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "none", background: "#18181b" }} />
                  <Line type="monotone" dataKey="instagramMinutes" stroke="#ef4444" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </>
        )}

        {/* Sport */}
        {stats.sports.length > 0 && (
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-white">Sport</h2>
            <div className="flex items-center gap-4 min-w-0">
              <ResponsiveContainer width={110} height={110} className="flex-shrink-0">
                <PieChart>
                  <Pie data={stats.sports} dataKey="count" nameKey="name" innerRadius={28} outerRadius={50} paddingAngle={2}>
                    {stats.sports.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 min-w-0 space-y-2">
                {stats.sports.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between gap-2 text-xs min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-zinc-300 truncate">{s.name}</span>
                    </div>
                    <span className="text-zinc-500 flex-shrink-0">{s.count}x{s.avgRating !== null && ` · ${s.avgRating}/10`}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Record */}
        <Card className="space-y-2">
          <h2 className="text-sm font-semibold text-white">Record</h2>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between gap-2"><span className="text-zinc-500">Media generale</span><span className="font-semibold text-white">{stats.records.overallAvgRating ?? "—"} /10</span></div>
            {stats.records.bestDay && <div className="flex justify-between gap-2 min-w-0"><span className="text-zinc-500 flex-shrink-0">Giorno migliore</span><span className="font-semibold text-white text-right">{format(parseISO(stats.records.bestDay.date), "d MMM yyyy", { locale: it })} ({stats.records.bestDay.dayRating}/10)</span></div>}
            {stats.records.bestWeek && <div className="flex justify-between gap-2 min-w-0"><span className="text-zinc-500 flex-shrink-0">Settimana migliore</span><span className="font-semibold text-white text-right">{format(parseISO(stats.records.bestWeek.weekStart), "d MMM", { locale: it })} ({stats.records.bestWeek.avgRating}/10)</span></div>}
            {stats.records.bestMonth && <div className="flex justify-between gap-2 min-w-0"><span className="text-zinc-500 flex-shrink-0">Mese migliore</span><span className="font-semibold text-white text-right">{stats.records.bestMonth.month} ({stats.records.bestMonth.avgRating}/10)</span></div>}
          </div>
        </Card>
      </div>
    </div>
  );
}
