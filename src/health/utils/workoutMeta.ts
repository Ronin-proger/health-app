import { getExercise } from '../exerciseCatalog';
import { FitnessLocalState } from '../types';

export type DifficultyLevel = 1 | 2 | 3;

const SCORE = { Beginner: 1, Intermediate: 2, Advanced: 3 } as const;

export function exerciseDifficulty(exerciseId: string): DifficultyLevel {
  const d = getExercise(exerciseId)?.difficulty as keyof typeof SCORE | undefined;
  return (d ? SCORE[d] : 2) as DifficultyLevel;
}

export function workoutDifficulty(exerciseIds: string[]): DifficultyLevel {
  if (!exerciseIds.length) return 1;
  const avg = exerciseIds.reduce((s, id) => s + exerciseDifficulty(id), 0) / exerciseIds.length;
  return avg < 1.55 ? 1 : avg < 2.35 ? 2 : 3;
}

function hash(id: string) {
  let h = 7;
  for (let i = 0; i < id.length; i++) h = (h * 33 + id.charCodeAt(i)) >>> 0;
  return h;
}

/** Stable 4.5–4.9 community rating per program. */
export function workoutRating(id: string) {
  return Math.round((4.5 + (hash(id) % 5) / 10) * 10) / 10;
}

export function workoutStats(fitness: FitnessLocalState, workoutId: string) {
  const runs = fitness.workouts.filter((w) => w.status === 'completed' && w.workoutId === workoutId);
  const ids = new Set(runs.map((r) => r.id));
  let volume = 0;
  for (const l of fitness.setLogs) {
    if (l.workoutSessionId && ids.has(l.workoutSessionId)) volume += l.reps * l.weightKg;
  }
  const last = runs.reduce<string | null>((m, r) => (!m || r.endedAt > m ? r.endedAt : m), null);
  return { count: runs.length, last, volumeKg: Math.round(volume) };
}

/** Program that has waited the longest (never-done first). */
export function suggestWorkout<T extends { id: string }>(fitness: FitnessLocalState, list: T[]): T {
  const lastOf = (id: string) => workoutStats(fitness, id).last ?? '';
  return [...list].sort((a, b) => lastOf(a.id).localeCompare(lastOf(b.id)))[0] ?? list[0];
}

/** First two ints in "8-10" / "12" style rep strings. */
export function parseReps(reps: string): number {
  const m = /\d+/.exec(reps);
  return m ? Number(m[0]) : 10;
}
