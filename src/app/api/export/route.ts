// ============================================================
// API /api/export?format=json|csv
// Esporta tutte le giornate dell'utente per backup
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "json";

  const days = await prisma.day.findMany({
    where: { userId: session.user.id },
    include: { sport: true },
    orderBy: { date: "asc" },
  });

  const settings = await prisma.settings.findUnique({
    where: { userId: session.user.id },
  });

  const sports = await prisma.sport.findMany({
    where: { userId: session.user.id },
  });

  if (format === "csv") {
    const headers = [
      "data",
      "descrizione",
      "ore_sonno",
      "pagine_lette",
      "minuti_instagram",
      "preghiera",
      "sport",
      "voto_allenamento",
      "musica",
      "minuti_studio",
      "progetto_economico",
      "note_progetto",
      "voto_giornata",
    ];

    const rows = days.map((d) => {
      const date = d.date.toISOString().slice(0, 10);
      const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
      return [
        date,
        escape(d.description),
        d.sleepHours,
        d.pagesRead,
        d.instagramMinutes,
        d.prayer ? "si" : "no",
        d.sport?.name ?? "",
        d.workoutRating ?? "",
        d.musicPlayed ? "si" : "no",
        d.studyMinutes,
        d.economicProject ? "si" : "no",
        d.economicNotes ? escape(d.economicNotes) : "",
        d.dayRating,
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="daytracker-export-${new Date()
          .toISOString()
          .slice(0, 10)}.csv"`,
      },
    });
  }

  // Formato JSON completo, utilizzabile per ripristino
  const exportData = {
    exportedAt: new Date().toISOString(),
    settings: settings
      ? {
          sleepTargetHours: settings.sleepTargetHours,
          pagesTarget: settings.pagesTarget,
          studyTargetMinutes: settings.studyTargetMinutes,
          instagramMaxMinutes: settings.instagramMaxMinutes,
          minWords: settings.minWords,
          theme: settings.theme,
        }
      : null,
    sports: sports.map((s) => ({
      name: s.name,
      isDefault: s.isDefault,
      archived: s.archived,
    })),
    days: days.map((d) => ({
      date: d.date.toISOString().slice(0, 10),
      description: d.description,
      sleepHours: d.sleepHours,
      pagesRead: d.pagesRead,
      instagramMinutes: d.instagramMinutes,
      prayer: d.prayer,
      sport: d.sport?.name ?? null,
      workoutRating: d.workoutRating,
      musicPlayed: d.musicPlayed,
      studyMinutes: d.studyMinutes,
      economicProject: d.economicProject,
      economicNotes: d.economicNotes,
      dayRating: d.dayRating,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    })),
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="daytracker-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json"`,
    },
  });
}
