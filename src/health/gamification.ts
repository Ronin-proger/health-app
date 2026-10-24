import { FitnessLocalState } from './types';
import { WORKOUT_TEMPLATES } from './exerciseCatalog';

export function xpFromSet() {
  return 8;
}

export function xpFromWorkout(durationMin: number, totalSets: number) {
  return 40 + durationMin * 2 + totalSets * 3;
}

export function levelFromXp(xp: number) {
  return Math.max(1, Math.floor(Math.sqrt(xp / 75)));
}

export function xpToNextLevel(level: number) {
  const next = level + 1;
  return next * next * 75;
}

export function programsForLevel(level: number) {
  const all = WORKOUT_TEMPLATES.map((w) => w.id);
  if (level >= 2) return all;
  return all.slice(0, 4);
}

export function applyXp(state: FitnessLocalState, added: number): FitnessLocalState {
  const corpusXp = state.corpusXp + added;
  const corpusLevel = levelFromXp(corpusXp);
  return {
    ...state,
    corpusXp,
    corpusLevel,
    unlockedProgramIds: programsForLevel(corpusLevel),
  };
}

export function levelProgress(xp: number) {
  const level = levelFromXp(xp);
  const floor = level * level * 75;
  const ceil = (level + 1) * (level + 1) * 75;
  const into = Math.max(0, xp - floor);
  const span = ceil - floor;
  return { level, into, span, pct: Math.min(100, Math.round((into / span) * 100)), toNext: Math.max(0, ceil - xp) };
}
