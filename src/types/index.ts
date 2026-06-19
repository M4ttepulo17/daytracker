export interface Sport {
  id: string;
  name: string;
  isDefault: boolean;
  archived: boolean;
}

export interface DayRecord {
  id: string;
  date: string;
  description: string;
  sleepHours: number;
  sleepMinutes: number;
  pagesRead: number;
  instagramMinutes: number;
  prayer: boolean;
  sportId: string | null;
  sport: Sport | null;
  workoutRating: number | null;
  workoutKm: number | null;
  workoutDuration: number | null;
  musicPlayed: boolean;
  studyMinutes: number;
  studySubject: string | null;
  economicProject: boolean;
  economicNotes: string | null;
  dayRating: number;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  sleepTargetHours: number;
  pagesTarget: number;
  studyTargetMinutes: number;
  instagramMaxMinutes: number;
  minWords: number;
  theme: "light" | "dark" | "system";
}

export interface HabitStreaks {
  prayer: number;
  music: number;
  study: number;
  economicProject: number;
  workout: number;
  sleep: number;      // streak giorni con sonno >= target
  reading: number;    // streak giorni con almeno 1 pagina letta
  instagram: number;  // streak giorni con instagram <= limite
}

export interface WeeklyMonthlyStats {
  count: number;
  avgSleepHours: number | null;
  avgPagesRead: number | null;
  avgStudyMinutes: number | null;
  avgInstagramMinutes: number | null;
  avgDayRating: number | null;
  avgWorkoutRating: number | null;
}

export interface TrendPoint {
  date: string;
  sleepHours: number;
  pagesRead: number;
  studyMinutes: number;
  instagramMinutes: number;
  dayRating: number;
  workoutRating: number | null;
}

export interface SportStat {
  name: string;
  count: number;
  percentage: number;
  avgRating: number | null;
}

export interface StatsResponse {
  weekly: WeeklyMonthlyStats;
  monthly: WeeklyMonthlyStats;
  habits: {
    prayer: number;
    study: number;
    music: number;
    economicProject: number;
  };
  habitStreaks: HabitStreaks;
  trend: TrendPoint[];
  sports: SportStat[];
  records: {
    bestDay: { date: string; dayRating: number } | null;
    bestWeek: { weekStart: string; avgRating: number } | null;
    bestMonth: { month: string; avgRating: number } | null;
    overallAvgRating: number | null;
  };
  streak: {
    current: number;
    longest: number;
  };
}
