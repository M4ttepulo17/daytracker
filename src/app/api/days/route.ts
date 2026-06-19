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

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: { userId: string; date?: { gte?: Date; lte?: Date } } = {
    userId: session.user.id,
  };
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = parseDate(from);
    if (to) where.date.lte = parseDate(to);
  }

  const days = await prisma.day.findMany({
    where,
    include: { sport: true },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ days: days.map(serializeDay) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const body = await req.json();
  const parsed = daySchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });

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

  const payload = {
    description: data.description,
    sleepHours: data.sleepHours,
    sleepMinutes: data.sleepMinutes,
    pagesRead: data.pagesRead,
    instagramMinutes: data.instagramMinutes,
    prayer: data.prayer,
    sportId: data.sportId ?? null,
    workoutRating: data.workoutRating ?? null,
    workoutKm: data.workoutKm ?? null,
    workoutDuration: data.workoutDuration ?? null,
    musicPlayed: data.musicPlayed,
    studyMinutes: data.studyMinutes,
    studySubject: data.studySubject ?? null,
    economicProject: data.economicProject,
    economicNotes: data.economicNotes ?? null,
    dayRating: data.dayRating,
  };

  const day = await prisma.day.upsert({
    where: { userId_date: { userId: session.user.id, date: dateObj } },
    create: { userId: session.user.id, date: dateObj, ...payload },
    update: payload,
    include: { sport: true },
  });

  return NextResponse.json({ day: serializeDay(day) });
}
