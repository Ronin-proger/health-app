import { EXERCISES, WORKOUT_TEMPLATES } from './exerciseCatalog';

import { evaluateAchievements } from './achievements';

import { FitnessLocalState, SetLogEntry, WorkoutRecord } from './types';

import { newId } from './fitnessStore';

import { DEFAULT_BODY_PROFILE } from './bodyProfileDefaults';

import { xpFromWorkout } from './gamification';



function daysAgo(n: number, hour = 18) {

  const d = new Date();

  d.setDate(d.getDate() - n);

  d.setHours(hour, 0, 0, 0);

  return d;

}



export function createDemoFitnessState(): FitnessLocalState {

  const workouts: WorkoutRecord[] = [];

  const setLogs: SetLogEntry[] = [];

  const templates = WORKOUT_TEMPLATES;

  let totalXp = 0;



  // Most recent 42 sessions (yesterday and back), so the current week/streak is populated.
  const sessionDays: number[] = [];
  for (let d = 1; d <= 89; d++) {
    if (d % 2 === 0 || d % 3 === 0) sessionDays.push(d);
  }
  const pickedDays = sessionDays.slice(0, 42).reverse();

  for (const day of pickedDays) {

    if (day % 2 !== 0 && day % 3 !== 0) continue;

    if (workouts.length >= 42) break;

    const tpl = templates[workouts.length % templates.length];

    const start = daysAgo(day, 16 + (workouts.length % 4));

    const duration = tpl.durationMin + (workouts.length % 7);

    const end = new Date(start.getTime() + duration * 60_000);

    const sessionId = newId();



    let setsInWorkout = 0;

    for (const exId of tpl.exerciseIds) {

      const ex = EXERCISES.find((e) => e.id === exId);

      if (!ex) continue;

      const baseWeight =

        ex.muscleGroup === 'legs' ? 60 : ex.muscleGroup === 'pull' ? 45 : 35;

      const progress = 1 + (89 - day) * 0.012;

      for (let set = 0; set < ex.defaultSets; set++) {

        setLogs.push({

          id: newId(),

          exerciseId: exId,

          reps: 8 + (set % 3) + (workouts.length % 2),

          weightKg: Math.round((baseWeight + set * 2.5) * progress * 10) / 10,

          rpe: 6 + (set % 3),

          loggedAt: new Date(start.getTime() + (setsInWorkout + set) * 90_000).toISOString(),

          workoutSessionId: sessionId,

        });

      }

      setsInWorkout += ex.defaultSets;

    }



    const rec: WorkoutRecord = {

      id: sessionId,

      workoutId: tpl.id,

      name: tpl.name,

      date: start.toISOString().slice(0, 10),

      startedAt: start.toISOString(),

      endedAt: end.toISOString(),

      durationMin: duration,

      caloriesEst: tpl.caloriesEst + (workouts.length % 5) * 12,

      muscleGroups: [tpl.muscleGroup],

      status: 'completed',

      totalSets: setsInWorkout,

      notes: day % 7 === 0 ? 'Strong session' : undefined,

    };

    workouts.push(rec);

    totalXp += xpFromWorkout(duration, setsInWorkout);

  }



  const level = Math.max(1, Math.floor(Math.sqrt(totalXp / 80)));



  const base: FitnessLocalState = {

    v: 2,

    workouts,

    setLogs,

    customWorkouts: [],

    notifications: { enabled: false, hour: 18, minute: 30, daysOfWeek: [1, 2, 3, 4, 5] },

    hrZoneMinutes: { z1: 148, z2: 112, z3: 78, z4: 44, z5: 22 },

    unlockedAchievementIds: [],

    achievementTimestamps: {},

    corpusXp: totalXp,

    corpusLevel: level,

    unlockedProgramIds: templates.map((t) => t.id),

    habits: {

      stepsDaysLogged: 28,

      waterDaysLogged: 32,

      sleep8Days: 14,

      totalSteps: 412_000,

    },

    challengeJoinedAt: new Date(Date.now() - 18 * 86_400_000).toISOString(),

    bodyProfile: { ...DEFAULT_BODY_PROFILE },

    updatedAt: new Date().toISOString(),

    demoSeeded: true,

  };



  const ev = evaluateAchievements(base, 14);

  return {

    ...base,

    unlockedAchievementIds: ev.ids,

    achievementTimestamps: ev.timestamps,

  };

}



export function shouldSeedDemo(state: FitnessLocalState | null): boolean {

  if (!state) return true;

  if (state.v !== 2) return true;

  if (state.workouts.length < 20 && state.setLogs.length < 120) return true;

  return false;

}



export function mergeWithDemo(state: FitnessLocalState): FitnessLocalState {

  const demo = createDemoFitnessState();

  if (state.demoSeeded && state.workouts.length >= 12) {

    const ev = evaluateAchievements(state, 14);

    return {

      ...state,

      unlockedAchievementIds: ev.ids,

      achievementTimestamps: ev.timestamps,

    };

  }

  const merged = {

    ...demo,

    customWorkouts: state.customWorkouts ?? [],

    notifications: state.notifications ?? demo.notifications,

    corpusXp: state.demoSeeded ? demo.corpusXp : Math.max(state.corpusXp ?? 0, demo.corpusXp),

    corpusLevel: state.demoSeeded ? demo.corpusLevel : Math.max(state.corpusLevel ?? 1, demo.corpusLevel),

    bodyProfile: state.bodyProfile ?? demo.bodyProfile,

    demoSeeded: true,

  };

  const ev = evaluateAchievements(merged, 14);

  return {

    ...merged,

    unlockedAchievementIds: ev.ids,

    achievementTimestamps: ev.timestamps,

  };

}


