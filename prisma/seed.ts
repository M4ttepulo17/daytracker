import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DEFAULT_SPORTS = ["Tennis", "Palestra", "Corsa", "Bici"];

async function main() {
  const email = process.env.SEED_EMAIL;
  const password = process.env.SEED_PASSWORD;
  if (!email || !password) throw new Error("Imposta SEED_EMAIL e SEED_PASSWORD nel .env");

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email, passwordHash,
      settings: { create: { sleepTargetHours: 8, pagesTarget: 20, studyTargetMinutes: 60, instagramMaxMinutes: 30, minWords: 20 } },
      sports: { create: DEFAULT_SPORTS.map((name) => ({ name, isDefault: true })) },
    },
  });
  console.log(`Utente pronto: ${user.email}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
