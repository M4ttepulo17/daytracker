// ============================================================
// API /api/import
// POST -> ripristina un backup JSON precedentemente esportato
// Effettua upsert: i giorni esistenti vengono sovrascritti,
// nessun dato viene perso.
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface ImportDay {
  date: string;
  description: string;
  sleepHours: number;
  pagesRead: number;
  instagramMinutes: number;
  prayer: boolean;
  sport: string | null;
  workoutRating: number | null;
  musicPlayed: boolean;
  studyMinutes: number;
  economicProject: boolean;
  economicNotes: string | null;
  dayRating: number;
}

interface ImportPayload {
  settings?: {
    sleepTargetHours?: number;
    pagesTarget?: number;
    studyTargetMinutes?: number;
    instagramMaxMinutes?: number;
    minWords?: number;
    theme?: string;
  } | null;
  sports?: { name: string; isDefault?: boolean; archived?: boolean }[];
  days: ImportDay[];
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  let payload: ImportPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON non valido" }, { status: 400 });
  }

  if (!Array.isArray(payload.days)) {
    return NextResponse.json(
      { error: "Formato di backup non valido: campo 'days' mancante" },
      { status: 400 }
    );
  }

  const userId = session.user.id;

  // 1. Ripristina impostazioni
  if (payload.settings) {
    await prisma.settings.upsert({
      where: { userId },
      create: { userId, ...payload.settings },
      update: payload.settings,
    });
  }

  // 2. Ripristina sport (crea se non esistono)
  const sportMap = new Map<string, string>(); // name -> id
  if (payload.sports) {
    for (const s of payload.sports) {
      const sport = await prisma.sport.upsert({
        where: { userId_name: { userId, name: s.name } },
        create: {
          userId,
          name: s.name,
          isDefault: s.isDefault ?? false,
          archived: s.archived ?? false,
        },
        update: {
          archived: s.archived ?? false,
        },
      });
      sportMap.set(s.name, sport.id);
    }
  }

  // Recupera anche gli sport esistenti non presenti nel payload sports
  const existingSports = await prisma.sport.findMany({ where: { userId } });
  for (const s of existingSports) {
    if (!sportMap.has(s.name)) sportMap.set(s.name, s.id);
  }

  // 3. Ripristina giorni (upsert per data)
  let imported = 0;
  for (const d of payload.days) {
    const dateObj = new Date(d.date + "T00:00:00.000Z");
    let sportId: string | null = null;

    if (d.sport) {
      sportId = sportMap.get(d.sport) ?? null;
      if (!sportId) {
        const newSport = await prisma.sport.create({
          data: { userId, name: d.sport },
        });
        sportId = newSport.id;
        sportMap.set(d.sport, newSport.id);
      }
    }

    await prisma.day.upsert({
      where: { userId_date: { userId, date: dateObj } },
      create: {
        userId,
        date: dateObj,
        description: d.description,
        sleepHours: d.sleepHours,
        pagesRead: d.pagesRead,
        instagramMinutes: d.instagramMinutes,
        prayer: d.prayer,
        sportId,
        workoutRating: d.workoutRating,
        musicPlayed: d.musicPlayed,
        studyMinutes: d.studyMinutes,
        economicProject: d.economicProject,
        economicNotes: d.economicNotes,
        dayRating: d.dayRating,
      },
      update: {
        description: d.description,
        sleepHours: d.sleepHours,
        pagesRead: d.pagesRead,
        instagramMinutes: d.instagramMinutes,
        prayer: d.prayer,
        sportId,
        workoutRating: d.workoutRating,
        musicPlayed: d.musicPlayed,
        studyMinutes: d.studyMinutes,
        economicProject: d.economicProject,
        economicNotes: d.economicNotes,
        dayRating: d.dayRating,
      },
    });
    imported++;
  }

  return NextResponse.json({ success: true, imported });
}
