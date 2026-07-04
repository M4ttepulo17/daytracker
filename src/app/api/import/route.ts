import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface ImportWorkout { sport: string; rating: number | null; km: number | null; duration: number | null; }
interface ImportDay {
  date: string; description: string; sleepHours: number; sleepMinutes?: number;
  pagesRead: number; instagramMinutes: number; prayer: boolean;
  workouts?: ImportWorkout[]; sport?: string | null; workoutRating?: number | null;
  musicPlayed: boolean; studyMinutes?: number;
  studySubjects?: string[]; studySubject?: string | null;
  economicProject: boolean; economicNotes: string | null; dayRating: number;
}
interface ImportPayload {
  settings?: Record<string, unknown> | null;
  sports?: { name: string; isDefault?: boolean; archived?: boolean }[];
  days: ImportDay[];
}

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  let payload: ImportPayload;
  try { payload = await req.json(); } catch { return NextResponse.json({ error: "JSON non valido" }, { status: 400 }); }
  if (!Array.isArray(payload.days)) return NextResponse.json({ error: "Formato non valido" }, { status: 400 });

  const userId = session.user.id;

  if (payload.settings) {
    await prisma.settings.upsert({
      where: { userId },
      create: { userId, ...payload.settings },
      update: payload.settings,
    });
  }

  const sportMap = new Map<string, string>();
  if (payload.sports) {
    for (const s of payload.sports) {
      const sport = await prisma.sport.upsert({
        where: { userId_name: { userId, name: s.name } },
        create: { userId, name: s.name, isDefault: s.isDefault ?? false, archived: s.archived ?? false },
        update: { archived: s.archived ?? false },
      });
      sportMap.set(s.name, sport.id);
    }
  }
  const existingSports = await prisma.sport.findMany({ where: { userId } });
  for (const s of existingSports) if (!sportMap.has(s.name)) sportMap.set(s.name, s.id);

  async function getOrCreateSport(name: string): Promise<string> {
    if (sportMap.has(name)) return sportMap.get(name)!;
    const created = await prisma.sport.create({ data: { userId, name } });
    sportMap.set(name, created.id);
    return created.id;
  }

  let imported = 0;
  for (const d of payload.days) {
    const dateObj = parseDate(d.date);

    const studyMinutes = d.studyMinutes ?? 0;
    const studySubjects = d.studySubjects ?? (d.studySubject ? [d.studySubject] : []);
    const workouts: ImportWorkout[] = d.workouts ?? (d.sport ? [{ sport: d.sport, rating: d.workoutRating ?? null, km: null, duration: null }] : []);

    const baseFields = {
      description: d.description,
      sleepHours: d.sleepHours,
      sleepMinutes: d.sleepMinutes ?? 0,
      pagesRead: d.pagesRead,
      instagramMinutes: d.instagramMinutes,
      prayer: d.prayer,
      musicPlayed: d.musicPlayed,
      studyMinutes,
      studyMinutes: studyMinutes,
      studySubject: studySubjects[0] ?? null,
      economicProject: d.economicProject,
      economicNotes: d.economicNotes,
      dayRating: d.dayRating,
    };

    const existing = await prisma.day.findUnique({ where: { userId_date: { userId, date: dateObj } } });
    let dayId: string;
    if (existing) {
      await prisma.day.update({ where: { id: existing.id }, data: baseFields });
      dayId = existing.id;
      await prisma.workout.deleteMany({ where: { dayId } });
      await prisma.studySession.deleteMany({ where: { dayId } });
    } else {
      const created = await prisma.day.create({ data: { userId, date: dateObj, ...baseFields } });
      dayId = created.id;
    }

    for (const w of workouts) {
      const sportId = await getOrCreateSport(w.sport);
      await prisma.workout.create({
        data: { dayId, sportId, rating: w.rating, km: w.km, duration: w.duration },
      });
    }

    if (studySubjects.length > 0) {
      const per = Math.floor(studyMinutes / studySubjects.length);
      await prisma.studySession.createMany({
        data: studySubjects.map((subject) => ({ dayId, subject, minutes: per })),
      });
    }

    imported++;
  }

  return NextResponse.json({ success: true, imported });
}
