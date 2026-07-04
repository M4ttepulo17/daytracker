import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function serializeDay(d: any) {
  return { ...d, date: d.date instanceof Date ? d.date.toISOString().slice(0, 10) : d.date };
}

const dayInclude = { workouts: { include: { sport: true } }, studySessions: true };

export async function GET(req: NextRequest, { params }: { params: { date: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const dateObj = parseDate(params.date);
  const day = await prisma.day.findUnique({
    where: { userId_date: { userId: session.user.id, date: dateObj } },
    include: dayInclude,
  });

  return NextResponse.json({ day: day ? serializeDay(day) : null });
}

export async function DELETE(req: NextRequest, { params }: { params: { date: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const dateObj = parseDate(params.date);
  const result = await prisma.day.deleteMany({
    where: { userId: session.user.id, date: dateObj },
  });

  if (result.count === 0) return NextResponse.json({ error: "Giornata non trovata" }, { status: 404 });
  return NextResponse.json({ success: true });
}
