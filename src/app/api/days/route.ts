import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { daySchema, countWords } from "@/lib/validation";

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function serializeDay(d: any) {
  return {
    ...d,
    date: d.date instanceof Date ? d.date.toISOString().slice(0, 10) : d.date,
  };
}

const dayInclude = {
  workouts: { include: { sport: true } },
  studySessions: true,
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: { userId: string; date?: { gte?: Date; lte?: Date } } = { userId: session.user.id };
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = parseDate(from);
    if (to) where.date.lte = parseDate(to);
  }

  const days = await prisma.day.findMany({
    where,
    include: dayInclude,
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ days: days.map(serializeDay) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const body = await req.json();
  const parsed = daySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dati non validi", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const settings = await prisma.settings.findUnique({ where: { userId: session.user.id } });
  const minWords = settings?.minWords ?? 0;
  const wordCount = countWords(data.description);

  if (wordCount < minWords) {
    return NextResponse.json(
      { error: `La descrizione deve contenere almeno ${minWords} parole (attuali: ${wordCount}).` },
      { status: 400 }
    );
  }

  const dateObj = parseDate(data.date);
  const userId = session.user.id;

  const baseFields = {
    description: data.description,
    sleepHours: data.sleepHours,
    sleepMinutes: data.sleepMinutes,
    pagesRead: data.pagesRead,
    instagramMinutes: data.instagramMinutes,
    prayer: data.prayer,
    musicPlayed: data.musicPlayed,
    studyMinutes: data.studyMinutes,
    studySubject: data.studySubjects[0] ?? null,
    economicProject: data.economicProject,
    economicNotes: data.economicNotes ?? null,
    dayRating: data.dayRating,
  };

  // upsert del giorno
  const existing = await prisma.day.findUnique({
    where: { userId_date: { userId, date: dateObj } },
  });

  let dayId: string;
  if (existing) {
    await prisma.day.update({ where: { id: existing.id }, data: baseFields });
    dayId = existing.id;
    // ripulisci relazioni precedenti per ricrearle pulite
    await prisma.workout.deleteMany({ where: { dayId } });
    await prisma.studySession.deleteMany({ where: { dayId } });
  } else {
    const created = await prisma.day.create({
      data: { userId, date: dateObj, ...baseFields },
    });
    dayId = created.id;
  }

  // Crea allenamenti multipli
  if (data.workouts.length > 0) {
    await prisma.workout.createMany({
      data: data.workouts.map((w) => ({
        dayId,
        sportId: w.sportId,
        rating: w.rating ?? null,
        km: w.km ?? null,
        duration: w.duration ?? null,
      })),
    });
  }

  // Crea sessioni di studio multiple. Il tempo totale viene distribuito
  // ugualmente per materia solo a fini di archiviazione; il totale resta
  // in studyMinutes sul giorno.
  if (data.studySubjects.length > 0) {
    const perSubject = Math.floor(data.studyMinutes / data.studySubjects.length);
    await prisma.studySession.createMany({
      data: data.studySubjects.map((subject) => ({
        dayId,
        subject,
        minutes: perSubject,
      })),
    });
  }

  const day = await prisma.day.findUnique({ where: { id: dayId }, include: dayInclude });

  return NextResponse.json({ day: serializeDay(day) });
}
