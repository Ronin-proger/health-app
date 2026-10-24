import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useFitness } from '../FitnessContext';
import { useCopy } from '../copy';
import { AnatomicalBody, BodySide } from './AnatomicalBody';
import { MuscleAnalyticsSheet } from './MuscleAnalyticsSheet';
import { allRegionsAnalytics } from '../utils/muscleAnalytics';
import { Band, MUSCLE_REGIONS, MuscleRegionId, bandFromScore } from '../utils/muscleRegions';
import { muscleRecoveryRows, overallRecoveryPct } from '../utils/recoveryStats';

export function BodyAtlas({ onOpenExercise }: { onOpenExercise?: (exerciseId: string) => void }) {
  const { fitness } = useFitness();
  const c = useCopy();
  const [side, setSide] = useState<BodySide>('front');
  const [regionId, setRegionId] = useState<MuscleRegionId | null>(null);

  const rows = useMemo(() => muscleRecoveryRows(fitness), [fitness]);
  const recovery = useMemo(() => Object.fromEntries(rows.map((r) => [r.id, r.pct])), [rows]);
  const readiness = overallRecoveryPct(rows);
  const analytics = useMemo(() => allRegionsAnalytics(fitness, recovery), [fitness, recovery]);

  const bands = useMemo(() => {
    const map: Partial<Record<MuscleRegionId, Band>> = {};
    for (const a of analytics) map[a.regionId] = bandFromScore(a.activityScore);
    return map;
  }, [analytics]);

  const visible = useMemo(
    () =>
      MUSCLE_REGIONS.filter((r) => r.side === 'both' || r.side === side)
        .map((r) => analytics.find((a) => a.regionId === r.id)!)
        .sort((a, b) => b.activityScore - a.activityScore),
    [analytics, side]
  );

  const open = (id: MuscleRegionId) => setRegionId(id);
  const sheet = regionId ? analytics.find((a) => a.regionId === regionId) ?? null : null;

  return (
    <>
      <section className="fx-card fx-atlas">
        <div className="fx-atlas-top">
          <div>
            <span className="fx-kicker">{c.atlas.kicker}</span>
            <h2 className="fx-grad-text">{c.atlas.title}</h2>
          </div>
          <div className="fx-ready" title={c.atlas.recovery}>
            <svg viewBox="0 0 36 36" aria-hidden>
              <circle cx="18" cy="18" r="15.5" className="fx-ready-bg" />
              <motion.circle
                cx="18"
                cy="18"
                r="15.5"
                className="fx-ready-fg"
                strokeDasharray="97.4"
                initial={{ strokeDashoffset: 97.4 }}
                animate={{ strokeDashoffset: 97.4 * (1 - readiness / 100) }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
              />
            </svg>
            <b>{readiness}%</b>
            <small>{c.atlas.recovery}</small>
          </div>
        </div>

        <div className="fx-seg" role="tablist">
          {(['front', 'back'] as const).map((s) => (
            <button key={s} type="button" role="tab" aria-selected={side === s} className={side === s ? 'on' : ''} onClick={() => setSide(s)}>
              {s === 'front' ? c.atlas.front : c.atlas.back}
              {side === s && <motion.i layoutId="atlas-seg" className="fx-seg-pill" />}
            </button>
          ))}
        </div>

        <div className="fx-atlas-grid">
          <div className="fx-stage">
            <motion.div
              key={side}
              className="fx-stage-fig"
              initial={{ opacity: 0, rotateY: side === 'front' ? -35 : 35, scale: 0.94 }}
              animate={{ opacity: 1, rotateY: 0, scale: 1 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <AnatomicalBody side={side} bands={bands} selected={regionId} onSelect={open} />
            </motion.div>
          </div>

          <ul className="fx-mlist">
            {visible.map((a) => {
              const band = bandFromScore(a.activityScore);
              return (
                <li key={a.regionId}>
                  <button type="button" className={`fx-mrow fx-mrow--${band}`} onClick={() => open(a.regionId)}>
                    <i className="fx-dot" />
                    <span className="fx-mrow-main">
                      <b>{c.muscle[a.regionId]}</b>
                      <small>
                        {c.tier[a.tier]} · {c.atlas.lvl}
                        {a.level}
                      </small>
                    </span>
                    <span className="fx-mrow-bar">
                      <span style={{ width: `${Math.max(6, a.devScore)}%` }} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="fx-legend">
          <span>
            <i className="fx-dot fx-dot--high" /> {c.atlas.high}
          </span>
          <span>
            <i className="fx-dot fx-dot--mid" /> {c.atlas.mid}
          </span>
          <span>
            <i className="fx-dot fx-dot--rest" /> {c.atlas.rest}
          </span>
        </div>
      </section>

      <MuscleAnalyticsSheet data={sheet} onClose={() => setRegionId(null)} onOpenExercise={onOpenExercise} />
    </>
  );
}
