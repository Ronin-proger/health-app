import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FitnessProvider, useFitness } from './FitnessContext';
import { HealthChrome } from './components/HealthChrome';
import { HealthTabBar } from './components/HealthTabBar';
import { FitSkeleton } from './components/FitSkeleton';
import { LiveMiniBar } from './components/LiveMiniBar';
import { AchievementUnlock } from './components/AchievementUnlock';
import { HealthHomeScreen } from './screens/HealthHomeScreen';
import { HealthWorkoutsScreen } from './screens/HealthWorkoutsScreen';
import { HealthProgressScreen } from './screens/HealthProgressScreen';
import { HealthProfileScreen } from './screens/HealthProfileScreen';
import { WorkoutDetailScreen } from './screens/WorkoutDetailScreen';
import { WorkoutLiveScreen } from './screens/WorkoutLiveScreen';
import { WorkoutSummaryScreen } from './screens/WorkoutSummaryScreen';
import { CustomWorkoutEditor } from './screens/CustomWorkoutEditor';
import { ExerciseLibraryScreen } from './screens/ExerciseLibraryScreen';
import { ExerciseHubScreen } from './screens/ExerciseHubScreen';
import { FitnessAchievement, HealthStack, HealthTab } from './types';
import { allWorkouts, getExercise, EXERCISES, WORKOUT_TEMPLATES } from './exerciseCatalog';
import { fitExerciseName, fitWorkoutName } from './catalog/ruLabels';
import { xpFromSet } from './gamification';
import { useI18n } from '../i18n';
import { useCopy } from './copy';
import { getTelegramWebApp, telegramBackButtonSupported, telegramThemeColorsSupported } from './utils/telegramWebApp';

const THEME_BG = { midnight: '#07080c', amoled: '#000000', graphite: '#15171c' } as const;

function HealthModuleInner({
  onExit,
  pushToast,
  displayName,
  unlocks,
  dismissUnlock,
}: {
  onExit: () => void;
  pushToast: (m: string, t?: 'success' | 'xp') => void;
  displayName: string;
  unlocks: FitnessAchievement[];
  dismissUnlock: () => void;
}) {
  const { locale } = useI18n();
  const c = useCopy();
  const { fitness, booting, live, startLiveWorkout, finishLiveWorkout } = useFitness();
  const [tab, setTab] = useState<HealthTab>('home');
  const [stack, setStack] = useState<HealthStack[]>([]);

  const push = (s: HealthStack) => setStack((prev) => [...prev, s]);
  const pop = () => setStack((prev) => prev.slice(0, -1));
  const top = stack[stack.length - 1];
  const fullscreen = top?.kind === 'live' || top?.kind === 'summary';
  const theme = fitness.settings?.theme ?? 'midnight';

  const stackKey = top
    ? `${top.kind}-${'workoutId' in top ? (top.workoutId ?? '') : ''}-${'exerciseId' in top ? (top.exerciseId ?? '') : ''}-${top.kind === 'live' || top.kind === 'summary' ? top.sessionId : ''}`
    : tab;

  const goTab = (next: HealthTab) => {
    setStack([]);
    setTab(next);
  };

  const handleBack = useCallback(() => {
    setStack((prev) => prev.slice(0, -1));
  }, []);

  /** Start (or resume) a workout; replaces any live screen already on the stack. */
  const launchWorkout = (workoutId: string, exerciseId?: string) => {
    const sessionId = live && live.workoutId === workoutId ? live.sessionId : startLiveWorkout(workoutId);
    setStack((prev) => {
      const i = prev.findIndex((s) => s.kind === 'live');
      const base = i >= 0 ? prev.slice(0, i) : prev;
      return [...base, { kind: 'live', workoutId, sessionId, exerciseId }];
    });
  };

  const resumeLive = () => {
    if (live) launchWorkout(live.workoutId);
  };

  const workoutForExercise = (exerciseId: string) => {
    if (live) {
      const w = allWorkouts(fitness.customWorkouts).find((x) => x.id === live.workoutId);
      if (w?.exerciseIds.includes(exerciseId)) return w.id;
    }
    return (
      allWorkouts(fitness.customWorkouts).find((w) => w.exerciseIds.includes(exerciseId))?.id ??
      WORKOUT_TEMPLATES[0].id
    );
  };

  useEffect(() => {
    const tg = getTelegramWebApp() as
      | (NonNullable<ReturnType<typeof getTelegramWebApp>> & {
          contentSafeAreaInset?: { top?: number; bottom?: number };
          safeAreaInset?: { top?: number; bottom?: number };
          setHeaderColor?: (color: string) => void;
          setBackgroundColor?: (color: string) => void;
        })
      | undefined;
    const topInset = tg?.contentSafeAreaInset?.top ?? tg?.safeAreaInset?.top ?? 0;
    const bottomInset = tg?.contentSafeAreaInset?.bottom ?? tg?.safeAreaInset?.bottom ?? 0;
    document.documentElement.style.setProperty('--tg-top', `${topInset}px`);
    document.documentElement.style.setProperty('--tg-bottom', `${bottomInset}px`);
    if (telegramThemeColorsSupported()) {
      tg?.setHeaderColor?.(THEME_BG[theme]);
      tg?.setBackgroundColor?.(THEME_BG[theme]);
    }
  }, [theme]);

  useEffect(() => {
    if (!telegramBackButtonSupported()) return;
    const tg = getTelegramWebApp();
    const back = tg?.BackButton;
    if (!back) return;
    if (top) {
      back.show();
      const onBack = () => handleBack();
      back.onClick(onBack);
      return () => {
        back.offClick(onBack);
        back.hide();
      };
    }
    back.hide();
  }, [top, handleBack]);

  let title: string = c.nav[tab];
  let subtitle: string | undefined = tab === 'home' ? c.chrome.homeSub : tab === 'workouts' ? c.chrome.workoutsSub : undefined;
  if (top?.kind === 'workout') {
    const w = allWorkouts(fitness.customWorkouts).find((x) => x.id === top.workoutId);
    title = w ? fitWorkoutName(locale, w.id, w.name) : c.chrome.workout;
    subtitle = undefined;
  } else if (top?.kind === 'add-workout') {
    title = c.chrome.newWorkout;
    subtitle = undefined;
  } else if (top?.kind === 'edit-workout') {
    title = c.chrome.editWorkout;
    subtitle = undefined;
  } else if (top?.kind === 'catalog') {
    title = c.chrome.library;
    subtitle = c.chrome.librarySub(EXERCISES.length);
  } else if (top?.kind === 'exercise-view') {
    const ex = getExercise(top.exerciseId);
    title = ex ? fitExerciseName(locale, ex.id, ex.name) : c.chrome.exercise;
    subtitle = undefined;
  }

  const showTabs = !top;

  const finish = () => {
    if (top?.kind !== 'live') return;
    const sessionId = top.sessionId;
    const sets = fitness.setLogs.filter((l) => l.workoutSessionId === sessionId).length;
    const { xp } = finishLiveWorkout(sessionId);
    const total = xp + sets * xpFromSet();
    setStack((prev) => [...prev.slice(0, -1), { kind: 'summary', sessionId, xpEarned: total }]);
    pushToast(`+${total} XP`, 'xp');
  };

  return (
    <div className="fit-app" data-fit-theme={theme} data-tabs={showTabs ? 'on' : 'off'} data-full={fullscreen ? '1' : '0'} data-live={live ? '1' : '0'}>
      <div className="fit-bg" aria-hidden />

      {!fullscreen && <HealthChrome title={title} subtitle={subtitle} onBack={top ? pop : undefined} onExit={onExit} />}

      <main className="fit-main">
        {booting ? (
          <FitSkeleton />
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={stackKey}
              className="fit-page"
              initial={fullscreen ? { opacity: 0, y: 36, scale: 0.98 } : { opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={fullscreen ? { opacity: 0, y: 24 } : { opacity: 0, x: -14 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              {!top && tab === 'home' && (
                <HealthHomeScreen
                  displayName={displayName}
                  onStartWorkout={(id) => launchWorkout(id)}
                  onContinue={resumeLive}
                  onOpenWorkout={(workoutId) => push({ kind: 'workout', workoutId })}
                  onOpenExercise={(exerciseId) => push({ kind: 'exercise-view', exerciseId })}
                  onGoTab={goTab}
                />
              )}
              {!top && tab === 'workouts' && (
                <HealthWorkoutsScreen
                  onOpenWorkout={(workoutId) => push({ kind: 'workout', workoutId })}
                  onStartWorkout={(id) => launchWorkout(id)}
                  onAddWorkout={() => push({ kind: 'add-workout' })}
                  onEditWorkout={(id) => push({ kind: 'edit-workout', workoutId: id })}
                  onOpenCatalog={() => push({ kind: 'catalog' })}
                />
              )}
              {!top && tab === 'progress' && <HealthProgressScreen displayName={displayName} />}
              {!top && tab === 'profile' && <HealthProfileScreen displayName={displayName} />}

              {top?.kind === 'workout' && (
                <WorkoutDetailScreen
                  workoutId={top.workoutId}
                  onStart={() => launchWorkout(top.workoutId)}
                  onOpenExercise={(exerciseId) => push({ kind: 'exercise-view', exerciseId, workoutId: top.workoutId })}
                />
              )}

              {top?.kind === 'live' && (
                <WorkoutLiveScreen
                  workoutId={top.workoutId}
                  sessionId={top.sessionId}
                  startExerciseId={top.exerciseId}
                  onMinimize={pop}
                  onFinish={finish}
                  onInfo={(exerciseId) => push({ kind: 'exercise-view', exerciseId, workoutId: top.workoutId })}
                />
              )}

              {top?.kind === 'summary' && (
                <WorkoutSummaryScreen
                  sessionId={top.sessionId}
                  xpEarned={top.xpEarned ?? 0}
                  onDone={() => goTab('home')}
                  onWorkouts={() => goTab('workouts')}
                />
              )}

              {top?.kind === 'add-workout' && <CustomWorkoutEditor onDone={pop} />}
              {top?.kind === 'edit-workout' && <CustomWorkoutEditor editId={top.workoutId} onDone={pop} />}

              {top?.kind === 'catalog' && <ExerciseLibraryScreen onOpenExercise={(exerciseId) => push({ kind: 'exercise-view', exerciseId })} />}

              {top?.kind === 'exercise-view' && (
                <ExerciseHubScreen
                  exerciseId={top.exerciseId}
                  onStart={() => launchWorkout(top.workoutId ?? workoutForExercise(top.exerciseId), top.exerciseId)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {showTabs && !booting && live && <LiveMiniBar onOpen={resumeLive} />}
      {showTabs && !booting && <HealthTabBar tab={tab} onTab={goTab} pulse={!!live} />}

      <AchievementUnlock queue={unlocks} onDismiss={dismissUnlock} />
    </div>
  );
}

export function HealthModule({
  onExit,
  pushToast,
  displayName,
}: {
  onExit: () => void;
  pushToast: (m: string, t?: 'success' | 'xp') => void;
  displayName: string;
}) {
  const [unlocks, setUnlocks] = useState<FitnessAchievement[]>([]);
  return (
    <FitnessProvider onAchievementUnlock={(a) => setUnlocks((q) => (q.some((x) => x.id === a.id) ? q : [...q, a]))}>
      <HealthModuleInner
        onExit={onExit}
        pushToast={pushToast}
        displayName={displayName}
        unlocks={unlocks}
        dismissUnlock={() => setUnlocks((q) => q.slice(1))}
      />
    </FitnessProvider>
  );
}
