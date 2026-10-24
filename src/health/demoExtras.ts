import { localDayKey } from './utils/calendar';
import { DailyLog, FitnessLocalState, NoteEntry, WeightEntry } from './types';

const DAY = 86_400_000;

function isoDay(offset: number) {
  return localDayKey(new Date(Date.now() - offset * DAY));
}

/** Lived-in profile data so no screen opens empty. Never overwrites real user data. */
export function withDemoExtras(state: FitnessLocalState): FitnessLocalState {
  const next = { ...state };
  const target = state.bodyProfile?.targetWeightKg ?? 74;
  const now = state.bodyProfile?.weightKg ?? 76;

  if (!next.weightHistory?.length) {
    const start = Math.max(now + 4.6, target + 5);
    const wiggle = [0, 0.3, -0.2, 0.4, -0.1, 0.2, -0.3, 0.1, 0, 0];
    const pts = 10;
    const hist: WeightEntry[] = [];
    for (let i = 0; i < pts; i++) {
      const k = i / (pts - 1);
      const kg = start + (now - start) * (1 - Math.pow(1 - k, 1.4)) + (i === pts - 1 ? 0 : wiggle[i]);
      hist.push({ date: isoDay(Math.round((pts - 1 - i) * 9.5)), kg: Math.round(kg * 10) / 10 });
    }
    next.weightHistory = hist;
  }

  if (!next.notes?.length) {
    const notes: NoteEntry[] = [
      { id: 'demo-n1', at: new Date(Date.now() - 2 * DAY).toISOString(), text: 'Жим лёжа пошёл легко, на следующей неделе добавлю 2.5 кг.' },
      { id: 'demo-n2', at: new Date(Date.now() - 9 * DAY).toISOString(), text: 'Плохо спал — тренировку сделал короче, без добивающих подходов.' },
    ];
    next.notes = notes;
  }

  if (!next.dailyHistory?.length) {
    const hist: DailyLog[] = [];
    const steps = [8420, 11250, 9640, 7310, 12480, 10120];
    const water = [2100, 2600, 1900, 2300, 2750, 2400];
    const sleep = [7.2, 8.1, 6.8, 7.5, 8.4, 7.9];
    for (let i = 6; i >= 1; i--) {
      hist.push({ date: isoDay(i), steps: steps[6 - i], waterMl: water[6 - i], sleepHours: sleep[6 - i] });
    }
    next.dailyHistory = hist;
  }

  if (!next.settings) next.settings = { units: 'metric', theme: 'midnight' };
  return next;
}

