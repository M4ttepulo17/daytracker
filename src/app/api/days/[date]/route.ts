import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parseDate(dateStr: string): Date {
  // Forza interpretazione come data locale a mezzanotte UTC
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export async function GET(
  req: NextRequest,
  { params }: { params: { date: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const dateObj = parseDate(params.date);

  const day = await prisma.day.findUnique({
    where: { userId_date: { userId: session.user.id, date: dateObj } },
    include: { sport: true },
  });

  return NextResponse.json({ day });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { date: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const dateObj = parseDate(params.date);

  // Usa deleteMany per evitare errori se il record non esiste
  const result = await prisma.day.deleteMany({
    where: { userId: session.user.id, date: dateObj },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Giornata non trovata" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
