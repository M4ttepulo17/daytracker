import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "json";

  const days = await prisma.day.findMany({
    where: { userId: session.user.id },
    include: { workouts: { include: { sport: true } }, studySessions: true },
    orderBy: { date: "asc" },
  });

  const settings = await prisma.settings.findUnique({ where: { userId: session.user.id } });
  const sports = await prisma.sport.findMany({ where: { userId: session.user.id } });

  if (format === "csv") {
    const headers = [
      "data", "descrizione", "ore_sonno", "minuti_sonno", "pagine_lette",
      "minuti_instagram", "preghiera", "sport", "voto_giornata", "musica",
      "minuti_studio_totali", "materie", "progetto_economico", "note_progetto",
    ];
    const rows = days.map((d) => {
      const date = d.date.toISOString().slice(0, 10);
      const esc = (val: string) => `"${val.replace(/"/g, '""')}"`;
      const sportNames = d.workouts.map((w) => w.sport.name).join("; ");
      const subjects = d.studySessions.map((s) => s.subject).filter(Boolean).join("; ");
      return [
        date, esc(d.description), d.sleepHours, d.sleepMinutes, d.pagesRead,
        d.instagramMinutes, d.prayer ? "si" : "no", esc(sportNames), d.dayRating,
        d.musicPlayed ? "si" : "no", d.studyMinutes, esc(subjects),
        d.economicProject ? "si" : "no", d.economicNotes ? esc(d.economicNotes) : "",
      ].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="daytracker-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  const exportData = {
    exportedAt: new Date().toISOString(),
    settings: settings ? {
      sleepTargetHours: settings.sleepTargetHours,
      pagesTarget: settings.pagesTarget,
      studyTargetMinutes: settings.studyTargetMinutes,
      instagramMaxMinutes: settings.instagramMaxMinutes,
      minWords: settings.minWords,
      theme: settings.theme,
    } : null,
    sports: sports.map((s) => ({ name: s.name, isDefault: s.isDefault, archived: s.archived })),
    days: days.map((d) => ({
      date: d.date.toISOString().slice(0, 10),
      description: d.description,
      sleepHours: d.sleepHours,
      sleepMinutes: d.sleepMinutes,
      pagesRead: d.pagesRead,
      instagramMinutes: d.instagramMinutes,
      prayer: d.prayer,
      workouts: d.workouts.map((w) => ({
        sport: w.sport.name, rating: w.rating, km: w.km, duration: w.duration,
      })),
      musicPlayed: d.musicPlayed,
      studyMinutes: d.studyMinutes,
      studySubjects: d.studySessions.map((s) => s.subject).filter(Boolean),
      economicProject: d.economicProject,
      economicNotes: d.economicNotes,
      dayRating: d.dayRating,
    })),
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="daytracker-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
