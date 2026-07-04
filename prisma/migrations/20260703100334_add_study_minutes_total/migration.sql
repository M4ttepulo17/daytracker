/*
  Warnings:

  - You are about to drop the column `sportId` on the `Day` table. All the data in the column will be lost.
  - You are about to drop the column `studyMinutesTotal` on the `Day` table. All the data in the column will be lost.
  - You are about to drop the column `workoutDuration` on the `Day` table. All the data in the column will be lost.
  - You are about to drop the column `workoutKm` on the `Day` table. All the data in the column will be lost.
  - You are about to drop the column `workoutRating` on the `Day` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Day" DROP CONSTRAINT "Day_sportId_fkey";

-- AlterTable
ALTER TABLE "Day" DROP COLUMN "sportId",
DROP COLUMN "studyMinutesTotal",
DROP COLUMN "workoutDuration",
DROP COLUMN "workoutKm",
DROP COLUMN "workoutRating",
ALTER COLUMN "studyMinutes" SET DEFAULT 0;
