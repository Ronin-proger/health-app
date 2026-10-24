import { useMemo } from 'react';
import { useFitness } from '../FitnessContext';
import { useCopy } from '../copy';
import { UnitSystem } from '../types';

const LB = 2.2046226218;

export function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export function useUnits() {
  const { fitness } = useFitness();
  const c = useCopy();
  const units: UnitSystem = fitness.settings?.units ?? 'metric';
  return useMemo(() => {
    const imperial = units === 'imperial';
    const unit = imperial ? 'lb' : c.common.kg;
    const toDisp = (kg: number) => (imperial ? round1(kg * LB) : round1(kg));
    const fromDisp = (v: number) => (imperial ? v / LB : v);
    return {
      units,
      imperial,
      unit,
      step: imperial ? 5 : 2.5,
      toDisp,
      fromDisp,
      /** "82.5 кг" */
      fmt: (kg: number) => `${toDisp(kg)} ${unit}`,
      /** "82.5" without unit */
      num: (kg: number) => String(toDisp(kg)),
      height: (cm: number) => {
        if (!imperial) return `${Math.round(cm)} ${c.common.min === 'мин' ? 'см' : 'cm'}`;
        const totalIn = cm / 2.54;
        return `${Math.floor(totalIn / 12)}′${Math.round(totalIn % 12)}″`;
      },
      volume: (kg: number) => {
        const v = imperial ? kg * LB : kg;
        const u = imperial ? 'lb' : c.common.kg;
        return v >= 10_000 ? `${round1(v / 1000)} ${imperial ? 'k lb' : c.common.min === 'мин' ? 'т' : 't'}` : `${Math.round(v)} ${u}`;
      },
    };
  }, [units, c]);
}

export function formatDay(iso: string, locale: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) {
  return new Date(iso).toLocaleDateString(locale === 'en' ? 'en-US' : 'ru-RU', opts);
}

export function relativeDay(iso: string | null | undefined, locale: string, c: { today: string; yesterday: string; daysAgo: (n: number) => string; never: string }) {
  if (!iso) return c.never;
  const d = new Date(iso);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const dd = new Date(d);
  dd.setHours(0, 0, 0, 0);
  const diff = Math.round((start.getTime() - dd.getTime()) / 86_400_000);
  if (diff <= 0) return c.today;
  if (diff === 1) return c.yesterday;
  if (diff < 7) return c.daysAgo(diff);
  return formatDay(iso, locale);
}
