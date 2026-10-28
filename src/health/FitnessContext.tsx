import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { api, HealthDashboard } from '../api';
import { evaluateAchievements, detectNewPrs } from './achievements';
import {
  CustomWorkout,
  FitnessAchievement,
  FitnessLocalState,
  FitnessSyncPayload,
  LiveWorkoutState,
  SetLogEntry,
  WorkoutRecord,
  BodyProfile,
} from './types';
import { loadFitnessState, newId, saveFitnessState } from './fitnessStore';
import { scheduleWorkoutReminder, stopWorkoutReminder } from './notifications';
import { applyXp, xpFromSet, xpFromWorkout } from './gamification';
import { allWorkouts } from './exerciseCatalog';
import { localDayKey } from './utils/calendar';
import { fitnessStateForSync, mergeFitnessWithLocal } from './utils/fitnessSyncPayload';
import type { NotificationPrefs } from './types';

type Ctx = {
  fitness: FitnessLocalState;
  health: HealthDashboard | null;
  achievements: FitnessAchievement[];
  corpusStreak: number;
  syncing: boolean;
  booting: boolean;
  live: LiveWorkoutState | null;
  startLiveWorkout: (workoutId: string) => string;
  updateLiveNotes: (notes: string) => void;
  toggleLiveExercise: (exerciseId: string) => void;
  logSet: (
    exerciseId: string,
    reps: number,
    weightKg: number,
    rpe: number,
    sessionId?: string
  ) => Promise<boolean>;
  finishLiveWorkout: (sessionId: string) => { xp: number; prCount: number; workout: WorkoutRecord | null };
  addCustomWorkout: (w: Omit<CustomWorkout, 'id'>) => void;
  updateCustomWorkout: (id: string, w: Omit<CustomWorkout, 'id'>) => void;
  deleteCustomWorkout: (id: string) => void;
  recordHabitMeta: (kind: 'steps' | 'water' | 'sleep', health: HealthDashboard | null) => void;
  logDaily: (partial: { steps?: number; waterMl?: number; sleepHours?: number }) => void;
  updateBodyProfile: (profile: BodyProfile) => void;
  setNotifications: (prefs: NotificationPrefs) => void;
  refreshHealth: () => Promise<void>;
  persist: (next: FitnessLocalState) => void;
};

const FitnessCtx = createContext<Ctx | null>(null);

export function FitnessProvider({
  children,
  onAchievementUnlock,
}: {
  children: ReactNode;
  onAchievementUnlock?: (a: FitnessAchievement) => void;
}) {
  const [fitness, setFitness] = useState<FitnessLocalState>(() => {
    const s = loadFitnessState();
    const ev = evaluateAchievements(s, 14);
    return {
      ...s,
      unlockedAchievementIds: ev.ids,
      achievementTimestamps: ev.timestamps,
    };
  });
  const [health, setHealth] = useState<HealthDashboard | null>(null);
  const [achievements, setAchievements] = useState<FitnessAchievement[]>(() =>
    evaluateAchievements(loadFitnessState(), 14).list
  );
  const [corpusStreak, setCorpusStreak] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [booting, setBooting] = useState(true);
  const [live, setLive] = useState<LiveWorkoutState | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pushSyncRef = useRef<(state: FitnessLocalState) => Promise<void>>(async () => {});
  const refreshHealthRef = useRef<() => Promise<void>>(async () => {});

  const applyState = useCallback(
    (next: FitnessLocalState, streak = corpusStreak, h: HealthDashboard | null = health, notify = false) => {
      const ev = evaluateAchievements(next, streak, h ?? undefined);
      const unlockXp = ev.newlyUnlocked.reduce((s, id) => s + (ev.list.find((x) => x.id === id)?.xp ?? 50), 0);
      let merged: FitnessLocalState = {
        ...next,
        unlockedAchievementIds: ev.ids,
        achievementTimestamps: ev.timestamps,
      };
      if (notify && unlockXp > 0) merged = applyXp(merged, unlockXp);
      setAchievements(ev.list);
      setFitness(saveFitnessState(merged));
      // Only celebrate unlocks caused by the user's own action, not background sync/boot.
      if (notify) {
        for (const id of ev.newlyUnlocked) {
          const a = ev.list.find((x) => x.id === id);
          if (a) onAchievementUnlock?.(a);
        }
      }
      return merged;
    },
    [corpusStreak, health, onAchievementUnlock]
  );

  const pushSync = useCallback(async (state: FitnessLocalState) => {
    setSyncing(true);
    try {
      const res = (await api.syncFitness(fitnessStateForSync(state))) as unknown as FitnessSyncPayload;
      const streak = res.corpusStreak ?? 0;
      setCorpusStreak(streak);
      const merged = applyState(mergeFitnessWithLocal(state, res.state), streak);
      setAchievements(evaluateAchievements(merged, streak, health ?? undefined).list);
    } catch {
      saveFitnessState(state);
      const ev = evaluateAchievements(state, corpusStreak);
      setAchievements(ev.list);
    } finally {
      setSyncing(false);
    }
  }, [applyState, corpusStreak]);

  const persist = useCallback(
    (next: FitnessLocalState) => {
      const saved = applyState(next, corpusStreak, health, true);
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => pushSync(saved), 700);
    },
    [applyState, pushSync]
  );

  const refreshHealth = useCallback(async () => {
    try {
      const h = await api.getHealth();
      setHealth(h);
      setCorpusStreak(h.corpus_streak ?? 0);
      setFitness((f) => applyState(f, h.corpus_streak ?? 0, h));
    } catch {
      /* offline */
    }
  }, [applyState]);

  pushSyncRef.current = pushSync;
  refreshHealthRef.current = refreshHealth;

  useEffect(() => {
    let cancelled = false;
    const finishBoot = () => {
      if (!cancelled) setBooting(false);
    };
    const t = setTimeout(finishBoot, 450);
    void (async () => {
      await refreshHealthRef.current().catch(() => {});
      await pushSyncRef.current(loadFitnessState()).catch(() => {});
      finishBoot();
    })();
    return () => {
      cancelled = true;
      clearTimeout(t);
      if (syncTimer.current) clearTimeout(syncTimer.current);
      stopWorkoutReminder();
    };
    // Mount-only: avoid resetting boot timer when sync/health callbacks change identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scheduleWorkoutReminder(fitness.notifications);
  }, [fitness.notifications]);

  const startLiveWorkout = useCallback((workoutId: string) => {
    const sessionId = newId();
    setLive({
      sessionId,
      workoutId,
      startedAt: Date.now(),
      notes: '',
      completedExerciseIds: [],
    });
    return sessionId;
  }, []);

  const updateLiveNotes = useCallback((notes: string) => {
    setLive((l) => (l ? { ...l, notes } : l));
  }, []);

  const toggleLiveExercise = useCallback((exerciseId: string) => {
    setLive((l) => {
      if (!l) return l;
      const has = l.completedExerciseIds.includes(exerciseId);
      return {
        ...l,
        completedExerciseIds: has
          ? l.completedExerciseIds.filter((id) => id !== exerciseId)
          : [...l.completedExerciseIds, exerciseId],
      };
    });
  }, []);

  const logSet = useCallback(
    async (exerciseId: string, reps: number, weightKg: number, rpe: number, sessionId?: string) => {
      const entry: SetLogEntry = {
        id: newId(),
        exerciseId,
        reps,
        weightKg,
        rpe,
        loggedAt: new Date().toISOString(),
        workoutSessionId: sessionId,
      };
      const isPr = detectNewPrs(fitness, exerciseId, weightKg);
      let next = applyXp(
        { ...fitness, setLogs: [entry, ...fitness.setLogs] },
        xpFromSet()
      );
      persist(next);
      try {
        await api.logHealth('workout', 5);
        await refreshHealth();
      } catch {
        // offline: the set is already persisted locally
      }
      return isPr;
    },
    [fitness, corpusStreak, persist, refreshHealth]
  );

  const finishLiveWorkout = useCallback(
    (sessionId: string) => {
      if (!live) return { xp: 0, prCount: 0, workout: null };
      const tpl = allWorkouts(fitness.customWorkouts).find((w) => w.id === live.workoutId);
      const durationMin = Math.max(1, Math.round((Date.now() - live.startedAt) / 60_000));
      const setsInSession = fitness.setLogs.filter((s) => s.workoutSessionId === sessionId).length;
      const caloriesEst = tpl?.caloriesEst ?? 280;
      const rec: WorkoutRecord = {
        id: sessionId,
        workoutId: live.workoutId,
        name: tpl?.name ?? 'Workout',
        date: new Date().toISOString().slice(0, 10),
        startedAt: new Date(live.startedAt).toISOString(),
        endedAt: new Date().toISOString(),
        durationMin,
        caloriesEst,
        muscleGroups: tpl ? [tpl.muscleGroup] : ['push'],
        status: 'completed',
        notes: live.notes || undefined,
        totalSets: setsInSession,
      };
      const xpGain = xpFromWorkout(durationMin, setsInSession);
      let next = applyXp({ ...fitness, workouts: [rec, ...fitness.workouts] }, xpGain);
      persist(next);
      setLive(null);
      // fire-and-forget: the session is already persisted locally
      api.logHealth('workout', durationMin).then(refreshHealth, () => undefined);
      return { xp: xpGain, prCount: 0, workout: rec };
    },
    [live, fitness, corpusStreak, persist, refreshHealth]
  );

  const addCustomWorkout = useCallback(
    (w: Omit<CustomWorkout, 'id'>) => {
      persist({ ...fitness, customWorkouts: [{ ...w, id: newId() }, ...fitness.customWorkouts] });
    },
    [fitness, persist]
  );

  const updateCustomWorkout = useCallback(
    (id: string, w: Omit<CustomWorkout, 'id'>) => {
      persist({
        ...fitness,
        customWorkouts: fitness.customWorkouts.map((c) => (c.id === id ? { ...w, id } : c)),
      });
    },
    [fitness, persist]
  );

  const deleteCustomWorkout = useCallback(
    (id: string) => {
      persist({ ...fitness, customWorkouts: fitness.customWorkouts.filter((c) => c.id !== id) });
    },
    [fitness, persist]
  );

  const recordHabitMeta = useCallback(
    (kind: 'steps' | 'water' | 'sleep', h: HealthDashboard | null) => {
      if (!h) return;
      const habits = {
        stepsDaysLogged: fitness.habits?.stepsDaysLogged ?? 0,
        waterDaysLogged: fitness.habits?.waterDaysLogged ?? 0,
        sleep8Days: fitness.habits?.sleep8Days ?? 0,
        totalSteps: Math.max(fitness.habits?.totalSteps ?? 0, h.steps),
      };
      if (kind === 'steps') habits.stepsDaysLogged += 1;
      if (kind === 'water') habits.waterDaysLogged += 1;
      if (kind === 'sleep' && h.sleep_hours >= 8) habits.sleep8Days += 1;
      persist({ ...fitness, habits });
    },
    [fitness, persist]
  );

  const logDaily = useCallback(
    (partial: { steps?: number; waterMl?: number; sleepHours?: number }) => {
      const date = localDayKey();
      const prev =
        fitness.dailyLog?.date === date
          ? fitness.dailyLog
          : { date, steps: 0, waterMl: 0, sleepHours: 0 };
      const dailyLog = { ...prev, date, ...partial };
      const dailyHistory =
        fitness.dailyLog && fitness.dailyLog.date !== date
          ? [...(fitness.dailyHistory ?? []).filter((d) => d.date !== fitness.dailyLog!.date), fitness.dailyLog].slice(-13)
          : fitness.dailyHistory;
      const habits = {
        stepsDaysLogged: fitness.habits?.stepsDaysLogged ?? 0,
        waterDaysLogged: fitness.habits?.waterDaysLogged ?? 0,
        sleep8Days: fitness.habits?.sleep8Days ?? 0,
        totalSteps: fitness.habits?.totalSteps ?? 0,
      };
      if (partial.steps !== undefined) {
        habits.totalSteps += Math.max(0, partial.steps - prev.steps);
        if (prev.steps === 0 && partial.steps > 0) habits.stepsDaysLogged += 1;
      }
      if (partial.waterMl !== undefined && prev.waterMl === 0 && partial.waterMl > 0) habits.waterDaysLogged += 1;
      if (partial.sleepHours !== undefined && partial.sleepHours >= 8 && prev.sleepHours < 8) habits.sleep8Days += 1;
      persist({ ...fitness, dailyLog, dailyHistory, habits });
    },
    [fitness, persist]
  );

  const setNotifications = useCallback(
    (prefs: NotificationPrefs) => {
      persist({ ...fitness, notifications: prefs });
    },
    [fitness, persist]
  );

  const updateBodyProfile = useCallback(
    (profile: BodyProfile) => {
      persist({ ...fitness, bodyProfile: profile });
    },
    [fitness, persist]
  );

  const value = useMemo(
    () => ({
      fitness,
      health,
      achievements,
      corpusStreak,
      syncing,
      booting,
      live,
      startLiveWorkout,
      updateLiveNotes,
      toggleLiveExercise,
      logSet,
      finishLiveWorkout,
      addCustomWorkout,
      updateCustomWorkout,
      deleteCustomWorkout,
      recordHabitMeta,
      logDaily,
      updateBodyProfile,
      setNotifications,
      refreshHealth,
      persist,
    }),
    [
      fitness,
      health,
      achievements,
      corpusStreak,
      syncing,
      booting,
      live,
      startLiveWorkout,
      updateLiveNotes,
      toggleLiveExercise,
      logSet,
      finishLiveWorkout,
      addCustomWorkout,
      updateCustomWorkout,
      deleteCustomWorkout,
      recordHabitMeta,
      logDaily,
      updateBodyProfile,
      setNotifications,
      refreshHealth,
      persist,
    ]
  );

  return <FitnessCtx.Provider value={value}>{children}</FitnessCtx.Provider>;
}

export function useFitness() {
  const c = useContext(FitnessCtx);
  if (!c) throw new Error('useFitness outside provider');
  return c;
}


