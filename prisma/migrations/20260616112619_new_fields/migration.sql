/*
  Warnings:

  - You are about to alter the column `sleepHours` on the `Day` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Day" ADD COLUMN     "sleepMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "workoutDuration" INTEGER,
ADD COLUMN     "workoutKm" DOUBLE PRECISION,
ALTER COLUMN "sleepHours" SET DATA TYPE INTEGER,
ALTER COLUMN "workoutRating" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "dayRating" SET DATA TYPE DOUBLE PRECISION;
