import { getExercise } from './exerciseCatalog';
import { FitnessLocalState } from './types';
import { FitnessAchievement, Rarity } from './types';

type Def = {
  id: string;
  title: string;
  desc: string;
  icon: string;
  target: number;
  progress: (s: FitnessLocalState, streak: number, health?: { steps?: number; water?: number; sleep?: number }) => number;
};

function workoutCount(s: FitnessLocalState) {
  return s.workouts.filter((w) => w.status === 'completed').length;
}

function totalKcal(s: FitnessLocalState) {
  return s.workouts.reduce((a, w) => a + w.caloriesEst, 0);
}

function prExerciseCount(setLogs: FitnessLocalState['setLogs']) {
  const best = new Map<string, number>();
  for (const l of setLogs) {
    best.set(l.exerciseId, Math.max(best.get(l.exerciseId) ?? 0, l.weightKg));
  }
  return best.size;
}

export const ACHIEVEMENT_DEFS: Def[] = [
  { id: 'streak_7', title: '7-day streak', desc: 'Week of discipline', icon: 'flame', target: 7, progress: (_s, st) => st },
  { id: 'streak_30', title: '30-day streak', desc: 'Monthly habit', icon: 'flame', target: 30, progress: (_s, st) => st },
  { id: 'streak_100', title: '100-day streak', desc: 'Century of will', icon: 'flame', target: 100, progress: (_s, st) => st },
  { id: 'streak_365', title: '365-day streak', desc: 'Year of Corpus', icon: 'flame', target: 365, progress: (_s, st) => st },
  { id: 'workouts_10', title: '10 workouts', desc: 'Getting started', icon: 'dumbbell', target: 10, progress: (s) => workoutCount(s) },
  { id: 'workouts_50', title: '50 workouts', desc: 'Committed', icon: 'dumbbell', target: 50, progress: (s) => workoutCount(s) },
  { id: 'workouts_100', title: '100 workouts', desc: 'Veteran', icon: 'dumbbell', target: 100, progress: (s) => workoutCount(s) },
  { id: 'workouts_500', title: '500 workouts', desc: 'Elite volume', icon: 'dumbbell', target: 500, progress: (s) => workoutCount(s) },
  { id: 'sets_1000', title: '1k sets', desc: 'Rep by rep', icon: 'layers', target: 1000, progress: (s) => s.setLogs.length },
  { id: 'sets_10000', title: '10k sets', desc: 'Industrial volume', icon: 'layers', target: 10000, progress: (s) => s.setLogs.length },
  { id: 'kcal_100k', title: '100k calories', desc: 'Energy spent', icon: 'zap', target: 100_000, progress: (s) => totalKcal(s) },
  { id: 'pr_5', title: '5 exercise PRs', desc: 'Strength map', icon: 'trophy', target: 5, progress: (s) => Math.min(5, prExerciseCount(s.setLogs)) },
  { id: 'water_30', title: '30 water days', desc: 'Hydration habit', icon: 'droplet', target: 30, progress: (s) => s.habits?.waterDaysLogged ?? 0 },
  { id: 'sleep_7', title: '7 nights 8h', desc: 'Recovery', icon: 'moon', target: 7, progress: (s) => s.habits?.sleep8Days ?? 0 },
  { id: 'steps_1m', title: '1M steps', desc: 'Walk the path', icon: 'footprints', target: 1_000_000, progress: (s, _st, h) => s.habits?.totalSteps ?? h?.steps ?? 0 },
  { id: 'level_5', title: 'Corpus Lv.5', desc: 'Rank up', icon: 'star', target: 5, progress: (s) => s.corpusLevel },
  { id: 'level_10', title: 'Corpus Lv.10', desc: 'Master tier', icon: 'star', target: 10, progress: (s) => s.corpusLevel },
  { id: 'challenge_30', title: '30-day challenge', desc: 'Finish community challenge', icon: 'users', target: 30, progress: (s) => {
    if (!s.challengeJoinedAt) return 0;
    return Math.min(30, Math.floor((Date.now() - new Date(s.challengeJoinedAt).getTime()) / 86_400_000) + 1);
  }},
  { id: 'custom_5', title: '5 custom programs', desc: 'Architect', icon: 'pen', target: 5, progress: (s) => s.customWorkouts.length },
  { id: 'hiit_20', title: '20 HIIT sessions', desc: 'Engine builder', icon: 'zap', target: 20, progress: (s) => s.workouts.filter((w) => w.workoutId === 'hiit').length },
];

export const ACHIEVEMENT_META: Record<string, { rarity: Rarity; xp: number }> = {
  streak_7: { rarity: 'common', xp: 50 },
  streak_30: { rarity: 'rare', xp: 150 },
  streak_100: { rarity: 'epic', xp: 400 },
  streak_365: { rarity: 'legendary', xp: 1200 },
  workouts_10: { rarity: 'common', xp: 60 },
  workouts_50: { rarity: 'rare', xp: 180 },
  workouts_100: { rarity: 'epic', xp: 400 },
  workouts_500: { rarity: 'legendary', xp: 1500 },
  sets_1000: { rarity: 'rare', xp: 200 },
  sets_10000: { rarity: 'legendary', xp: 1000 },
  kcal_100k: { rarity: 'epic', xp: 450 },
  pr_5: { rarity: 'rare', xp: 140 },
  water_30: { rarity: 'common', xp: 80 },
  sleep_7: { rarity: 'rare', xp: 120 },
  steps_1m: { rarity: 'epic', xp: 450 },
  level_5: { rarity: 'common', xp: 100 },
  level_10: { rarity: 'rare', xp: 250 },
  challenge_30: { rarity: 'epic', xp: 350 },
  custom_5: { rarity: 'common', xp: 70 },
  hiit_20: { rarity: 'rare', xp: 160 },
};

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Plausible past unlock date for the first evaluation of seeded / legacy data. */
function backdate(d: Def, s: FitnessLocalState): string {
  const done = s.workouts
    .filter((w) => w.status === 'completed')
    .map((w) => w.endedAt)
    .sort();
  const m = /^workouts_(\d+)$/.exec(d.id);
  if (m && done[Number(m[1]) - 1]) return done[Number(m[1]) - 1];
  const sm = /^sets_(\d+)$/.exec(d.id);
  if (sm) {
    const sorted = s.setLogs.map((l) => l.loggedAt).sort();
    if (sorted[Number(sm[1]) - 1]) return sorted[Number(sm[1]) - 1];
  }
  const days = 2 + (hashStr(d.id) % 38);
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

export function evaluateAchievements(
  state: FitnessLocalState,
  corpusStreak: number,
  health?: { steps?: number; water_ml?: number; sleep_hours?: number }
): { ids: string[]; timestamps: Record<string, string>; list: FitnessAchievement[]; newlyUnlocked: string[] } {
  const timestamps = { ...state.achievementTimestamps };
  const prev = new Set(state.unlockedAchievementIds ?? []);
  const ids = new Set<string>();
  const newlyUnlocked: string[] = [];

  const h = health
    ? { steps: health.steps, water: health.water_ml, sleep: health.sleep_hours }
    : undefined;

  const list: FitnessAchievement[] = ACHIEVEMENT_DEFS.map((d) => {
    const progress = Math.min(d.target, d.progress(state, corpusStreak, h));
    const unlocked = progress >= d.target;
    if (unlocked) {
      ids.add(d.id);
      if (!timestamps[d.id]) timestamps[d.id] = prev.size === 0 ? backdate(d, state) : new Date().toISOString();
      if (!prev.has(d.id)) newlyUnlocked.push(d.id);
    }
    return {
      id: d.id,
      title: d.title,
      desc: d.desc,
      icon: d.icon,
      target: d.target,
      progress,
      unlocked,
      unlockedAt: timestamps[d.id],
      rarity: ACHIEVEMENT_META[d.id]?.rarity ?? 'common',
      xp: ACHIEVEMENT_META[d.id]?.xp ?? 50,
    };
  });

  return { ids: [...ids], timestamps, list, newlyUnlocked };
}

export function detectNewPrs(state: FitnessLocalState, exerciseId: string, weightKg: number): boolean {
  const max = state.setLogs
    .filter((l) => l.exerciseId === exerciseId)
    .reduce((m, l) => Math.max(m, l.weightKg), 0);
  return weightKg > max;
}

export function prByExercise(state: FitnessLocalState) {
  const map = new Map<string, { weight: number; reps: number; date: string }>();
  for (const l of state.setLogs) {
    const cur = map.get(l.exerciseId);
    if (!cur || l.weightKg > cur.weight) {
      map.set(l.exerciseId, { weight: l.weightKg, reps: l.reps, date: l.loggedAt.slice(0, 10) });
    }
  }
  return [...map.entries()].map(([id, v]) => ({
    exerciseId: id,
    name: getExercise(id)?.name ?? id,
    ...v,
  }));
}

