import { FitnessLocalState } from '../types';

export function localDayKey(d: Date = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Local-day keys on which at least one workout was completed. */
export function workoutDaySet(fitness: FitnessLocalState): Set<string> {
  const s = new Set<string>();
  for (const w of fitness.workouts) {
    if (w.status !== 'completed') continue;
    s.add(localDayKey(new Date(w.endedAt || w.startedAt)));
  }
  return s;
}

/** Monday-first week containing today. */
export function currentWeek(): { key: string; date: Date; isToday: boolean; isFuture: boolean }[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dow = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { key: localDayKey(d), date: d, isToday: d.getTime() === now.getTime(), isFuture: d.getTime() > now.getTime() };
  });
}

/** Last `weeks` weeks (Monday-first columns) for a heat calendar. */
export function calendarGrid(weeks: number): { key: string; date: Date; future: boolean }[][] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dow = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - dow - (weeks - 1) * 7);
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + w * 7 + i);
      return { key: localDayKey(d), date: d, future: d.getTime() > now.getTime() };
    })
  );
}

/** Consecutive-day streak from workouts (today may still be pending). */
export function workoutStreak(fitness: FitnessLocalState): number {
  const days = workoutDaySet(fitness);
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (!days.has(localDayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(localDayKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
