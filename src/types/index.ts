export interface Sport {
  id: string;
  name: string;
  isDefault: boolean;
  archived: boolean;
}

export interface Workout {
  id: string;
  sportId: string;
  sport: Sport;
  rating: number | null;
  km: number | null;
  duration: number | null;
}

export interface StudySession {
  id: string;
  subject: string | null;
  minutes: number;
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
  workouts: Workout[];
  musicPlayed: boolean;
  studySessions: StudySession[];
  studyMinutes: number;
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
  sleep: number;
  reading: number;
  instagram: number;
}

export interface HabitWeeklyMonthly {
  prayer: { week: number; month: number };
  music: { week: number; month: number };
  study: { week: number; month: number };
  economicProject: { week: number; month: number };
  workout: { week: number; month: number };
  sleep: { week: number; month: number };
  reading: { week: number; month: number };
  instagram: { week: number; month: number };
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
  habits: { prayer: number; study: number; music: number; economicProject: number };
  habitStreaks: HabitStreaks;
  habitCounts: HabitWeeklyMonthly;
  trend: TrendPoint[];
  sports: SportStat[];
  records: {
    bestDay: { date: string; dayRating: number } | null;
    bestWeek: { weekStart: string; avgRating: number } | null;
    bestMonth: { month: string; avgRating: number } | null;
    overallAvgRating: number | null;
  };
  streak: { current: number; longest: number };
  weekLabel?: string;
  monthLabel?: string;
  weekOffset?: number;
  monthOffset?: number;
}
