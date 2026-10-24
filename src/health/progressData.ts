import { getExercise } from './exerciseCatalog';
import { FitnessLocalState } from './types';
import { Period } from './stats';
import { localDayKey } from './utils/calendar';

type Group = 'push' | 'pull' | 'legs' | 'core';
const GROUPS: Group[] = ['push', 'pull', 'legs', 'core'];

const DAY = 86_400_000;

function loc(locale: string) {
  return locale === 'en' ? 'en-US' : 'ru-RU';
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

export type KcalPoint = { label: string; kcal: number };

/** Week: 7 days · Month: ten 3-day windows · Year: 12 months. Falls back to a demo curve when data is sparse. */
export function caloriesSeries(fitness: FitnessLocalState, period: Period, locale: string): { points: KcalPoint[]; isDemo: boolean } {
  const done = fitness.workouts.filter((w) => w.status === 'completed');
  const today = startOfDay(new Date());
  const points: KcalPoint[] = [];

  if (period === 'year') {
    for (let m = 11; m >= 0; m--) {
      const d = new Date(today.getFullYear(), today.getMonth() - m, 1);
      const key = monthKey(d);
      const kcal = done.filter((w) => monthKey(new Date(w.endedAt)) === key).reduce((s, w) => s + w.caloriesEst, 0);
      points.push({ label: d.toLocaleDateString(loc(locale), { month: 'short' }).replace('.', ''), kcal });
    }
  } else if (period === 'week') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * DAY);
      const key = localDayKey(d);
      const kcal = done.filter((w) => localDayKey(new Date(w.endedAt)) === key).reduce((s, w) => s + w.caloriesEst, 0);
      points.push({ label: d.toLocaleDateString(loc(locale), { weekday: 'short' }).replace('.', ''), kcal });
    }
  } else {
    for (let b = 9; b >= 0; b--) {
      const end = new Date(today.getTime() - b * 3 * DAY + DAY);
      const start = new Date(end.getTime() - 3 * DAY);
      const kcal = done
        .filter((w) => {
          const t = new Date(w.endedAt).getTime();
          return t >= start.getTime() && t < end.getTime();
        })
        .reduce((s, w) => s + w.caloriesEst, 0);
      const last = new Date(end.getTime() - DAY);
      points.push({ label: `${last.getDate()}.${String(last.getMonth() + 1).padStart(2, '0')}`, kcal });
    }
  }

  const nonZero = points.filter((p) => p.kcal > 0).length;
  const need = period === 'week' ? 3 : period === 'month' ? 4 : 4;
  if (nonZero >= need) return { points, isDemo: false };

  const demo =
    period === 'week'
      ? [320, 410, 360, 540, 330, 470, 400]
      : period === 'month'
        ? [380, 520, 440, 610, 480, 560, 430, 650, 520, 590]
        : [5200, 6100, 5800, 7400, 6900, 8200, 7800, 9100, 8600, 9800, 10400, 11200];
  return { points: points.map((p, i) => ({ ...p, kcal: demo[i] ?? 400 })), isDemo: true };
}

export type VolumePointGroups = { label: string; push: number; pull: number; legs: number; core: number };

/** Volume (kg) per muscle group; week = days, month = weeks, year = months. */
export function volumeSeries(fitness: FitnessLocalState, period: Period, locale: string): { points: VolumePointGroups[]; isDemo: boolean } {
  const today = startOfDay(new Date());
  const buckets: { label: string; from: number; to: number }[] = [];
  if (period === 'week') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * DAY);
      buckets.push({ label: d.toLocaleDateString(loc(locale), { weekday: 'short' }).replace('.', ''), from: d.getTime(), to: d.getTime() + DAY });
    }
  } else if (period === 'month') {
    for (let w = 3; w >= 0; w--) {
      const to = today.getTime() + DAY - w * 7 * DAY;
      const from = to - 7 * DAY;
      const e = new Date(to - DAY);
      buckets.push({ label: `${e.getDate()}.${String(e.getMonth() + 1).padStart(2, '0')}`, from, to });
    }
  } else {
    for (let m = 11; m >= 0; m--) {
      const d = new Date(today.getFullYear(), today.getMonth() - m, 1);
      const next = new Date(today.getFullYear(), today.getMonth() - m + 1, 1);
      buckets.push({ label: d.toLocaleDateString(loc(locale), { month: 'short' }).replace('.', ''), from: d.getTime(), to: next.getTime() });
    }
  }

  const points: VolumePointGroups[] = buckets.map((b) => ({ label: b.label, push: 0, pull: 0, legs: 0, core: 0 }));
  for (const l of fitness.setLogs) {
    const t = new Date(l.loggedAt).getTime();
    const bi = buckets.findIndex((b) => t >= b.from && t < b.to);
    if (bi < 0) continue;
    const g = getExercise(l.exerciseId)?.muscleGroup as Group | 'all' | undefined;
    if (g && g !== 'all') points[bi][g] += l.reps * l.weightKg;
  }
  points.forEach((p) => GROUPS.forEach((g) => (p[g] = Math.round(p[g]))));

  const active = points.filter((p) => p.push + p.pull + p.legs + p.core > 0).length;
  const need = period === 'week' ? 3 : 3;
  if (active >= need) return { points, isDemo: false };

  const base = period === 'week' ? 2600 : period === 'month' ? 9800 : 36000;
  const shape = [0.8, 1, 0.7, 1.15, 0.9, 1.25, 1.05, 0.95, 1.2, 1.1, 1.3, 1.22];
  return {
    isDemo: true,
    points: points.map((p, i) => {
      const k = shape[i % shape.length];
      return { label: p.label, push: Math.round(base * 0.34 * k), pull: Math.round(base * 0.28 * k), legs: Math.round(base * 0.3 * k), core: Math.round(base * 0.08 * k) };
    }),
  };
}

export function focusSplit(fitness: FitnessLocalState, period: Period): { split: Record<Group, number>; total: number; isDemo: boolean } {
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
  const since = Date.now() - days * DAY;
  const counts: Record<Group, number> = { push: 0, pull: 0, legs: 0, core: 0 };
  for (const l of fitness.setLogs) {
    if (new Date(l.loggedAt).getTime() < since) continue;
    const g = getExercise(l.exerciseId)?.muscleGroup as Group | 'all' | undefined;
    if (g && g !== 'all') counts[g] += 1;
  }
  const total = GROUPS.reduce((s, g) => s + counts[g], 0);
  if (total < 8) return { split: { push: 34, pull: 28, legs: 28, core: 10 }, total: 0, isDemo: true };
  const pct = {} as Record<Group, number>;
  GROUPS.forEach((g) => (pct[g] = Math.round((counts[g] / total) * 100)));
  return { split: pct, total, isDemo: false };
}

export const PROGRESS_GROUPS = GROUPS;
