import { mergeWithDemo, shouldSeedDemo } from './demoSeed';
import { levelFromXp } from './gamification';
import { DEFAULT_BODY_PROFILE, normalizeBodyProfile } from './bodyProfileDefaults';
import { FitnessLocalState, WorkoutRecord } from './types';
import { withDemoExtras } from './demoExtras';

const KEY = 'aetheris_fitness_v2';
/** Bump to refresh demo analytics + thematic media after app updates */
const DEMO_SEED_VERSION = 5;

export function emptyFitnessState(): FitnessLocalState {
  return {
    v: 2,
    workouts: [],
    setLogs: [],
    customWorkouts: [],
    notifications: { enabled: false, hour: 18, minute: 30, daysOfWeek: [1, 3, 5] },
    hrZoneMinutes: { z1: 45, z2: 30, z3: 20, z4: 10, z5: 5 },
    unlockedAchievementIds: [],
    achievementTimestamps: {},
    corpusXp: 0,
    corpusLevel: 1,
    unlockedProgramIds: ['push_day', 'pull_day', 'leg_day', 'core_focus'],
    habits: { stepsDaysLogged: 0, waterDaysLogged: 0, sleep8Days: 0, totalSteps: 0 },
    bodyProfile: { ...DEFAULT_BODY_PROFILE },
    updatedAt: new Date().toISOString(),
  };
}

function migrateV1(raw: Record<string, unknown>): FitnessLocalState {
  const base = emptyFitnessState();
  const sessions = (raw.sessions as { id: string; workoutId: string; startedAt: string; endedAt?: string; durationMin: number; caloriesEst: number }[]) ?? [];
  const workouts: WorkoutRecord[] = sessions.map((s) => ({
    id: s.id,
    workoutId: s.workoutId,
    name: s.workoutId,
    date: s.startedAt.slice(0, 10),
    startedAt: s.startedAt,
    endedAt: s.endedAt ?? s.startedAt,
    durationMin: s.durationMin,
    caloriesEst: s.caloriesEst,
    muscleGroups: ['push'],
    status: 'completed',
    totalSets: 0,
  }));
  return {
    ...base,
    workouts,
    setLogs: (raw.setLogs as FitnessLocalState['setLogs']) ?? [],
    customWorkouts: (raw.customWorkouts as FitnessLocalState['customWorkouts']) ?? [],
    notifications: {
      enabled: Boolean((raw.notifications as { enabled?: boolean })?.enabled),
      hour: (raw.notifications as { hour?: number })?.hour ?? 18,
      minute: (raw.notifications as { minute?: number })?.minute ?? 0,
      daysOfWeek: [1, 2, 3, 4, 5],
    },
    hrZoneMinutes: (raw.hrZoneMinutes as FitnessLocalState['hrZoneMinutes']) ?? base.hrZoneMinutes,
    unlockedAchievementIds: (raw.unlockedAchievementIds as string[]) ?? [],
    corpusXp: Number(raw.corpusXp) || 0,
    corpusLevel: levelFromXp(Number(raw.corpusXp) || 0),
    unlockedProgramIds: (raw.unlockedProgramIds as string[]) ?? base.unlockedProgramIds,
    achievementTimestamps: (raw.achievementTimestamps as Record<string, string>) ?? {},
  };
}

export function loadFitnessState(): FitnessLocalState {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem('aetheris_fitness_v1');
    if (!raw) {
      return withDemoExtras(mergeWithDemo(emptyFitnessState()));
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    let state: FitnessLocalState;
    if (parsed.v === 2) {
      state = { ...emptyFitnessState(), ...parsed } as FitnessLocalState;
    } else {
      state = migrateV1(parsed);
    }
    state.bodyProfile = normalizeBodyProfile(state.bodyProfile);
    if (state.demoSeedVersion !== DEMO_SEED_VERSION || shouldSeedDemo(state)) {
      if (state.demoSeeded) state = { ...state, unlockedAchievementIds: [], achievementTimestamps: {} };
      state = withDemoExtras(mergeWithDemo(state));
      state.demoSeedVersion = DEMO_SEED_VERSION;
      saveFitnessState(state);
    }
    return state;
  } catch {
    const seeded = withDemoExtras(mergeWithDemo(emptyFitnessState()));
    saveFitnessState(seeded);
    return seeded;
  }
}

export function saveFitnessState(state: FitnessLocalState) {
  const next = { ...state, updatedAt: new Date().toISOString() };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function newId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

