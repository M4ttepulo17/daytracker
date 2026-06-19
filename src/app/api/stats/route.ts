import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  format, subDays, isSameDay,
} from "date-fns";

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
function round1(n: number | null): number | null {
  return n === null ? null : Math.round(n * 10) / 10;
}

function getDateStr(d: any): string {
  return d.date instanceof Date
    ? d.date.toISOString().slice(0, 10)
    : String(d.date).slice(0, 10);
}

function calcHabitStreak(days: any[], check: (d: any) => boolean): number {
  const now = new Date();
  const dateMap = new Map<string, boolean>();
  for (const d of days) dateMap.set(getDateStr(d), check(d));

  let cursor = now;
  if (!dateMap.has(format(now, "yyyy-MM-dd"))) cursor = subDays(now, 1);

  let streak = 0;
  while (true) {
    const key = format(cursor, "yyyy-MM-dd");
    if (!dateMap.has(key) || !dateMap.get(key)) break;
    streak++;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const userId = session.user.id;

  const allDays = await prisma.day.findMany({
    where: { userId },
    include: { sport: true },
    orderBy: { date: "asc" },
  });

  // Recupera le impostazioni per i target
  const settings = await prisma.settings.findUnique({ where: { userId } });
  const sleepTarget = settings?.sleepTargetHours ?? 8;
  const instagramMax = settings?.instagramMaxMinutes ?? 30;

  const now = new Date();
  const getDate = (d: any): Date =>
    d.date instanceof Date ? d.date : new Date(d.date);

  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const inRange = (d: Date, s: Date, e: Date) => d >= s && d <= e;
  const weekDays = allDays.filter((d) => inRange(getDate(d), weekStart, weekEnd));
  const monthDays = allDays.filter((d) => inRange(getDate(d), monthStart, monthEnd));

  function summarize(days: typeof allDays) {
    return {
      count: days.length,
      avgSleepHours: round1(avg(days.map((d) => d.sleepHours + (d.sleepMinutes || 0) / 60))),
      avgPagesRead: round1(avg(days.map((d) => d.pagesRead))),
      avgStudyMinutes: round1(avg(days.map((d) => d.studyMinutes))),
      avgInstagramMinutes: round1(avg(days.map((d) => d.instagramMinutes))),
      avgDayRating: round1(avg(days.map((d) => d.dayRating))),
      avgWorkoutRating: round1(avg(
        days.filter((d) => d.workoutRating !== null).map((d) => d.workoutRating as number)
      )),
    };
  }

  const totalDays = allDays.length || 1;
  const habits = {
    prayer: Math.round((allDays.filter((d) => d.prayer).length / totalDays) * 100),
    study: Math.round((allDays.filter((d) => d.studyMinutes > 0).length / totalDays) * 100),
    music: Math.round((allDays.filter((d) => d.musicPlayed).length / totalDays) * 100),
    economicProject: Math.round((allDays.filter((d) => d.economicProject).length / totalDays) * 100),
  };

  const habitStreaks = {
    prayer: calcHabitStreak(allDays, (d) => d.prayer),
    music: calcHabitStreak(allDays, (d) => d.musicPlayed),
    study: calcHabitStreak(allDays, (d) => d.studyMinutes > 0),
    economicProject: calcHabitStreak(allDays, (d) => d.economicProject),
    workout: calcHabitStreak(allDays, (d) => !!d.sportId),
    // Streak sonno: giorni consecutivi con sonno >= target
    sleep: calcHabitStreak(allDays, (d) => (d.sleepHours + (d.sleepMinutes || 0) / 60) >= sleepTarget),
    // Streak lettura: pagine >= target impostato
    reading: calcHabitStreak(allDays, (d) => d.pagesRead >= (settings?.pagesTarget ?? 1)),
    // Streak instagram: sotto il limite
    instagram: calcHabitStreak(allDays, (d) => d.instagramMinutes <= instagramMax),
  };

  const trend = allDays
    .filter((d) => getDate(d) >= subDays(now, 30))
    .map((d) => ({
      date: getDate(d).toISOString().slice(0, 10),
      sleepHours: d.sleepHours + (d.sleepMinutes || 0) / 60,
      pagesRead: d.pagesRead,
      studyMinutes: d.studyMinutes,
      instagramMinutes: d.instagramMinutes,
      dayRating: d.dayRating,
      workoutRating: d.workoutRating,
    }));

  const sportMap = new Map<string, { count: number; ratings: number[] }>();
  for (const d of allDays) {
    if (!d.sport) continue;
    const key = d.sport.name;
    if (!sportMap.has(key)) sportMap.set(key, { count: 0, ratings: [] });
    const e = sportMap.get(key)!;
    e.count++;
    if (d.workoutRating !== null) e.ratings.push(d.workoutRating);
  }
  const totalWorkouts = allDays.filter((d) => d.sportId).length || 1;
  const sports = Array.from(sportMap.entries()).map(([name, v]) => ({
    name, count: v.count,
    percentage: Math.round((v.count / totalWorkouts) * 100),
    avgRating: round1(avg(v.ratings)),
  }));

  let bestDay: { date: string; dayRating: number } | null = null;
  for (const d of allDays) {
    if (!bestDay || d.dayRating > bestDay.dayRating)
      bestDay = { date: getDate(d).toISOString().slice(0, 10), dayRating: d.dayRating };
  }

  const weekBuckets = new Map<string, number[]>();
  const monthBuckets = new Map<string, number[]>();
  for (const d of allDays) {
    const wKey = format(startOfWeek(getDate(d), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const mKey = format(startOfMonth(getDate(d)), "yyyy-MM");
    if (!weekBuckets.has(wKey)) weekBuckets.set(wKey, []);
    if (!monthBuckets.has(mKey)) monthBuckets.set(mKey, []);
    weekBuckets.get(wKey)!.push(d.dayRating);
    monthBuckets.get(mKey)!.push(d.dayRating);
  }

  let bestWeek: { weekStart: string; avgRating: number } | null = null;
  for (const [key, ratings] of weekBuckets) {
    const a = avg(ratings)!;
    if (!bestWeek || a > bestWeek.avgRating) bestWeek = { weekStart: key, avgRating: round1(a)! };
  }
  let bestMonth: { month: string; avgRating: number } | null = null;
  for (const [key, ratings] of monthBuckets) {
    const a = avg(ratings)!;
    if (!bestMonth || a > bestMonth.avgRating) bestMonth = { month: key, avgRating: round1(a)! };
  }

  const dateSet = new Set(allDays.map((d) => getDate(d).toISOString().slice(0, 10)));
  let currentStreak = 0;
  let cursor = now;
  if (!dateSet.has(format(now, "yyyy-MM-dd"))) cursor = subDays(now, 1);
  while (dateSet.has(format(cursor, "yyyy-MM-dd"))) {
    currentStreak++;
    cursor = subDays(cursor, 1);
  }

  let longestStreak = 0, running = 0;
  let prevDate: Date | null = null;
  for (const d of allDays) {
    const cur = getDate(d);
    if (prevDate && isSameDay(subDays(cur, 1), prevDate)) running++;
    else running = 1;
    longestStreak = Math.max(longestStreak, running);
    prevDate = cur;
  }

  return NextResponse.json({
    weekly: summarize(weekDays),
    monthly: summarize(monthDays),
    habits,
    habitStreaks,
    trend,
    sports,
    records: {
      bestDay, bestWeek, bestMonth,
      overallAvgRating: round1(avg(allDays.map((d) => d.dayRating))),
    },
    streak: { current: currentStreak, longest: longestStreak },
  });
}
