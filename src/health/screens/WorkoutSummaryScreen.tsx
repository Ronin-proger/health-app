import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, Clock, Dumbbell, Flame, Layers, Sparkles, Trophy, Weight } from 'lucide-react';
import { useFitness } from '../FitnessContext';
import { getExercise } from '../exerciseCatalog';
import { fireWorkoutConfetti } from '../utils/confetti';
import { CountUp, rise, stagger } from '../components/FxBits';
import { fitExerciseName, fitWorkoutName } from '../catalog/ruLabels';
import { useI18n } from '../../i18n';
import { useCopy } from '../copy';
import { levelProgress } from '../gamification';
import { useUnits } from '../utils/units';

export function WorkoutSummaryScreen({
  sessionId,
  xpEarned,
  onDone,
  onWorkouts,
}: {
  sessionId: string;
  xpEarned: number;
  onDone: () => void;
  onWorkouts: () => void;
}) {
  const { fitness } = useFitness();
  const { locale } = useI18n();
  const c = useCopy();
  const u = useUnits();
  const workout = fitness.workouts.find((w) => w.id === sessionId);

  const stats = useMemo(() => {
    const mine = fitness.setLogs.filter((l) => l.workoutSessionId === sessionId);
    const earlier = fitness.setLogs.filter((l) => l.workoutSessionId !== sessionId);
    const volume = mine.reduce((s, l) => s + l.reps * l.weightKg, 0);
    const bestNow = new Map<string, { weight: number; reps: number }>();
    for (const l of mine) {
      const cur = bestNow.get(l.exerciseId);
      if (!cur || l.weightKg > cur.weight) bestNow.set(l.exerciseId, { weight: l.weightKg, reps: l.reps });
    }
    const records: { id: string; weight: number; reps: number; prev: number }[] = [];
    for (const [id, b] of bestNow) {
      const prev = earlier.filter((l) => l.exerciseId === id).reduce((m, l) => Math.max(m, l.weightKg), 0);
      if (b.weight > prev) records.push({ id, weight: b.weight, reps: b.reps, prev });
    }
    return { sets: mine.length, volume, exercises: bestNow.size, records };
  }, [fitness.setLogs, sessionId]);

  const after = levelProgress(fitness.corpusXp);
  const before = levelProgress(Math.max(0, fitness.corpusXp - xpEarned));
  const leveled = after.level > before.level;
  const [barPct, setBarPct] = useState(before.pct);

  useEffect(() => {
    fireWorkoutConfetti();
    const t1 = window.setTimeout(() => setBarPct(leveled ? 100 : after.pct), 700);
    const t2 = leveled ? window.setTimeout(() => setBarPct(after.pct), 1900) : undefined;
    const t3 = window.setTimeout(() => fireWorkoutConfetti(), 1000);
    return () => {
      window.clearTimeout(t1);
      if (t2) window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!workout) return <p className="fit-empty">—</p>;

  const tiles = [
    { icon: Clock, v: workout.durationMin, label: c.sum.duration, suffix: c.common.min },
    { icon: Flame, v: workout.caloriesEst, label: c.sum.kcal, suffix: '' },
    { icon: Weight, v: Math.round(u.toDisp(stats.volume)), label: c.sum.volume, suffix: u.unit },
    { icon: Layers, v: stats.sets, label: c.sum.sets, suffix: '' },
  ];

  return (
    <div className="fx-summary">
      <motion.div className="fx-summary-scroll" variants={stagger} initial="hidden" animate="show">
        <motion.div variants={rise} className="fx-sum-hero">
          <div className="fx-sum-badge">
            <span className="fx-sum-ring fx-sum-ring--a" />
            <span className="fx-sum-ring fx-sum-ring--b" />
            <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.1 }}>
              <Trophy size={44} />
            </motion.div>
          </div>
          <span className="fx-kicker">{c.sum.kicker}</span>
          <h2 className="fx-grad-text">{c.sum.title}</h2>
          <p>{fitWorkoutName(locale, workout.workoutId, workout.name)}</p>
        </motion.div>

        <motion.div variants={rise} className="fx-sum-grid">
          {tiles.map((t) => (
            <div key={t.label} className="fx-card fx-sum-tile">
              <t.icon size={16} />
              <strong>
                <CountUp value={t.v} duration={1100} />
                {t.suffix && <em> {t.suffix}</em>}
              </strong>
              <span>{t.label}</span>
            </div>
          ))}
        </motion.div>

        <motion.div variants={rise} className="fx-card fx-sum-xp">
          <div className="fx-sum-xp-top">
            <div>
              <small>{c.sum.xp}</small>
              <strong>
                +<CountUp value={xpEarned} duration={1200} /> XP
              </strong>
            </div>
            <div className={`fx-lvl-pill${leveled ? ' up' : ''}`}>
              {leveled && <ArrowUp size={14} />}
              {c.sum.level} {after.level}
            </div>
          </div>
          <div className="fx-bar fx-bar--lg">
            <span style={{ width: `${barPct}%`, transition: 'width 1.1s cubic-bezier(.22,1,.36,1)' }} />
          </div>
          <small className="fx-sum-xp-foot">
            {leveled ? (
              <>
                <Sparkles size={13} /> {c.sum.levelUp}
              </>
            ) : (
              c.home.xpToNext(after.toNext)
            )}
          </small>
        </motion.div>

        <motion.section variants={rise} className="fx-section">
          <h2 className="fx-h2">{c.sum.records}</h2>
          {stats.records.length ? (
            <ul className="fx-list fx-list--gap">
              {stats.records.map((r) => {
                const ex = getExercise(r.id);
                return (
                  <li key={r.id} className="fx-card fx-record">
                    <span className="fx-medal">
                      <Trophy size={20} />
                    </span>
                    <div>
                      <b>{fitExerciseName(locale, r.id, ex?.name ?? r.id)}</b>
                      <small>
                        {u.fmt(r.weight)} × {r.reps}
                        {r.prev > 0 && ` · +${u.toDisp(r.weight - r.prev)} ${u.unit}`}
                      </small>
                    </div>
                    <span className="fx-xp-badge">PR</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="fx-card fx-card--flat fx-empty-card">
              <Dumbbell size={20} />
              <p>{c.sum.noRecords}</p>
            </div>
          )}
        </motion.section>
      </motion.div>

      <div className="fx-cta-bar fx-cta-bar--sum">
        <button type="button" className="fx-btn fx-btn--ghost fx-btn--lg" onClick={onWorkouts}>
          {c.sum.again}
        </button>
        <button type="button" className="fx-btn fx-btn--primary fx-btn--lg fx-btn--glow" onClick={onDone}>
          {c.sum.done}
        </button>
      </div>
    </div>
  );
}
