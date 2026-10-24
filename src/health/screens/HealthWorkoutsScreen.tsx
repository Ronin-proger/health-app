import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, ChevronRight, Clock, Dumbbell, Flame, Lock, Pencil, Play, Plus, Star } from 'lucide-react';
import { useFitness } from '../FitnessContext';
import { allWorkouts, prescriptionsForWorkout } from '../exerciseCatalog';
import { MuscleGroup } from '../types';
import { FitImage } from '../components/FitImage';
import { rise, stagger } from '../components/FxBits';
import { workoutCoverFallbackUrl, workoutCoverUrl } from '../catalog/exercisePhotos';
import { fitWorkoutBlurb, fitWorkoutName } from '../catalog/ruLabels';
import { useI18n } from '../../i18n';
import { useCopy } from '../copy';
import { relativeDay } from '../utils/units';
import { workoutDifficulty, workoutRating, workoutStats } from '../utils/workoutMeta';

export function DifficultyBars({ level, label }: { level: 1 | 2 | 3; label?: string }) {
  return (
    <span className={`fx-diff fx-diff--${level}`}>
      <i />
      <i />
      <i />
      {label && <b>{label}</b>}
    </span>
  );
}

export function HealthWorkoutsScreen({
  onOpenWorkout,
  onStartWorkout,
  onAddWorkout,
  onEditWorkout,
  onOpenCatalog,
}: {
  onOpenWorkout: (id: string) => void;
  onStartWorkout: (id: string) => void;
  onAddWorkout: () => void;
  onEditWorkout: (id: string) => void;
  onOpenCatalog: () => void;
}) {
  const { fitness, live } = useFitness();
  const { locale } = useI18n();
  const c = useCopy();
  const [filter, setFilter] = useState<MuscleGroup>('all');

  const filters: { id: MuscleGroup; label: string }[] = [
    { id: 'all', label: c.workouts.filterAll },
    { id: 'push', label: c.workouts.push },
    { id: 'pull', label: c.workouts.pull },
    { id: 'legs', label: c.workouts.legs },
    { id: 'core', label: c.workouts.core },
  ];

  const list = useMemo(
    () => allWorkouts(fitness.customWorkouts).filter((w) => filter === 'all' || w.muscleGroup === filter),
    [fitness.customWorkouts, filter]
  );
  const diffLabel = (l: 1 | 2 | 3) => (l === 1 ? c.workouts.easy : l === 2 ? c.workouts.medium : c.workouts.hard);

  return (
    <motion.div className="fit-scroll fx-screen" variants={stagger} initial="hidden" animate="show">
      <motion.div variants={rise} className="fx-pills" role="tablist">
        {filters.map((f) => (
          <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} className={`fx-pill${filter === f.id ? ' on' : ''}`} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </motion.div>

      <motion.div variants={rise} className="fx-actions-row">
        <button type="button" className="fx-card fx-action" onClick={onOpenCatalog}>
          <span className="fx-action-ico">
            <BookOpen size={20} />
          </span>
          <b>{c.workouts.library}</b>
          <ChevronRight size={16} className="fx-row-chev" />
        </button>
        <button type="button" className="fx-card fx-action" onClick={onAddWorkout}>
          <span className="fx-action-ico">
            <Plus size={20} />
          </span>
          <b>{c.workouts.create}</b>
          <ChevronRight size={16} className="fx-row-chev" />
        </button>
      </motion.div>

      <ul className="fx-wlist">
        {list.map((w) => {
          const st = workoutStats(fitness, w.id);
          const level = workoutDifficulty(w.exerciseIds);
          const isLive = live?.workoutId === w.id;
          const total = prescriptionsForWorkout(w).length;
          const done = isLive ? live!.completedExerciseIds.length : 0;
          const locked = w.builtin && !fitness.unlockedProgramIds.includes(w.id);
          return (
            <motion.li key={w.id} variants={rise}>
              <article className={`fx-card fx-wcard${isLive ? ' is-live' : ''}`}>
                <button type="button" className="fx-wcard-photo" onClick={() => onOpenWorkout(w.id)} aria-label={w.name}>
                  <FitImage
                    src={w.coverUrl ?? workoutCoverUrl(w.id, w.exerciseIds[0])}
                    fallbackSrc={workoutCoverFallbackUrl(w.id, w.exerciseIds[0])}
                    alt=""
                    variant="card"
                    fallbackLabel={w.name}
                  />
                  <span className="fx-wcard-shade" />
                  <span className="fx-wcard-top">
                    <DifficultyBars level={level} label={diffLabel(level)} />
                    <span className="fx-rating">
                      <Star size={13} fill="currentColor" /> {workoutRating(w.id).toFixed(1)}
                    </span>
                  </span>
                  {isLive && (
                    <span className="fx-live-badge">
                      <i /> {c.workouts.inProgress}
                    </span>
                  )}
                  <span className="fx-wcard-title">
                    <b>{fitWorkoutName(locale, w.id, w.name)}</b>
                    <small>{fitWorkoutBlurb(locale, w.id, w.description ?? '')}</small>
                  </span>
                </button>

                <div className="fx-wcard-body">
                  <div className="fx-wcard-stats">
                    <span>
                      <Clock size={14} /> {w.durationMin} {c.common.min}
                    </span>
                    <span>
                      <Flame size={14} /> {w.caloriesEst} {c.common.kcal}
                    </span>
                    <span>
                      <Dumbbell size={14} /> {c.workouts.exercisesCount(total)}
                    </span>
                  </div>

                  <p className="fx-wcard-hist">
                    <CheckCircle2 size={14} />
                    {st.count > 0 ? c.workouts.done(st.count) : c.workouts.never}
                    {st.last && <em> · {c.workouts.last(relativeDay(st.last, locale, c.common))}</em>}
                  </p>

                  {isLive && (
                    <div className="fx-wcard-progress">
                      <div className="fx-bar fx-bar--thin">
                        <span style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
                      </div>
                      <small>
                        {done}/{total}
                      </small>
                    </div>
                  )}

                  <div className="fx-wcard-actions">
                    <button
                      type="button"
                      className={`fx-btn fx-btn--primary fx-btn--block${isLive ? ' fx-btn--pulse' : ''}`}
                      disabled={locked}
                      onClick={() => onStartWorkout(w.id)}
                    >
                      {locked ? <Lock size={16} /> : <Play size={16} fill="currentColor" />}
                      {isLive ? c.workouts.cont : c.workouts.start}
                    </button>
                    {!w.builtin && (
                      <button type="button" className="fx-icon-btn" onClick={() => onEditWorkout(w.id)} aria-label={c.wd.edit}>
                        <Pencil size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            </motion.li>
          );
        })}
      </ul>
    </motion.div>
  );
}
