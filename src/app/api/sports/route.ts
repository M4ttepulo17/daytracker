// ============================================================
// API /api/sports
// GET    -> lista sport (non archiviati)
// POST   -> crea nuovo sport personalizzato
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sportSchema } from "@/lib/validation";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const sports = await prisma.sport.findMany({
    where: { userId: session.user.id, archived: false },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  return NextResponse.json({ sports });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = sportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Nome sport non valido" },
      { status: 400 }
    );
  }

  try {
    const sport = await prisma.sport.create({
      data: {
        userId: session.user.id,
        name: parsed.data.name.trim(),
      },
    });
    return NextResponse.json({ sport }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Esiste gia' uno sport con questo nome" },
      { status: 409 }
    );
  }
}
