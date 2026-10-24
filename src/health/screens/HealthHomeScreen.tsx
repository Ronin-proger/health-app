import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronRight, Clock, Droplets, Flame, Footprints, Moon, Play, Zap, Dumbbell } from 'lucide-react';
import { useFitness } from '../FitnessContext';
import { WORKOUT_TEMPLATES, allWorkouts, prescriptionsForWorkout } from '../exerciseCatalog';
import { HabitModals } from '../components/HabitModals';
import { BodyAtlas } from '../components/BodyAtlas';
import { FitImage } from '../components/FitImage';
import { AchIcon } from '../components/AchIcon';
import { CountUp, FxRing, Section, rise, stagger } from '../components/FxBits';
import { fitAchievement, fitWorkoutBlurb, fitWorkoutName } from '../catalog/ruLabels';
import { workoutCoverFallbackUrl } from '../catalog/exercisePhotos';
import { useI18n } from '../../i18n';
import { useCopy } from '../copy';
import { currentWeek, workoutDaySet } from '../utils/calendar';
import { GOALS, HabitKind, useHabits } from '../utils/useHabits';
import { relativeDay } from '../utils/units';
import { suggestWorkout, workoutDifficulty } from '../utils/workoutMeta';
import { levelProgress } from '../gamification';
import { HealthTab } from '../types';

export function HealthHomeScreen({
  displayName,
  onStartWorkout,
  onContinue,
  onOpenWorkout,
  onOpenExercise,
  onGoTab,
}: {
  displayName: string;
  onStartWorkout: (workoutId: string) => void;
  onContinue: () => void;
  onOpenWorkout: (workoutId: string) => void;
  onOpenExercise: (exerciseId: string) => void;
  onGoTab: (t: HealthTab) => void;
}) {
  const { locale } = useI18n();
  const c = useCopy();
  const { corpusStreak, fitness, achievements, live } = useFitness();
  const [modal, setModal] = useState<HabitKind | null>(null);
  const habits = useHabits();

  const all = useMemo(() => allWorkouts(fitness.customWorkouts), [fitness.customWorkouts]);
  const plan = useMemo(() => suggestWorkout(fitness, WORKOUT_TEMPLATES), [fitness]);
  const liveWorkout = live ? all.find((w) => w.id === live.workoutId) : null;
  const week = useMemo(() => currentWeek(), []);
  const days = useMemo(() => workoutDaySet(fitness), [fitness]);
  const weekDone = week.filter((d) => days.has(d.key)).length;
  const lvl = levelProgress(fitness.corpusXp);
  const streak = Math.max(corpusStreak, 0);

  const recent = useMemo(
    () =>
      [...fitness.workouts]
        .filter((w) => w.status === 'completed')
        .sort((a, b) => b.endedAt.localeCompare(a.endedAt))
        .slice(0, 3),
    [fitness.workouts]
  );

  const nextRaw = achievements.filter((a) => !a.unlocked).sort((a, b) => b.progress / b.target - a.progress / a.target)[0];
  const nextAch = nextRaw ? { ...nextRaw, ...fitAchievement(locale, nextRaw.id, nextRaw.title, nextRaw.desc) } : null;

  const widgets: { id: HabitKind | 'weekly'; icon: typeof Footprints; label: string; value: string; goal: string; pct: number }[] = [
    {
      id: 'steps',
      icon: Footprints,
      label: c.home.steps,
      value: habits.steps.toLocaleString(locale),
      goal: `/ ${GOALS.steps.toLocaleString(locale)}`,
      pct: Math.round((habits.steps / GOALS.steps) * 100),
    },
    {
      id: 'water',
      icon: Droplets,
      label: c.home.water,
      value: `${habits.water}`,
      goal: `/ ${GOALS.water} ${c.habit.unitMl}`,
      pct: Math.round((habits.water / GOALS.water) * 100),
    },
    {
      id: 'sleep',
      icon: Moon,
      label: c.home.sleep,
      value: `${habits.sleep || 0}`,
      goal: `/ ${GOALS.sleep} ${c.habit.unitH}`,
      pct: Math.round(((habits.sleep || 0) / GOALS.sleep) * 100),
    },
    {
      id: 'weekly',
      icon: Dumbbell,
      label: c.home.weekly,
      value: `${weekDone}`,
      goal: `/ ${GOALS.weekly}`,
      pct: Math.round((weekDone / GOALS.weekly) * 100),
    },
  ];

  const dayLetter = (d: Date) => d.toLocaleDateString(locale === 'en' ? 'en-US' : 'ru-RU', { weekday: 'short' }).slice(0, 2);
  const liveDone = live ? live.completedExerciseIds.length : 0;
  const liveTotal = liveWorkout ? prescriptionsForWorkout(liveWorkout).length : 0;

  return (
    <motion.div className="fit-scroll fx-screen" variants={stagger} initial="hidden" animate="show">
      <motion.header variants={rise} className="fx-hello">
        <div>
          <span className="fx-kicker">
            {new Date().toLocaleDateString(locale === 'en' ? 'en-US' : 'ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <h2 className="fx-grad-text fx-hello-title">{c.home.hello(displayName.split(' ')[0] || '')}</h2>
          <p>{c.home.sub}</p>
        </div>
        <button type="button" className="fx-lvl" onClick={() => onGoTab('profile')} aria-label={c.common.level}>
          <FxRing pct={lvl.pct} size={58} stroke={5}>
            <b>{lvl.level}</b>
          </FxRing>
          <small>{fitness.corpusXp} XP</small>
        </button>
      </motion.header>

      <motion.section variants={rise} className="fx-card fx-streak">
        <div className="fx-streak-top">
          <span className="fx-flame">
            <Flame size={26} fill="currentColor" />
          </span>
          <div>
            <small>{c.home.streak}</small>
            <strong>
              <CountUp value={streak} /> <em>{c.home.streakDays(streak).replace(/^\d+\s/, '')}</em>
            </strong>
          </div>
          <div className="fx-streak-xp">
            <small>{c.home.xpToNext(lvl.toNext)}</small>
            <div className="fx-bar fx-bar--thin">
              <span style={{ width: `${lvl.pct}%` }} />
            </div>
          </div>
        </div>
        <div className="fx-week">
          {week.map((d, i) => {
            const done = days.has(d.key);
            return (
              <motion.div
                key={d.key}
                className={`fx-day${done ? ' is-done' : ''}${d.isToday ? ' is-today' : ''}${d.isFuture ? ' is-future' : ''}`}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15 + i * 0.05, type: 'spring', stiffness: 380, damping: 20 }}
              >
                <span>{dayLetter(d.date)}</span>
                <i>{done ? <Check size={14} strokeWidth={3} /> : d.date.getDate()}</i>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {live && liveWorkout ? (
        <motion.section variants={rise} className="fx-card fx-continue" onClick={onContinue} role="button" tabIndex={0}>
          <span className="fx-pulse-ring" aria-hidden />
          <div className="fx-continue-ico">
            <Zap size={22} fill="currentColor" />
          </div>
          <div className="fx-continue-main">
            <small>{c.home.continueTitle}</small>
            <b>{fitWorkoutName(locale, liveWorkout.id, liveWorkout.name)}</b>
            <span>{c.home.continueSub(liveDone, liveTotal)}</span>
            <div className="fx-bar fx-bar--thin">
              <span style={{ width: `${liveTotal ? (liveDone / liveTotal) * 100 : 0}%` }} />
            </div>
          </div>
          <span className="fx-btn fx-btn--primary fx-btn--sm">
            <Play size={16} fill="currentColor" /> {c.home.continueBtn}
          </span>
        </motion.section>
      ) : (
        <motion.article variants={rise} className="fx-hero" whileTap={{ scale: 0.985 }} onClick={() => onOpenWorkout(plan.id)}>
          <FitImage
            src={plan.coverUrl}
            fallbackSrc={workoutCoverFallbackUrl(plan.id, plan.exerciseIds[0])}
            alt=""
            variant="hero"
            className="fx-hero-img"
            fallbackLabel={plan.name}
          />
          <div className="fx-hero-shade" />
          <div className="fx-hero-body">
            <span className="fx-chip fx-chip--glass">{c.home.planKicker}</span>
            <h3>{fitWorkoutName(locale, plan.id, plan.name)}</h3>
            <p>{fitWorkoutBlurb(locale, plan.id, plan.description)}</p>
            <div className="fx-hero-meta">
              <span>
                <Clock size={14} /> {plan.durationMin} {c.common.min}
              </span>
              <span>
                <Flame size={14} /> {plan.caloriesEst} {c.common.kcal}
              </span>
              <span className={`fx-diff fx-diff--${workoutDifficulty(plan.exerciseIds)}`}>
                <i />
                <i />
                <i />
              </span>
            </div>
            <button
              type="button"
              className="fx-btn fx-btn--primary fx-btn--lg fx-btn--glow"
              onClick={(e) => {
                e.stopPropagation();
                onStartWorkout(plan.id);
              }}
            >
              <Play size={18} fill="currentColor" /> {c.home.start}
            </button>
          </div>
        </motion.article>
      )}

      <Section title={c.home.quickLog}>
        <motion.div variants={stagger} className="fx-widgets">
          {widgets.map((w) => (
            <motion.button
              key={w.id}
              type="button"
              variants={rise}
              whileTap={{ scale: 0.96 }}
              className={`fx-card fx-widget fx-widget--${w.id}`}
              onClick={() => (w.id === 'weekly' ? onGoTab('progress') : setModal(w.id))}
            >
              <FxRing pct={w.pct} size={50} stroke={5}>
                <w.icon size={18} />
              </FxRing>
              <span className="fx-widget-copy">
                <small>{w.label}</small>
                <strong>
                  {w.value} <em>{w.goal}</em>
                </strong>
              </span>
            </motion.button>
          ))}
        </motion.div>
      </Section>

      <motion.div variants={rise}>
        <BodyAtlas onOpenExercise={onOpenExercise} />
      </motion.div>

      <Section title={c.home.recent}>
        <ul className="fx-list">
          {recent.map((w) => {
            const tpl = all.find((x) => x.id === w.workoutId);
            return (
              <motion.li key={w.id} variants={rise}>
                <button type="button" className="fx-row fx-row--card" onClick={() => onOpenWorkout(w.workoutId)}>
                  <span className="fx-row-thumb fx-row-thumb--lg">
                    {tpl && (
                      <FitImage
                        src={tpl.coverUrl}
                        fallbackSrc={workoutCoverFallbackUrl(tpl.id, tpl.exerciseIds[0])}
                        alt=""
                        variant="thumb"
                        fallbackLabel={w.name}
                      />
                    )}
                  </span>
                  <span className="fx-row-main">
                    <b>{fitWorkoutName(locale, w.workoutId, w.name)}</b>
                    <small>
                      {relativeDay(w.endedAt, locale, c.common)} · {w.durationMin} {c.common.min} · {w.caloriesEst} {c.common.kcal}
                    </small>
                  </span>
                  <ChevronRight size={18} className="fx-row-chev" />
                </button>
              </motion.li>
            );
          })}
        </ul>
      </Section>

      {nextAch && (
        <Section title={c.home.nextAch}>
          <motion.div variants={rise} className={`fx-card fx-next-ach fx-rar--${nextAch.rarity}`} onClick={() => onGoTab('profile')} role="button" tabIndex={0}>
            <span className="fx-medal">
              <AchIcon name={nextAch.icon} size={24} />
            </span>
            <div className="fx-next-ach-main">
              <b>{nextAch.title}</b>
              <small>{nextAch.desc}</small>
              <div className="fx-bar">
                <span style={{ width: `${Math.round((nextAch.progress / nextAch.target) * 100)}%` }} />
              </div>
            </div>
            <span className="fx-xp-badge">+{nextAch.xp} XP</span>
          </motion.div>
        </Section>
      )}

      <HabitModals open={modal} onClose={() => setModal(null)} />
    </motion.div>
  );
}
