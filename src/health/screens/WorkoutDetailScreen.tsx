import { motion } from 'framer-motion';
import { Check, ChevronRight, Clock, Dumbbell, Flame, Lock, Play, Star, Trophy } from 'lucide-react';
import { useFitness } from '../FitnessContext';
import { allWorkouts, getExercise, prescriptionsForWorkout } from '../exerciseCatalog';
import { FitImage } from '../components/FitImage';
import { DifficultyBars } from './HealthWorkoutsScreen';
import { rise, stagger } from '../components/FxBits';
import { exercisePhotoUrl, workoutCoverFallbackUrl } from '../catalog/exercisePhotos';
import { fitExerciseName, fitWorkoutBlurb, fitWorkoutName } from '../catalog/ruLabels';
import { useI18n } from '../../i18n';
import { useCopy } from '../copy';
import { relativeDay, useUnits } from '../utils/units';
import { workoutDifficulty, workoutRating, workoutStats } from '../utils/workoutMeta';

export function WorkoutDetailScreen({
  workoutId,
  onStart,
  onOpenExercise,
}: {
  workoutId: string;
  onStart: () => void;
  onOpenExercise: (exerciseId: string) => void;
}) {
  const { fitness, live, startLiveWorkout, toggleLiveExercise } = useFitness();
  const { locale } = useI18n();
  const c = useCopy();
  const u = useUnits();
  const workout = allWorkouts(fitness.customWorkouts).find((w) => w.id === workoutId);
  if (!workout) return <p className="fit-empty">—</p>;

  const rxList = prescriptionsForWorkout(workout);
  const isLive = live?.workoutId === workout.id;
  const done = isLive ? live!.completedExerciseIds : [];
  const st = workoutStats(fitness, workout.id);
  const level = workoutDifficulty(workout.exerciseIds);
  const locked = workout.builtin && !fitness.unlockedProgramIds.includes(workout.id);
  const diffLabel = level === 1 ? c.workouts.easy : level === 2 ? c.workouts.medium : c.workouts.hard;

  const toggle = (id: string) => {
    if (!isLive) startLiveWorkout(workout.id);
    toggleLiveExercise(id);
  };

  return (
    <motion.div className="fit-scroll fx-screen fx-screen--cta" variants={stagger} initial="hidden" animate="show">
      <motion.div variants={rise} className="fx-hero fx-hero--detail">
        <FitImage
          src={workout.coverUrl}
          fallbackSrc={workoutCoverFallbackUrl(workout.id, workout.exerciseIds[0])}
          alt=""
          variant="hero"
          className="fx-hero-img"
          fallbackLabel={workout.name}
        />
        <div className="fx-hero-shade" />
        <div className="fx-hero-body">
          <div className="fx-hero-chips">
            <DifficultyBars level={level} label={diffLabel} />
            <span className="fx-rating">
              <Star size={13} fill="currentColor" /> {workoutRating(workout.id).toFixed(1)}
            </span>
          </div>
          <h3>{fitWorkoutName(locale, workout.id, workout.name)}</h3>
          <p>{fitWorkoutBlurb(locale, workout.id, workout.description ?? '')}</p>
          <div className="fx-hero-meta">
            <span>
              <Clock size={14} /> {workout.durationMin} {c.common.min}
            </span>
            <span>
              <Flame size={14} /> {workout.caloriesEst} {c.common.kcal}
            </span>
            <span>
              <Dumbbell size={14} /> {rxList.length}
            </span>
          </div>
        </div>
      </motion.div>

      <motion.div variants={rise} className="fx-stat-grid fx-stat-grid--3">
        <div className="fx-stat">
          <Trophy size={16} />
          <strong>{st.count}</strong>
          <span>{c.wd.completions}</span>
        </div>
        <div className="fx-stat">
          <Clock size={16} />
          <strong className="fx-stat-sm">{relativeDay(st.last, locale, c.common)}</strong>
          <span>{c.wd.lastDone}</span>
        </div>
        <div className="fx-stat">
          <Dumbbell size={16} />
          <strong className="fx-stat-sm">{st.volumeKg ? u.volume(st.volumeKg) : '—'}</strong>
          <span>{c.wd.volume}</span>
        </div>
      </motion.div>

      <motion.section variants={rise} className="fx-section">
        <div className="fx-section-head">
          <h2 className="fx-h2">{c.wd.exercises}</h2>
          <span className="fx-chip">{c.wd.progress(done.length, rxList.length)}</span>
        </div>
        <div className="fx-bar">
          <span style={{ width: `${rxList.length ? (done.length / rxList.length) * 100 : 0}%` }} />
        </div>

        <ul className="fx-list fx-list--gap">
          {rxList.map((rx, index) => {
            const ex = getExercise(rx.exerciseId);
            if (!ex) return null;
            const isDone = done.includes(rx.exerciseId);
            return (
              <motion.li key={rx.exerciseId} variants={rise}>
                <div className={`fx-card fx-exrow${isDone ? ' is-done' : ''}`}>
                  <button type="button" className="fx-exrow-main" onClick={() => onOpenExercise(rx.exerciseId)}>
                    <span className="fx-exrow-photo">
                      <FitImage src={exercisePhotoUrl(rx.exerciseId)} alt="" variant="thumb" fallbackLabel={ex.name} />
                      <i>{index + 1}</i>
                    </span>
                    <span className="fx-exrow-text">
                      <b>{fitExerciseName(locale, rx.exerciseId, ex.name)}</b>
                      <small>
                        {c.wd.setsReps(rx.sets, rx.reps)} В· {u.fmt(rx.weightKg)}
                      </small>
                    </span>
                    <ChevronRight size={18} className="fx-row-chev" />
                  </button>
                  <button
                    type="button"
                    className={`fx-check${isDone ? ' on' : ''}`}
                    onClick={() => toggle(rx.exerciseId)}
                    aria-pressed={isDone}
                    aria-label={c.wd.mark}
                  >
                    <Check size={18} strokeWidth={3} />
                  </button>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </motion.section>

      <div className="fx-cta-bar">
        <button type="button" className={`fx-btn fx-btn--primary fx-btn--lg fx-btn--block fx-btn--glow${isLive ? ' fx-btn--pulse' : ''}`} disabled={locked} onClick={onStart}>
          {locked ? <Lock size={18} /> : <Play size={18} fill="currentColor" />}
          {isLive ? c.wd.cont : c.wd.started}
        </button>
      </div>
    </motion.div>
  );
}

