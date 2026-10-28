import { describe, expect, it } from 'vitest';
import type { FitnessLocalState, SetLogEntry } from '../types';
import { fitnessStateForSync, mergeFitnessWithLocal } from './fitnessSyncPayload';

function set(id: string, loggedAt: string, weightKg = 40): SetLogEntry {
  return { id, exerciseId: 'bench', reps: 8, weightKg, loggedAt };
}

function state(partial: Partial<FitnessLocalState>): FitnessLocalState {
  return { workouts: [], setLogs: [], ...partial } as FitnessLocalState;
}

describe('mergeFitnessWithLocal', () => {
  it('unions history by id and prefers the local copy', () => {
    const local = state({ setLogs: [set('a', '2026-10-02T10:00:00Z', 50), set('b', '2026-10-03T10:00:00Z')] });
    const server = state({ setLogs: [set('a', '2026-10-02T10:00:00Z', 45), set('c', '2026-10-01T10:00:00Z')] });

    const merged = mergeFitnessWithLocal(local, server);

    expect(merged.setLogs.map((s) => s.id)).toEqual(['b', 'a', 'c']);
    expect(merged.setLogs.find((s) => s.id === 'a')?.weightKg).toBe(50);
  });

  it('ignores server history when the device holds demo data', () => {
    const local = state({ demoSeeded: true, setLogs: [set('demo', '2026-10-02T10:00:00Z')], corpusXp: 100 });
    const server = state({ setLogs: [set('stale', '2026-09-01T10:00:00Z')], corpusXp: 900 });

    const merged = mergeFitnessWithLocal(local, server);

    expect(merged.setLogs.map((s) => s.id)).toEqual(['demo']);
    expect(merged.corpusXp).toBe(100);
  });

  it('keeps the newer daily log and merges same-day counters', () => {
    const day = { date: '2026-10-02', steps: 4000, waterMl: 1500, sleepHours: 0 };
    const merged = mergeFitnessWithLocal(
      state({ dailyLog: day }),
      state({ dailyLog: { ...day, steps: 6000, waterMl: 1000, sleepHours: 7 } }),
    );

    expect(merged.dailyLog).toEqual({ date: '2026-10-02', steps: 6000, waterMl: 1500, sleepHours: 7 });
  });
});

describe('fitnessStateForSync', () => {
  it('trims set history to the newest entries and keeps photos on the device', () => {
    const setLogs = Array.from({ length: 400 }, (_, i) =>
      set(`s${i}`, new Date(Date.UTC(2026, 0, 1) + i * 60_000).toISOString()),
    );
    const payload = fitnessStateForSync(state({ setLogs, progressPhotos: [] }));

    expect(payload.setLogs).toHaveLength(350);
    expect(payload.setLogs[0].id).toBe('s399');
    expect('progressPhotos' in payload).toBe(false);
  });
});
