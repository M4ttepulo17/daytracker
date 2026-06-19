"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Card from "@/components/Card";
import { StatsResponse, Settings } from "@/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import {
  Moon,
  BookOpen,
  Instagram,
  GraduationCap,
  Star,
  Dumbbell,
  Flame,
  Trophy,
} from "lucide-react";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4"];

function StatRow({
  icon,
  label,
  value,
  target,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | null;
  target?: number;
  unit: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent dark:bg-accent-dark/10 dark:text-accent-dark">
          {icon}
        </div>
        <span className="text-sm text-zinc-600 dark:text-zinc-300">{label}</span>
      </div>
      <div className="text-right">
        <span className="text-sm font-semibold">
          {value !== null ? value : "—"} {unit}
        </span>
        {target !== undefined && (
          <p className="text-[11px] text-zinc-400">obiettivo: {target} {unit}</p>
        )}
      </div>
    </div>
  );
}

function HabitBar({ label, percentage }: { label: string; percentage: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-zinc-600 dark:text-zinc-300">{label}</span>
        <span className="font-semibold">{percentage}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500 dark:bg-accent-dark"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [statsRes, settingsRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/settings"),
      ]);
      setStats(await statsRes.json());
      setSettings((await settingsRes.json()).settings);
      setLoading(false);
    }
    load();
  }, []);

  if (loading || !stats || !settings) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  const trendData = stats.trend.map((t) => ({
    ...t,
    label: format(parseISO(t.date), "d/M"),
  }));

  return (
    <div className="animate-fade-in">
      <Header title="Statistiche" />
      <div className="space-y-4 px-4 pt-2">
        {/* Streak */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="flex flex-col items-center justify-center gap-1 text-center">
            <Flame className="h-6 w-6 text-orange-500" />
            <span className="text-2xl font-bold">{stats.streak.current}</span>
            <span className="text-xs text-zinc-400">streak attuale</span>
          </Card>
          <Card className="flex flex-col items-center justify-center gap-1 text-center">
            <Trophy className="h-6 w-6 text-amber-500" />
            <span className="text-2xl font-bold">{stats.streak.longest}</span>
            <span className="text-xs text-zinc-400">streak record</span>
          </Card>
        </div>

        {/* Statistiche settimanali */}
        <Card>
          <h2 className="mb-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Questa settimana
          </h2>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            <StatRow icon={<Moon className="h-4 w-4" />} label="Sonno medio" value={stats.weekly.avgSleepHours} target={settings.sleepTargetHours} unit="h" />
            <StatRow icon={<BookOpen className="h-4 w-4" />} label="Pagine medie" value={stats.weekly.avgPagesRead} target={settings.pagesTarget} unit="pag" />
            <StatRow icon={<GraduationCap className="h-4 w-4" />} label="Studio medio" value={stats.weekly.avgStudyMinutes} target={settings.studyTargetMinutes} unit="min" />
            <StatRow icon={<Instagram className="h-4 w-4" />} label="Instagram medio" value={stats.weekly.avgInstagramMinutes} target={settings.instagramMaxMinutes} unit="min" />
            <StatRow icon={<Star className="h-4 w-4" />} label="Voto giornata" value={stats.weekly.avgDayRating} unit="/10" />
            <StatRow icon={<Dumbbell className="h-4 w-4" />} label="Voto allenamento" value={stats.weekly.avgWorkoutRating} unit="/10" />
          </div>
        </Card>

        {/* Statistiche mensili */}
        <Card>
          <h2 className="mb-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Questo mese
          </h2>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            <StatRow icon={<Moon className="h-4 w-4" />} label="Sonno medio" value={stats.monthly.avgSleepHours} target={settings.sleepTargetHours} unit="h" />
            <StatRow icon={<BookOpen className="h-4 w-4" />} label="Pagine medie" value={stats.monthly.avgPagesRead} target={settings.pagesTarget} unit="pag" />
            <StatRow icon={<GraduationCap className="h-4 w-4" />} label="Studio medio" value={stats.monthly.avgStudyMinutes} target={settings.studyTargetMinutes} unit="min" />
            <StatRow icon={<Instagram className="h-4 w-4" />} label="Instagram medio" value={stats.monthly.avgInstagramMinutes} target={settings.instagramMaxMinutes} unit="min" />
            <StatRow icon={<Star className="h-4 w-4" />} label="Voto giornata" value={stats.monthly.avgDayRating} unit="/10" />
            <StatRow icon={<Dumbbell className="h-4 w-4" />} label="Voto allenamento" value={stats.monthly.avgWorkoutRating} unit="/10" />
          </div>
        </Card>

        {/* Abitudini */}
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Abitudini completate
          </h2>
          <HabitBar label="Preghiera" percentage={stats.habits.prayer} />
          <HabitBar label="Studio" percentage={stats.habits.study} />
          <HabitBar label="Musica" percentage={stats.habits.music} />
          <HabitBar label="Progetto economico" percentage={stats.habits.economicProject} />
        </Card>

        {/* Trend voto giornata e sonno */}
        {trendData.length > 1 && (
          <>
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Trend voto giornata (30 giorni)
              </h2>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-100 dark:text-zinc-800" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} stroke="#a1a1aa" width={24} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "none" }} />
                  <Line type="monotone" dataKey="dayRating" stroke="#6366f1" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Trend sonno (30 giorni)
              </h2>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-100 dark:text-zinc-800" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#a1a1aa" width={24} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "none" }} />
                  <Line type="monotone" dataKey="sleepHours" stroke="#10b981" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Trend studio e lettura (30 giorni)
              </h2>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-100 dark:text-zinc-800" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#a1a1aa" width={24} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "none" }} />
                  <Line type="monotone" dataKey="studyMinutes" name="Studio (min)" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="pagesRead" name="Pagine" stroke="#8b5cf6" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Trend Instagram (30 giorni)
              </h2>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-100 dark:text-zinc-800" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#a1a1aa" width={24} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "none" }} />
                  <Line type="monotone" dataKey="instagramMinutes" stroke="#ef4444" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </>
        )}

        {/* Sport */}
        {stats.sports.length > 0 && (
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Sport
            </h2>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie
                    data={stats.sports}
                    dataKey="count"
                    nameKey="name"
                    innerRadius={30}
                    outerRadius={55}
                    paddingAngle={2}
                  >
                    {stats.sports.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {stats.sports.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-zinc-600 dark:text-zinc-300">{s.name}</span>
                    </div>
                    <span className="text-zinc-400">
                      {s.count}x · {s.percentage}%
                      {s.avgRating !== null && ` · ${s.avgRating}/10`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Record */}
        <Card className="space-y-2">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Record
          </h2>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400">Media generale</span>
              <span className="font-semibold">
                {stats.records.overallAvgRating ?? "—"} /10
              </span>
            </div>
            {stats.records.bestDay && (
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Giorno migliore</span>
                <span className="font-semibold">
                  {format(parseISO(stats.records.bestDay.date), "d MMM yyyy", { locale: it })} ({stats.records.bestDay.dayRating}/10)
                </span>
              </div>
            )}
            {stats.records.bestWeek && (
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Settimana migliore</span>
                <span className="font-semibold">
                  {format(parseISO(stats.records.bestWeek.weekStart), "d MMM", { locale: it })} ({stats.records.bestWeek.avgRating}/10)
                </span>
              </div>
            )}
            {stats.records.bestMonth && (
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Mese migliore</span>
                <span className="font-semibold">
                  {stats.records.bestMonth.month} ({stats.records.bestMonth.avgRating}/10)
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
