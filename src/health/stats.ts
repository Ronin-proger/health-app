import { getExercise } from './exerciseCatalog';
import { FitnessLocalState } from './types';

export type Period = 'week' | 'month' | 'year';

function inPeriod(iso: string, period: Period) {
  const d = new Date(iso);
  const now = new Date();
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  return d >= start;
}

function completed(workouts: FitnessLocalState['workouts']) {
  return workouts.filter((w) => w.status === 'completed');
}

export function sessionsInPeriod(fitness: FitnessLocalState, period: Period) {
  return completed(fitness.workouts).filter((s) => inPeriod(s.endedAt, period));
}

export function aggregateProgress(fitness: FitnessLocalState, period: Period) {
  const sessions = sessionsInPeriod(fitness, period);
  const workouts = sessions.length;
  const totalMin = sessions.reduce((a, s) => a + s.durationMin, 0);
  const calories = sessions.reduce((a, s) => a + s.caloriesEst, 0);
  const sets = fitness.setLogs.filter((l) => inPeriod(l.loggedAt, period)).length;
  return { workouts, totalMin, calories, sets };
}

export function dailyCaloriesBars(fitness: FitnessLocalState, period: Period) {
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 12;
  const out: { label: string; kcal: number }[] = [];
  if (period === 'year') {
    for (let m = 11; m >= 0; m--) {
      const d = new Date();
      d.setMonth(d.getMonth() - m);
      const key = d.toISOString().slice(0, 7);
      const kcal = completed(fitness.workouts)
        .filter((s) => s.endedAt.slice(0, 7) === key)
        .reduce((a, s) => a + s.caloriesEst, 0);
      out.push({ label: d.toLocaleDateString('en', { month: 'short' }), kcal });
    }
    return out;
  }
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const kcal = completed(fitness.workouts)
      .filter((s) => s.endedAt.slice(0, 10) === key)
      .reduce((a, s) => a + s.caloriesEst, 0);
    out.push({
      label: period === 'week' ? d.toLocaleDateString('en', { weekday: 'short' }) : String(d.getDate()),
      kcal,
    });
  }
  return out;
}

export function muscleFocusPercents(fitness: FitnessLocalState, period?: Period) {
  const logs = period
    ? fitness.setLogs.filter((l) => inPeriod(l.loggedAt, period))
    : fitness.setLogs;
  const counts: Record<string, number> = { push: 0, pull: 0, legs: 0, core: 0 };
  for (const log of logs) {
    const ex = getExercise(log.exerciseId);
    if (ex && ex.muscleGroup !== 'all') counts[ex.muscleGroup] += 1;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return (['push', 'pull', 'legs', 'core'] as const).map((g) => ({
    group: g,
    pct: Math.round((counts[g] / total) * 100),
    label: g === 'push' ? 'Push' : g === 'pull' ? 'Pull' : g === 'legs' ? 'Legs' : 'Core',
  }));
}

export function volumeByMuscleMonth(fitness: FitnessLocalState) {
  const weeks: { label: string; push: number; pull: number; legs: number; core: number }[] = [];
  for (let w = 3; w >= 0; w--) {
    const start = new Date();
    start.setDate(start.getDate() - (w + 1) * 7);
    const end = new Date();
    end.setDate(end.getDate() - w * 7);
    const vol = { push: 0, pull: 0, legs: 0, core: 0 };
    for (const log of fitness.setLogs) {
      const t = new Date(log.loggedAt);
      if (t < start || t > end) continue;
      const ex = getExercise(log.exerciseId);
      if (ex && ex.muscleGroup in vol) vol[ex.muscleGroup as keyof typeof vol] += log.reps * log.weightKg;
    }
    weeks.push({ label: `W${4 - w}`, ...vol });
  }
  return weeks;
}

export function setsForExercise(fitness: FitnessLocalState, exerciseId: string) {
  return fitness.setLogs.filter((s) => s.exerciseId === exerciseId);
}

export function weightProgressSeries(fitness: FitnessLocalState, exerciseId: string) {
  const logs = [...setsForExercise(fitness, exerciseId)].sort((a, b) =>
    a.loggedAt.localeCompare(b.loggedAt)
  );
  const byDay = new Map<string, number>();
  for (const l of logs) {
    const day = l.loggedAt.slice(0, 10);
    byDay.set(day, Math.max(byDay.get(day) ?? 0, l.weightKg));
  }
  return [...byDay.entries()].slice(-14).map(([date, weight]) => ({ date, weight }));
}

export function weekScores(healthWeek: { dayLabel?: string; score: number; date?: string }[] | undefined) {
  return healthWeek ?? [];
}
