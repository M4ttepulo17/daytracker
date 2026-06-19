import { z } from "zod";

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

export const KM_SPORTS = ["corsa", "bici", "running", "ciclismo", "cycling"];

export function sportSupportsKm(sportName: string): boolean {
  return KM_SPORTS.some((s) => sportName.toLowerCase().includes(s));
}

export const STUDY_SUBJECTS = [
  "Italiano",
  "Inglese",
  "Storia",
  "Filosofia",
  "Arte",
  "Matematica",
  "Fisica",
  "Informatica",
  "Scienze",
  "Ed. Civica",
  "Scienze Motorie",
  "Altro",
];

export const daySchema = z.object({
  date: z.string(),
  description: z.string().min(1),
  sleepHours: z.number().int().min(0).max(24),
  sleepMinutes: z.number().int().min(0).max(59),
  pagesRead: z.number().int().min(0),
  instagramMinutes: z.number().int().min(0),
  prayer: z.boolean(),
  sportId: z.string().nullable().optional(),
  workoutRating: z.number().min(1).max(10).nullable().optional(),
  workoutKm: z.number().min(0).nullable().optional(),
  workoutDuration: z.number().int().min(0).nullable().optional(),
  musicPlayed: z.boolean(),
  studyMinutes: z.number().int().min(0),
  studySubject: z.string().nullable().optional(),
  economicProject: z.boolean(),
  economicNotes: z.string().nullable().optional(),
  dayRating: z.number().min(1).max(10),
});

export type DayInput = z.infer<typeof daySchema>;

export const settingsSchema = z.object({
  sleepTargetHours: z.number().min(0).max(24),
  pagesTarget: z.number().int().min(0),
  studyTargetMinutes: z.number().int().min(0),
  instagramMaxMinutes: z.number().int().min(0),
  minWords: z.number().int().min(0),
  theme: z.enum(["light", "dark", "system"]),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

export const sportSchema = z.object({
  name: z.string().min(1).max(50),
});
