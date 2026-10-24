import { DailyLog, FitnessLocalState } from '../types';

const MAX_SET_LOGS_SYNC = 350;
const MAX_WORKOUTS_SYNC = 64;

/** Trim heavy arrays for API sync — full history stays in localStorage. */
export function fitnessStateForSync(state: FitnessLocalState): FitnessLocalState {
  const setLogs = [...state.setLogs]
    .sort((a, b) => String(b.loggedAt).localeCompare(String(a.loggedAt)))
    .slice(0, MAX_SET_LOGS_SYNC);

  const workouts = [...state.workouts]
    .sort((a, b) => String(b.endedAt ?? b.startedAt).localeCompare(String(a.endedAt ?? a.startedAt)))
    .slice(0, MAX_WORKOUTS_SYNC);

  // progress photos are device-local (data URLs) and never leave the phone
  const { progressPhotos: _photos, ...rest } = state;
  return { ...rest, setLogs, workouts };
}

/** Keep full local history after server merge (sync body is trimmed). */
export function mergeFitnessWithLocal(
  local: FitnessLocalState,
  server: FitnessLocalState
): FitnessLocalState {
  // With demo data the device is authoritative: stale demo records from older seeds
  // may still live on the server and must not pile up on every re-seed.
  const trustServerHistory = !local.demoSeeded;
  const setMap = new Map<string, (typeof local.setLogs)[0]>();
  if (trustServerHistory) for (const s of server.setLogs ?? []) setMap.set(s.id, s);
  for (const s of local.setLogs ?? []) setMap.set(s.id, s);

  const wMap = new Map<string, (typeof local.workouts)[0]>();
  if (trustServerHistory) for (const w of server.workouts ?? []) wMap.set(w.id, w);
  for (const w of local.workouts ?? []) wMap.set(w.id, w);

  return {
    ...server,
    demoSeeded: local.demoSeeded ?? server.demoSeeded,
    demoSeedVersion: local.demoSeedVersion ?? server.demoSeedVersion,
    setLogs: [...setMap.values()].sort((a, b) => String(b.loggedAt).localeCompare(String(a.loggedAt))),
    workouts: [...wMap.values()].sort((a, b) =>
      String(b.endedAt ?? b.startedAt).localeCompare(String(a.endedAt ?? a.startedAt))
    ),
    corpusXp: trustServerHistory ? Math.max(local.corpusXp ?? 0, server.corpusXp ?? 0) : (local.corpusXp ?? 0),
    corpusLevel: trustServerHistory ? Math.max(local.corpusLevel ?? 1, server.corpusLevel ?? 1) : (local.corpusLevel ?? 1),
    customWorkouts: local.customWorkouts?.length ? local.customWorkouts : server.customWorkouts,
    bodyProfile: local.bodyProfile ?? server.bodyProfile,
    habits: {
      stepsDaysLogged: local.habits?.stepsDaysLogged ?? server.habits?.stepsDaysLogged ?? 0,
      waterDaysLogged: local.habits?.waterDaysLogged ?? server.habits?.waterDaysLogged ?? 0,
      sleep8Days: local.habits?.sleep8Days ?? server.habits?.sleep8Days ?? 0,
      totalSteps: Math.max(local.habits?.totalSteps ?? 0, server.habits?.totalSteps ?? 0),
    },
    dailyLog: newerDaily(local.dailyLog, server.dailyLog),
    dailyHistory: local.dailyHistory ?? server.dailyHistory,
    settings: local.settings ?? server.settings,
    weightHistory: local.weightHistory ?? server.weightHistory,
    notes: local.notes ?? server.notes,
    progressPhotos: local.progressPhotos ?? server.progressPhotos,
    unlockedAchievementIds: local.unlockedAchievementIds?.length ? local.unlockedAchievementIds : server.unlockedAchievementIds,
    achievementTimestamps: { ...(server.achievementTimestamps ?? {}), ...(local.achievementTimestamps ?? {}) },
  };
}

function newerDaily(a?: DailyLog, b?: DailyLog): DailyLog | undefined {
  if (!a) return b;
  if (!b) return a;
  if (a.date !== b.date) return a.date > b.date ? a : b;
  return {
    date: a.date,
    steps: Math.max(a.steps, b.steps),
    waterMl: Math.max(a.waterMl, b.waterMl),
    sleepHours: a.sleepHours || b.sleepHours,
  };
}

