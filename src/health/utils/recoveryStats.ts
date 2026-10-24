import { FitnessLocalState } from '../types';
import { MUSCLE_REGIONS, MuscleRegionId } from './muscleRegions';

const FULL_RECOVERY_HOURS = 48;

export type MuscleRecoveryRow = {
  id: MuscleRegionId;
  /** 0-100, 100 = fully recovered */
  pct: number;
  hoursSince: number;
};

export function muscleRecoveryRows(fitness: FitnessLocalState): MuscleRecoveryRow[] {
  const lastHit = new Map<string, string>();
  for (const log of fitness.setLogs) {
    for (const region of MUSCLE_REGIONS) {
      if (!region.match(log.exerciseId)) continue;
      const prev = lastHit.get(region.id);
      if (!prev || log.loggedAt > prev) lastHit.set(region.id, log.loggedAt);
    }
  }
  return MUSCLE_REGIONS.map((region) => {
    const iso = lastHit.get(region.id);
    const hours = iso ? (Date.now() - new Date(iso).getTime()) / 3_600_000 : FULL_RECOVERY_HOURS * 2;
    return {
      id: region.id,
      pct: Math.min(100, Math.round((hours / FULL_RECOVERY_HOURS) * 100)),
      hoursSince: Math.round(hours),
    };
  });
}

export function overallRecoveryPct(rows: MuscleRecoveryRow[]): number {
  if (!rows.length) return 72;
  return Math.round(rows.reduce((a, r) => a + r.pct, 0) / rows.length);
}
