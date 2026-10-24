import { useMemo } from 'react';
import { useFitness } from '../FitnessContext';
import { localDayKey } from './calendar';

export const GOALS = { steps: 10000, water: 2500, sleep: 8, weekly: 4 } as const;

export type HabitKind = 'steps' | 'water' | 'sleep';

export function useHabits() {
  const { fitness, health } = useFitness();
  return useMemo(() => {
    const today = localDayKey();
    const local = fitness.dailyLog?.date === today ? fitness.dailyLog : null;
    const steps = Math.max(health?.steps ?? 0, local?.steps ?? 0);
    const water = Math.max(health?.water_ml ?? 0, local?.waterMl ?? 0);
    const sleep = local?.sleepHours || health?.sleep_hours || 0;

    const hist = [...(fitness.dailyHistory ?? [])];
    if (fitness.dailyLog && fitness.dailyLog.date !== today && !hist.some((h) => h.date === fitness.dailyLog!.date)) {
      hist.push(fitness.dailyLog);
    }
    hist.sort((a, b) => a.date.localeCompare(b.date));
    const last6 = hist.slice(-6);
    const week = [
      ...last6.map((h) => ({ date: h.date, steps: h.steps, water: h.waterMl, sleep: h.sleepHours })),
      { date: today, steps, water, sleep },
    ];
    return { steps, water, sleep, week };
  }, [fitness.dailyLog, fitness.dailyHistory, health]);
}
