// ============================================================
// API /api/sports/[id]
// PATCH  -> rinomina sport
// DELETE -> archivia sport (soft delete, preserva storico)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sportSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = sportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Nome non valido" }, { status: 400 });
  }

  const sport = await prisma.sport.updateMany({
    where: { id: params.id, userId: session.user.id },
    data: { name: parsed.data.name.trim() },
  });

  if (sport.count === 0) {
    return NextResponse.json({ error: "Sport non trovato" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  // Soft delete: l'attivita' viene archiviata, non eliminata,
  // per non perdere il riferimento nelle giornate storiche.
  const result = await prisma.sport.updateMany({
    where: { id: params.id, userId: session.user.id },
    data: { archived: true },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Sport non trovato" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
