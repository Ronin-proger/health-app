export type MuscleGroup = 'push' | 'pull' | 'legs' | 'core' | 'all';

export type HealthTab = 'home' | 'workouts' | 'progress' | 'profile';

export type WorkoutStatus = 'planned' | 'in_progress' | 'completed';

export type HealthStack =
  | { kind: 'workout'; workoutId: string }
  | { kind: 'live'; workoutId: string; sessionId: string; exerciseId?: string }
  | { kind: 'summary'; sessionId: string; xpEarned?: number }
  | { kind: 'add-workout' }
  | { kind: 'edit-workout'; workoutId: string }
  | { kind: 'catalog' }
  | { kind: 'exercise-view'; exerciseId: string; workoutId?: string };

export interface SetLogEntry {
  id: string;
  exerciseId: string;
  reps: number;
  weightKg: number;
  rpe?: number;
  loggedAt: string;
  workoutSessionId?: string;
}

export interface WorkoutRecord {
  id: string;
  workoutId: string;
  name: string;
  date: string;
  startedAt: string;
  endedAt: string;
  durationMin: number;
  caloriesEst: number;
  muscleGroups: MuscleGroup[];
  status: WorkoutStatus;
  notes?: string;
  totalSets: number;
}

/** @deprecated use WorkoutRecord — kept for migration */
export interface WorkoutSession {
  id: string;
  workoutId: string;
  startedAt: string;
  endedAt?: string;
  caloriesEst: number;
  durationMin: number;
}

export interface ExercisePrescription {
  exerciseId: string;
  sets: number;
  reps: string;
  weightKg: number;
  restSec: number;
  notes?: string;
}

export interface CustomWorkout {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  exerciseIds: string[];
  prescriptions?: ExercisePrescription[];
  description?: string;
  imageUrl?: string;
  coverUrl?: string;
  durationMin?: number;
  caloriesEst?: number;
}

export type BodySex = 'male' | 'female' | 'other' | 'unspecified';

export interface BodyProfile {
  heightCm: number;
  weightKg: number;
  age: number;
  sex: BodySex;
  bodyFatPct?: number;
  targetWeightKg?: number;
  /** Portrait / scan image URL */
  portraitUrl?: string;
}

export interface DailyLog {
  date: string;
  steps: number;
  waterMl: number;
  sleepHours: number;
}

export interface HabitTotals {
  stepsDaysLogged: number;
  waterDaysLogged: number;
  sleep8Days: number;
  totalSteps: number;
}

export interface NotificationPrefs {
  enabled: boolean;
  hour: number;
  minute: number;
  /** 0 = Sunday … 6 = Saturday */
  daysOfWeek: number[];
}

export interface FitnessLocalState {
  v: 2;
  workouts: WorkoutRecord[];
  setLogs: SetLogEntry[];
  customWorkouts: CustomWorkout[];
  notifications: NotificationPrefs;
  hrZoneMinutes: { z1: number; z2: number; z3: number; z4: number; z5: number };
  unlockedAchievementIds: string[];
  achievementTimestamps: Record<string, string>;
  corpusXp: number;
  corpusLevel: number;
  unlockedProgramIds: string[];
  updatedAt: string;
  demoSeeded?: boolean;
  demoSeedVersion?: number;
  habits?: HabitTotals;
  challengeJoinedAt?: string;
  inviteCode?: string;
  bodyProfile?: BodyProfile;
  dailyLog?: DailyLog;
  settings?: FitSettings;
  weightHistory?: WeightEntry[];
  notes?: NoteEntry[];
  progressPhotos?: ProgressPhoto[];
  /** last 14 days of quick-log values (date → log) */
  dailyHistory?: DailyLog[];
}

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface FitnessAchievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
  unlockedAt?: string;
  rarity: Rarity;
  xp: number;
}

export type UnitSystem = 'metric' | 'imperial';
export type FitTheme = 'midnight' | 'amoled' | 'graphite';

export interface FitSettings {
  units: UnitSystem;
  theme: FitTheme;
}

export interface WeightEntry {
  date: string;
  kg: number;
}

export interface NoteEntry {
  id: string;
  at: string;
  text: string;
}

export interface ProgressPhoto {
  id: string;
  at: string;
  /** downscaled data URL, kept local only */
  src: string;
  label?: string;
}

export interface FitnessSyncPayload {
  state: FitnessLocalState;
  achievements: FitnessAchievement[];
  corpusStreak: number;
}

export interface LiveWorkoutState {
  sessionId: string;
  workoutId: string;
  startedAt: number;
  notes: string;
  completedExerciseIds: string[];
}

