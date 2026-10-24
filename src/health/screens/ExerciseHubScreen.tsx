import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Dumbbell, Layers, Play, Trophy, Wrench } from 'lucide-react';
import { getExercise } from '../exerciseCatalog';
import { setsForExercise, weightProgressSeries } from '../stats';
import { prByExercise } from '../achievements';
import { useFitness } from '../FitnessContext';
import { FitImage } from '../components/FitImage';
import { MuscleMap } from '../components/MuscleMap';
import { FxArea } from '../components/FxCharts';
import { DifficultyBars } from './HealthWorkoutsScreen';
import { rise, stagger } from '../components/FxBits';
import { exercisePhotoUrl } from '../catalog/exercisePhotos';
import { fitExerciseName } from '../catalog/ruLabels';
import { equipmentLabel, techniqueSteps } from '../catalog/technique';
import { useI18n } from '../../i18n';
import { useCopy } from '../copy';
import { formatDay, useUnits } from '../utils/units';
import { exerciseDifficulty } from '../utils/workoutMeta';
import { exerciseMuscles } from '../utils/muscleRegions';

export function ExerciseHubScreen({ exerciseId, onStart }: { exerciseId: string; onStart: () => void }) {
  const { fitness } = useFitness();
  const { locale } = useI18n();
  const c = useCopy();
  const u = useUnits();
  const ex = getExercise(exerciseId);

  const history = useMemo(
    () => [...setsForExercise(fitness, exerciseId)].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt)).slice(0, 8),
    [fitness, exerciseId]
  );
  const series = useMemo(
    () => weightProgressSeries(fitness, exerciseId).map((p) => ({ label: formatDay(p.date, locale), weight: u.toDisp(p.weight) })),
    [fitness, exerciseId, locale, u]
  );
  const pr = useMemo(() => prByExercise(fitness).find((p) => p.exerciseId === exerciseId), [fitness, exerciseId]);
  const totalSets = useMemo(() => setsForExercise(fitness, exerciseId).length, [fitness, exerciseId]);

  if (!ex) return <p className="fit-empty">—</p>;
  const level = exerciseDifficulty(ex.id);
  const diffLabel = level === 1 ? c.ex.beginner : level === 2 ? c.ex.intermediate : c.ex.advanced;
  const name = fitExerciseName(locale, ex.id, ex.name);
  const steps = techniqueSteps(locale, ex.id);
  const m = exerciseMuscles(ex.id);

  return (
    <motion.div className="fit-scroll fx-screen fx-screen--cta" variants={stagger} initial="hidden" animate="show">
      <motion.div variants={rise} className="fx-hero fx-hero--exercise">
        <FitImage src={exercisePhotoUrl(ex.id, 900, 700)} alt={name} variant="hero" className="fx-hero-img" fallbackLabel={name} loading="eager" />
        <div className="fx-hero-shade" />
        <div className="fx-hero-body">
          <div className="fx-hero-chips">
            <DifficultyBars level={level} label={diffLabel} />
            <span className="fx-chip fx-chip--glass">
              <Wrench size={12} /> {equipmentLabel(locale, ex.equipment)}
            </span>
          </div>
          <h3>{name}</h3>
          <p>{m.primary.map((r) => c.muscle[r]).join(' · ')}</p>
        </div>
      </motion.div>

      <motion.div variants={rise} className="fx-stat-grid fx-stat-grid--4">
        <div className="fx-stat">
          <Layers size={16} />
          <strong>{ex.defaultSets}</strong>
          <span>{c.common.sets}</span>
        </div>
        <div className="fx-stat">
          <Dumbbell size={16} />
          <strong>{ex.defaultReps}</strong>
          <span>{c.common.reps}</span>
        </div>
        <div className="fx-stat">
          <Clock size={16} />
          <strong>{ex.restSec}</strong>
          <span>{c.common.min === 'мин' ? 'сек' : 'sec'}</span>
        </div>
        <div className="fx-stat fx-stat--accent">
          <Trophy size={16} />
          <strong>{pr ? u.num(pr.weight) : '—'}</strong>
          <span>{pr ? u.unit : c.ex.record}</span>
        </div>
      </motion.div>

      <motion.section variants={rise} className="fx-section">
        <h2 className="fx-h2">{c.ex.muscles}</h2>
        <div className="fx-card">
          <MuscleMap exerciseId={ex.id} />
        </div>
      </motion.section>

      <motion.section variants={rise} className="fx-section">
        <h2 className="fx-h2">{c.ex.technique}</h2>
        <ol className="fx-steps">
          {steps.map((s, i) => (
            <li key={i} className="fx-card fx-card--flat">
              <span>{i + 1}</span>
              <p>{s}</p>
            </li>
          ))}
        </ol>
      </motion.section>

      <motion.section variants={rise} className="fx-section">
        <div className="fx-section-head">
          <h2 className="fx-h2">{c.ex.record}</h2>
          {totalSets > 0 && (
            <span className="fx-chip">
              {totalSets} {c.progress.totalSets}
            </span>
          )}
        </div>
        {pr ? (
          <div className="fx-card fx-pr-card">
            <span className="fx-medal">
              <Trophy size={24} />
            </span>
            <div>
              <strong>
                {u.fmt(pr.weight)} × {pr.reps}
              </strong>
              <small>{formatDay(pr.date, locale, { day: 'numeric', month: 'long', year: 'numeric' })}</small>
            </div>
          </div>
        ) : (
          <div className="fx-card fx-card--flat fx-empty-card">
            <Trophy size={20} />
            <p>{c.ex.noHistory}</p>
          </div>
        )}
        {series.length >= 2 && (
          <div className="fx-card fx-card--flat">
            <p className="fx-label">{c.ex.chart}</p>
            <FxArea data={series} x="label" y="weight" height={150} fmt={(v) => `${v} ${u.unit}`} yDomain={['dataMin - 5', 'dataMax + 5']} />
          </div>
        )}
      </motion.section>

      <motion.section variants={rise} className="fx-section">
        <h2 className="fx-h2">{c.ex.history}</h2>
        {history.length ? (
          <ul className="fx-hist">
            {history.map((h) => (
              <li key={h.id}>
                <span>{formatDay(h.loggedAt, locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                <b>
                  {h.reps} × {u.fmt(h.weightKg)}
                </b>
                {h.rpe && <em>RPE {h.rpe}</em>}
              </li>
            ))}
          </ul>
        ) : (
          <div className="fx-card fx-card--flat fx-empty-card">
            <Dumbbell size={20} />
            <p>{c.ex.noHistory}</p>
          </div>
        )}
      </motion.section>

      <div className="fx-cta-bar">
        <button type="button" className="fx-btn fx-btn--primary fx-btn--lg fx-btn--block fx-btn--glow" onClick={onStart}>
          <Play size={18} fill="currentColor" /> {c.ex.start}
        </button>
      </div>
    </motion.div>
  );
}
