-- Aggiunge le tabelle Workout e StudySession per allenamenti e materie multiple
-- I campi legacy (studyMinutes, studySubject) restano sul Day per compatibilità,
-- nessun dato esistente viene eliminato.

CREATE TABLE "Workout" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "rating" DOUBLE PRECISION,
    "km" DOUBLE PRECISION,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Workout_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudySession" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "subject" TEXT,
    "minutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudySession_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Day" ADD COLUMN IF NOT EXISTS "studyMinutesTotal" INTEGER NOT NULL DEFAULT 0;

-- Migra i dati esistenti: copia studyMinutes/sport/workoutRating nelle nuove tabelle
UPDATE "Day" SET "studyMinutesTotal" = "studyMinutes" WHERE "studyMinutes" > 0;

INSERT INTO "Workout" ("id", "dayId", "sportId", "rating", "km", "duration", "createdAt")
SELECT gen_random_uuid()::text, "id", "sportId", "workoutRating", "workoutKm", "workoutDuration", CURRENT_TIMESTAMP
FROM "Day"
WHERE "sportId" IS NOT NULL;

INSERT INTO "StudySession" ("id", "dayId", "subject", "minutes", "createdAt")
SELECT gen_random_uuid()::text, "id", "studySubject", "studyMinutes", CURRENT_TIMESTAMP
FROM "Day"
WHERE "studySubject" IS NOT NULL AND "studyMinutes" > 0;

ALTER TABLE "Workout" ADD CONSTRAINT "Workout_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day"("id") ON DELETE CASCADE ON UPDATE CASCADE;
