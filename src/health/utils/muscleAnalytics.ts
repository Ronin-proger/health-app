import { EXERCISES, getExercise } from '../exerciseCatalog';
import { FitnessLocalState } from '../types';
import { getRegion, MUSCLE_REGIONS, MuscleRegionId } from './muscleRegions';

export type TierId = 'novice' | 'intermediate' | 'advanced' | 'elite';

export const TIERS: { id: TierId; min: number }[] = [
  { id: 'novice', min: 0 },
  { id: 'intermediate', min: 25 },
  { id: 'advanced', min: 55 },
  { id: 'elite', min: 85 },
];

export function tierOf(score: number): { id: TierId; index: number; progress: number; nextAt: number | null } {
  let index = 0;
  for (let i = 0; i < TIERS.length; i++) if (score >= TIERS[i].min) index = i;
  const next = TIERS[index + 1];
  const cur = TIERS[index];
  return {
    id: cur.id,
    index,
    progress: next ? Math.min(1, (score - cur.min) / (next.min - cur.min)) : 1,
    nextAt: next ? next.min : null,
  };
}

export type RegionExerciseStat = {
  exerciseId: string;
  name: string;
  sets: number;
  maxWeightKg: number;
  avgWeightKg: number;
  lastAt: string;
};

export type VolumePoint = { label: string; kg: number };

export type Milestone = {
  id: string;
  kind: 'sets' | 'volume' | 'sessions';
  target: number;
  value: number;
  xp: number;
  done: boolean;
};

export type MuscleRegionAnalytics = {
  regionId: MuscleRegionId;
  setCount: number;
  sessionCount: number;
  volumeKg: number;
  lastTrainedAt: string | null;
  avgWeightKg: number;
  maxWeightKg: number;
  /** long-term development 0-100 → tier */
  devScore: number;
  tier: TierId;
  tierIndex: number;
  tierProgress: number;
  tierNextAt: number | null;
  /** how loaded in the last 10 days 0-100 → map colour */
  activityScore: number;
  recoveryPct: number;
  exercises: RegionExerciseStat[];
  setsWeek: number;
  setsMonth: number;
  setsYear: number;
  weeklyVolume: VolumePoint[];
  level: number;
  muscleXp: number;
  milestones: Milestone[];
  isSample: boolean;
};

const DAY = 86_400_000;

function within(iso: string, days: number) {
  return Date.now() - new Date(iso).getTime() < days * DAY;
}

function weeklySeries(logs: { loggedAt: string; reps: number; weightKg: number }[]): VolumePoint[] {
  const now = Date.now();
  return Array.from({ length: 8 }, (_, i) => {
    const end = now - (7 - i) * 7 * DAY;
    const start = end - 7 * DAY;
    const kg = logs
      .filter((l) => {
        const t = new Date(l.loggedAt).getTime();
        return t > start && t <= end;
      })
      .reduce((sum, l) => sum + l.reps * l.weightKg, 0);
    return {
      label: new Date(end).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      kg: Math.round(kg),
    };
  });
}

function milestonesFor(sets: number, volume: number, sessions: number): Milestone[] {
  const defs: Omit<Milestone, 'value' | 'done'>[] = [
    { id: 'sets10', kind: 'sets', target: 10, xp: 20 },
    { id: 'sets50', kind: 'sets', target: 50, xp: 60 },
    { id: 'sets250', kind: 'sets', target: 250, xp: 150 },
    { id: 'vol10k', kind: 'volume', target: 10_000, xp: 80 },
    { id: 'vol100k', kind: 'volume', target: 100_000, xp: 220 },
    { id: 'ses25', kind: 'sessions', target: 25, xp: 120 },
  ];
  return defs.map((d) => {
    const value = d.kind === 'sets' ? sets : d.kind === 'volume' ? volume : sessions;
    return { ...d, value, done: value >= d.target };
  });
}

function devScoreFrom(sets: number, sessions: number, lastAt: string | null) {
  const base = Math.log10(1 + sets) * 26;
  const sessionBonus = Math.min(10, sessions / 3);
  const days = lastAt ? (Date.now() - new Date(lastAt).getTime()) / DAY : 99;
  const recency = days <= 3 ? 10 : days <= 7 ? 6 : days <= 14 ? 3 : 0;
  return Math.min(100, Math.round(base + sessionBonus + recency));
}

function seedOf(id: string) {
  return id.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

function build(
  regionId: MuscleRegionId,
  p: {
    setCount: number;
    sessionCount: number;
    volumeKg: number;
    lastTrainedAt: string | null;
    avgWeightKg: number;
    maxWeightKg: number;
    exercises: RegionExerciseStat[];
    setsWeek: number;
    setsMonth: number;
    setsYear: number;
    recentSets: number;
    weeklyVolume: VolumePoint[];
    recoveryPct: number;
    isSample: boolean;
  }
): MuscleRegionAnalytics {
  const devScore = devScoreFrom(p.setCount, p.sessionCount, p.lastTrainedAt);
  const t = tierOf(devScore);
  return {
    regionId,
    setCount: p.setCount,
    sessionCount: p.sessionCount,
    volumeKg: p.volumeKg,
    lastTrainedAt: p.lastTrainedAt,
    avgWeightKg: p.avgWeightKg,
    maxWeightKg: p.maxWeightKg,
    devScore,
    tier: t.id,
    tierIndex: t.index,
    tierProgress: t.progress,
    tierNextAt: t.nextAt,
    activityScore: Math.min(100, p.recentSets * 7),
    recoveryPct: p.recoveryPct,
    exercises: p.exercises,
    setsWeek: p.setsWeek,
    setsMonth: p.setsMonth,
    setsYear: p.setsYear,
    weeklyVolume: p.weeklyVolume,
    level: Math.max(1, Math.floor(devScore / 6) + 1),
    muscleXp: devScore * 14,
    milestones: milestonesFor(p.setCount, p.volumeKg, p.sessionCount),
    isSample: p.isSample,
  };
}

function sampleAnalytics(regionId: MuscleRegionId, recoveryPct: number): MuscleRegionAnalytics {
  const region = getRegion(regionId);
  const seed = seedOf(regionId);
  const setCount = 14 + (seed % 40);
  const maxWeightKg = 18 + (seed % 70);
  const avgWeightKg = Math.round(maxWeightKg * 0.72 * 10) / 10;
  const last = new Date(Date.now() - (1 + (seed % 6)) * DAY).toISOString();
  const matched = EXERCISES.filter((ex) => region.match(ex.id)).slice(0, 4);
  const exercises: RegionExerciseStat[] = matched.map((ex, i) => ({
    exerciseId: ex.id,
    name: ex.name,
    sets: 4 + ((seed + i) % 9),
    maxWeightKg: Math.max(8, maxWeightKg - i * 6),
    avgWeightKg: Math.max(6, Math.round((avgWeightKg - i * 4) * 10) / 10),
    lastAt: last,
  }));
  return build(regionId, {
    setCount,
    sessionCount: 4 + (seed % 9),
    volumeKg: Math.round(setCount * 8 * avgWeightKg),
    lastTrainedAt: last,
    avgWeightKg,
    maxWeightKg,
    exercises,
    setsWeek: 2 + (seed % 5),
    setsMonth: 8 + (seed % 14),
    setsYear: setCount,
    recentSets: 2 + (seed % 9),
    weeklyVolume: Array.from({ length: 8 }, (_, i) => ({
      label: `${i + 1}`,
      kg: Math.round((10 + (seed % 7)) * (i + 2) * 22 + ((seed * (i + 3)) % 140)),
    })),
    recoveryPct,
    isSample: true,
  });
}

export function muscleRegionAnalytics(
  fitness: FitnessLocalState,
  regionId: MuscleRegionId,
  recoveryPct = 70
): MuscleRegionAnalytics {
  const region = getRegion(regionId);
  const logs = fitness.setLogs.filter((l) => region.match(l.exerciseId));
  if (!logs.length) return sampleAnalytics(regionId, recoveryPct);

  const sessions = new Set<string>();
  let volume = 0;
  let weightSum = 0;
  let maxW = 0;
  let lastAt: string | null = null;
  const byEx = new Map<string, { sets: number; weights: number[]; lastAt: string }>();

  for (const l of logs) {
    if (l.workoutSessionId) sessions.add(l.workoutSessionId);
    volume += l.reps * l.weightKg;
    weightSum += l.weightKg;
    maxW = Math.max(maxW, l.weightKg);
    if (!lastAt || l.loggedAt > lastAt) lastAt = l.loggedAt;
    const cur = byEx.get(l.exerciseId) ?? { sets: 0, weights: [], lastAt: l.loggedAt };
    cur.sets += 1;
    cur.weights.push(l.weightKg);
    if (l.loggedAt > cur.lastAt) cur.lastAt = l.loggedAt;
    byEx.set(l.exerciseId, cur);
  }

  const exercises: RegionExerciseStat[] = [...byEx.entries()]
    .map(([exerciseId, v]) => {
      const ex = getExercise(exerciseId);
      const avg = v.weights.reduce((a, b) => a + b, 0) / v.weights.length;
      return {
        exerciseId,
        name: ex?.name ?? exerciseId,
        sets: v.sets,
        maxWeightKg: Math.max(...v.weights),
        avgWeightKg: Math.round(avg * 10) / 10,
        lastAt: v.lastAt,
      };
    })
    .sort((a, b) => b.sets - a.sets);

  return build(regionId, {
    setCount: logs.length,
    sessionCount: sessions.size,
    volumeKg: Math.round(volume),
    lastTrainedAt: lastAt,
    avgWeightKg: Math.round((weightSum / logs.length) * 10) / 10,
    maxWeightKg: maxW,
    exercises,
    setsWeek: logs.filter((l) => within(l.loggedAt, 7)).length,
    setsMonth: logs.filter((l) => within(l.loggedAt, 30)).length,
    setsYear: logs.filter((l) => within(l.loggedAt, 365)).length,
    recentSets: logs.filter((l) => within(l.loggedAt, 10)).length,
    weeklyVolume: weeklySeries(logs),
    recoveryPct,
    isSample: false,
  });
}

export function allRegionsAnalytics(
  fitness: FitnessLocalState,
  recoveryById: Record<string, number>
): MuscleRegionAnalytics[] {
  return MUSCLE_REGIONS.map((r) => muscleRegionAnalytics(fitness, r.id, recoveryById[r.id] ?? 70));
}
