import { describe, expect, it } from 'vitest';
import { EXERCISES } from './exerciseCatalog';
import { aggregateProgress, muscleFocusPercents, weightProgressSeries } from './stats';
import type { FitnessLocalState, MuscleGroup, SetLogEntry, WorkoutRecord, WorkoutStatus } from './types';
import { tierOf } from './utils/muscleAnalytics';

const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY).toISOString();

function exerciseOf(group: MuscleGroup): string {
  const ex = EXERCISES.find((e) => e.muscleGroup === group);
  if (!ex) throw new Error(`catalog has no ${group} exercise`);
  return ex.id;
}

function workout(id: string, endedAt: string, status: WorkoutStatus = 'completed'): WorkoutRecord {
  return {
    id,
    workoutId: 'template',
    name: id,
    date: endedAt.slice(0, 10),
    startedAt: endedAt,
    endedAt,
    durationMin: 45,
    caloriesEst: 300,
    muscleGroups: ['push'],
    status,
    totalSets: 3,
  };
}

function set(exerciseId: string, loggedAt: string, weightKg: number, reps = 8): SetLogEntry {
  return { id: `${exerciseId}-${loggedAt}-${weightKg}`, exerciseId, reps, weightKg, loggedAt };
}

function state(workouts: WorkoutRecord[], setLogs: SetLogEntry[] = []): FitnessLocalState {
  return { workouts, setLogs } as FitnessLocalState;
}

describe('aggregateProgress', () => {
  const fitness = state(
    [workout('recent', daysAgo(2)), workout('old', daysAgo(40)), workout('open', daysAgo(1), 'in_progress')],
    [set(exerciseOf('push'), daysAgo(1), 40), set(exerciseOf('push'), daysAgo(20), 40)],
  );

  it('counts only completed sessions inside the period', () => {
    expect(aggregateProgress(fitness, 'week')).toEqual({ workouts: 1, totalMin: 45, calories: 300, sets: 1 });
    expect(aggregateProgress(fitness, 'month').workouts).toBe(1);
    expect(aggregateProgress(fitness, 'year').workouts).toBe(2);
  });

  it('counts sets by their own timestamp, not by session', () => {
    expect(aggregateProgress(fitness, 'month').sets).toBe(2);
  });
});

describe('muscleFocusPercents', () => {
  it('splits logged sets by muscle group', () => {
    const push = exerciseOf('push');
    const legs = exerciseOf('legs');
    const fitness = state([], [set(push, daysAgo(1), 40), set(push, daysAgo(1), 40), set(push, daysAgo(2), 40), set(legs, daysAgo(2), 80)]);

    const byGroup = Object.fromEntries(muscleFocusPercents(fitness).map((g) => [g.group, g.pct]));
    expect(byGroup).toEqual({ push: 75, pull: 0, legs: 25, core: 0 });
  });

  it('returns zeros instead of NaN without logs', () => {
    expect(muscleFocusPercents(state([])).every((g) => g.pct === 0)).toBe(true);
  });
});

describe('weightProgressSeries', () => {
  it('keeps the heaviest set per day in chronological order', () => {
    const id = exerciseOf('push');
    const fitness = state([], [
      set(id, '2026-10-02T09:00:00.000Z', 45),
      set(id, '2026-10-01T09:00:00.000Z', 40),
      set(id, '2026-10-01T09:10:00.000Z', 50),
    ]);

    expect(weightProgressSeries(fitness, id)).toEqual([
      { date: '2026-10-01', weight: 50 },
      { date: '2026-10-02', weight: 45 },
    ]);
  });
});

describe('tierOf', () => {
  it.each([
    [0, 'novice', 0, 25],
    [25, 'intermediate', 0, 55],
    [70, 'advanced', 0.5, 85],
    [100, 'elite', 1, null],
  ] as const)('score %i → %s', (score, id, progress, nextAt) => {
    const tier = tierOf(score);
    expect(tier.id).toBe(id);
    expect(tier.progress).toBeCloseTo(progress);
    expect(tier.nextAt).toBe(nextAt);
  });
});
