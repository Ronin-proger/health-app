import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, ChevronRight, Flag, Info, Minus, Plus, SkipForward, Timer, Trophy } from 'lucide-react';
import { useFitness } from '../FitnessContext';
import { allWorkouts, getExercise, prescriptionsForWorkout } from '../exerciseCatalog';
import { FitImage } from '../components/FitImage';
import { FxRing } from '../components/FxBits';
import { FxSheet } from '../components/FxSheet';
import { exercisePhotoUrl } from '../catalog/exercisePhotos';
import { fitExerciseName, fitWorkoutName } from '../catalog/ruLabels';
import { playRestComplete } from '../notifications';
import { useI18n } from '../../i18n';
import { useCopy } from '../copy';
import { useUnits } from '../utils/units';
import { parseReps } from '../utils/workoutMeta';
import { haptic } from '../utils/telegramWebApp';

function fmtClock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function WorkoutLiveScreen({
  workoutId,
  sessionId,
  startExerciseId,
  onMinimize,
  onFinish,
  onInfo,
}: {
  workoutId: string;
  sessionId: string;
  startExerciseId?: string;
  onMinimize: () => void;
  onFinish: () => void;
  onInfo: (exerciseId: string) => void;
}) {
  const { fitness, live, logSet, toggleLiveExercise, updateLiveNotes } = useFitness();
  const { locale } = useI18n();
  const c = useCopy();
  const u = useUnits();

  const workout = allWorkouts(fitness.customWorkouts).find((w) => w.id === workoutId);
  const rxList = useMemo(() => (workout ? prescriptionsForWorkout(workout) : []), [workout]);
  const [idx, setIdx] = useState(() => Math.max(0, rxList.findIndex((r) => r.exerciseId === startExerciseId)));
  const rx = rxList[idx];
  const ex = rx ? getExercise(rx.exerciseId) : undefined;

  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [rest, setRest] = useState<{ endsAt: number; total: number } | null>(null);
  const [prFlash, setPrFlash] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [burst, setBurst] = useState(0);
  const restNotified = useRef(false);

  const sessionSets = useMemo(() => fitness.setLogs.filter((l) => l.workoutSessionId === sessionId), [fitness.setLogs, sessionId]);
  const doneForEx = rx ? sessionSets.filter((l) => l.exerciseId === rx.exerciseId) : [];
  const targetSets = rx?.sets ?? 3;
  const setNumber = Math.min(doneForEx.length + 1, Math.max(targetSets, doneForEx.length + 1));
  const allSetsDone = doneForEx.length >= targetSets;

  // previous performance for the exercise (from an earlier session)
  const previous = useMemo(() => {
    if (!rx) return null;
    return (
      fitness.setLogs
        .filter((l) => l.exerciseId === rx.exerciseId && l.workoutSessionId !== sessionId)
        .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt))[0] ?? null
    );
  }, [fitness.setLogs, rx, sessionId]);

  // reset inputs when switching exercise
  useEffect(() => {
    if (!rx) return;
    const lastHere = [...doneForEx].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt))[0];
    const baseKg = lastHere?.weightKg ?? previous?.weightKg ?? rx.weightKg;
    setReps(lastHere?.reps ?? previous?.reps ?? parseReps(rx.reps));
    setWeight(u.toDisp(baseKg));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, rx?.exerciseId, u.imperial]);

  // tick: session clock + rest countdown
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, []);

  const remaining = rest ? Math.max(0, Math.ceil((rest.endsAt - now) / 1000)) : 0;
  useEffect(() => {
    if (!rest) return;
    if (remaining <= 0 && !restNotified.current) {
      restNotified.current = true;
      playRestComplete();
      haptic('success');
      const t = window.setTimeout(() => setRest(null), 1600);
      return () => window.clearTimeout(t);
    }
  }, [remaining, rest]);

  const startRest = useCallback((sec: number) => {
    restNotified.current = false;
    setRest({ endsAt: Date.now() + sec * 1000, total: sec });
  }, []);

  const completedIds = live?.completedExerciseIds ?? [];
  const everythingDone = rxList.length > 0 && rxList.every((r) => completedIds.includes(r.exerciseId));

  const log = async () => {
    if (!rx || busy) return;
    setBusy(true);
    haptic('medium');
    const kg = u.fromDisp(weight);
    const isPr = await logSet(rx.exerciseId, reps, Math.round(kg * 10) / 10, 8, sessionId);
    setBusy(false);
    setBurst((b) => b + 1);
    if (isPr) {
      setPrFlash(true);
      haptic('success');
      window.setTimeout(() => setPrFlash(false), 2400);
    }
    if (doneForEx.length + 1 >= targetSets && !completedIds.includes(rx.exerciseId)) toggleLiveExercise(rx.exerciseId);
    const isLastOfLast = doneForEx.length + 1 >= targetSets && idx === rxList.length - 1;
    if (!isLastOfLast) startRest(rx.restSec || 90);
    else setRest(null);
  };

  if (!workout || !rx || !ex) return <p className="fit-empty">—</p>;

  const elapsed = live ? now - live.startedAt : 0;
  const nextRx = rxList[idx + 1];
  const nextEx = nextRx ? getExercise(nextRx.exerciseId) : undefined;
  const sessionVolume = sessionSets.reduce((s, l) => s + l.reps * l.weightKg, 0);

  const go = (i: number) => {
    setIdx(i);
    setRest(null);
    haptic('light');
  };

  return (
    <div className="fx-live">
      <header className="fx-live-head">
        <button type="button" className="fx-icon-btn" onClick={onMinimize} aria-label={c.live.minimize}>
          <ChevronDown size={22} />
        </button>
        <div className="fx-live-clock">
          <small>{fitWorkoutName(locale, workout.id, workout.name)}</small>
          <strong>{fmtClock(elapsed)}</strong>
        </div>
        <button type="button" className="fx-btn fx-btn--ghost fx-btn--sm fx-live-finish" onClick={() => setConfirm(true)}>
          <Flag size={15} /> {c.live.finish}
        </button>
      </header>

      <div className="fx-live-progress" aria-hidden>
        {rxList.map((r, i) => (
          <i key={r.exerciseId} className={completedIds.includes(r.exerciseId) ? 'done' : i === idx ? 'cur' : ''} />
        ))}
      </div>

      <div className="fx-live-body">
        <AnimatePresence mode="wait">
          <motion.div
            key={rx.exerciseId}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22 }}
          >
            <div className="fx-live-ex">
              <div className="fx-live-photo">
                <FitImage src={exercisePhotoUrl(ex.id, 800, 520)} alt="" variant="hero" fallbackLabel={ex.name} loading="eager" />
                <span className="fx-hero-shade" />
                <button type="button" className="fx-icon-btn fx-live-info" onClick={() => onInfo(ex.id)} aria-label="Info">
                  <Info size={18} />
                </button>
                <div className="fx-live-ex-title">
                  <small>{c.live.exerciseN(idx + 1, rxList.length)}</small>
                  <h2>{fitExerciseName(locale, ex.id, ex.name)}</h2>
                </div>
              </div>
            </div>

            <div className="fx-setdots" aria-label={c.live.setN(setNumber, targetSets)}>
              {Array.from({ length: Math.max(targetSets, doneForEx.length) }, (_, i) => {
                const l = doneForEx[i];
                return (
                  <span key={i} className={`fx-setdot${l ? ' done' : i === doneForEx.length ? ' cur' : ''}`}>
                    {l ? <Check size={14} strokeWidth={3} /> : i + 1}
                  </span>
                );
              })}
            </div>
            <p className="fx-live-sub">
              {allSetsDone ? c.live.allDone : c.live.setN(setNumber, targetSets)}
              {previous && (
                <em>
                  {' · '}
                  {c.live.prev}: {previous.reps} × {u.fmt(previous.weightKg)}
                </em>
              )}
            </p>

            <div className="fx-inputs">
              <div className="fx-input-card">
                <label>{c.live.reps}</label>
                <div className="fx-input-step">
                  <button type="button" onClick={() => setReps((r) => Math.max(1, r - 1))} aria-label="-1">
                    <Minus size={20} />
                  </button>
                  <input inputMode="numeric" value={reps} onChange={(e) => setReps(Math.max(0, Math.min(999, Number(e.target.value.replace(/\D/g, '')) || 0)))} aria-label={c.live.reps} />
                  <button type="button" onClick={() => setReps((r) => r + 1)} aria-label="+1">
                    <Plus size={20} />
                  </button>
                </div>
              </div>
              <div className="fx-input-card">
                <label>
                  {c.live.weight}, {u.unit}
                </label>
                <div className="fx-input-step">
                  <button type="button" onClick={() => setWeight((w) => Math.max(0, Math.round((w - u.step) * 10) / 10))} aria-label={`-${u.step}`}>
                    <Minus size={20} />
                  </button>
                  <input
                    inputMode="decimal"
                    value={weight}
                    onChange={(e) => {
                      const v = Number(e.target.value.replace(',', '.'));
                      if (!Number.isNaN(v)) setWeight(Math.max(0, Math.min(999, v)));
                    }}
                    aria-label={c.live.weight}
                  />
                  <button type="button" onClick={() => setWeight((w) => Math.round((w + u.step) * 10) / 10)} aria-label={`+${u.step}`}>
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {rest && (
                <motion.div
                  className={`fx-card fx-rest${remaining <= 0 ? ' is-over' : ''}`}
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                >
                  <FxRing pct={(remaining / rest.total) * 100} size={72} stroke={7}>
                    <b>{remaining}</b>
                  </FxRing>
                  <div className="fx-rest-main">
                    <small>{remaining <= 0 ? c.live.restDone : c.live.rest}</small>
                    <strong>{remaining <= 0 ? '0:00' : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`}</strong>
                  </div>
                  <div className="fx-rest-actions">
                    <button type="button" className="fx-btn fx-btn--ghost fx-btn--sm" onClick={() => setRest((r) => (r ? { endsAt: r.endsAt + 15000, total: r.total + 15 } : r))}>
                      {c.live.plus15}
                    </button>
                    <button type="button" className="fx-btn fx-btn--ghost fx-btn--sm" onClick={() => setRest(null)}>
                      <SkipForward size={14} /> {c.live.skip}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {doneForEx.length > 0 && (
              <ul className="fx-hist fx-hist--live">
                {doneForEx.map((l, i) => (
                  <li key={l.id}>
                    <span>
                      {c.live.loggedSets} #{doneForEx.length - i}
                    </span>
                    <b>
                      {l.reps} × {u.fmt(l.weightKg)}
                    </b>
                  </li>
                ))}
              </ul>
            )}

            {nextEx && (
              <button type="button" className="fx-card fx-next" onClick={() => go(idx + 1)}>
                <span className="fx-row-thumb">
                  <FitImage src={exercisePhotoUrl(nextEx.id)} alt="" variant="thumb" fallbackLabel={nextEx.name} />
                </span>
                <span className="fx-row-main">
                  <small>{c.live.nextEx}</small>
                  <b>{fitExerciseName(locale, nextEx.id, nextEx.name)}</b>
                </span>
                <ChevronRight size={18} className="fx-row-chev" />
              </button>
            )}

            <h3 className="fx-h3 fx-h3--tight">
              <Timer size={16} /> {c.live.list}
            </h3>
            <ul className="fx-plan">
              {rxList.map((r, i) => {
                const e = getExercise(r.exerciseId);
                const n = sessionSets.filter((l) => l.exerciseId === r.exerciseId).length;
                const done = completedIds.includes(r.exerciseId);
                return (
                  <li key={r.exerciseId}>
                    <button type="button" className={`fx-plan-row${i === idx ? ' cur' : ''}${done ? ' done' : ''}`} onClick={() => go(i)}>
                      <span className="fx-plan-n">{done ? <Check size={14} strokeWidth={3} /> : i + 1}</span>
                      <b>{fitExerciseName(locale, r.exerciseId, e?.name ?? r.exerciseId)}</b>
                      <small>
                        {n}/{r.sets}
                      </small>
                    </button>
                  </li>
                );
              })}
            </ul>

            <label className="fx-label" htmlFor="live-notes">
              {c.live.notes}
            </label>
            <textarea
              id="live-notes"
              className="fx-textarea"
              rows={2}
              placeholder={c.live.notesPh}
              value={live?.notes ?? ''}
              onChange={(e) => updateLiveNotes(e.target.value)}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fx-live-bar">
        <div className="fx-live-mini">
          <span>
            <small>{c.live.sets}</small>
            <b>{sessionSets.length}</b>
          </span>
          <span>
            <small>{c.live.volume}</small>
            <b>{u.volume(sessionVolume)}</b>
          </span>
        </div>
        {everythingDone ? (
          <button type="button" className="fx-btn fx-btn--primary fx-btn--lg fx-btn--glow fx-btn--pulse" onClick={() => setConfirm(true)}>
            <Flag size={18} /> {c.live.finish}
          </button>
        ) : allSetsDone && nextEx ? (
          <div className="fx-live-bar-btns">
            <button type="button" className="fx-btn fx-btn--ghost fx-btn--lg" onClick={log} disabled={busy}>
              <Plus size={18} />
            </button>
            <button type="button" className="fx-btn fx-btn--primary fx-btn--lg fx-btn--glow fx-btn--pulse" onClick={() => go(idx + 1)}>
              {c.live.next} <ChevronRight size={18} />
            </button>
          </div>
        ) : (
          <button type="button" className="fx-btn fx-btn--primary fx-btn--lg fx-btn--glow" onClick={log} disabled={busy}>
            <Check size={18} strokeWidth={3} /> {c.live.log}
            {burst > 0 && <motion.i key={burst} className="fx-btn-burst" initial={{ scale: 0.4, opacity: 0.7 }} animate={{ scale: 2.2, opacity: 0 }} transition={{ duration: 0.6 }} />}
          </button>
        )}
      </div>

      <AnimatePresence>
        {prFlash && (
          <motion.div className="fx-pr-toast" initial={{ opacity: 0, y: -24, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -16 }}>
            <Trophy size={18} /> {c.live.pr}
          </motion.div>
        )}
      </AnimatePresence>

      <FxSheet open={confirm} onClose={() => setConfirm(false)} title={c.live.confirmTitle}>
        <p className="fx-note fx-note--plain">{c.live.confirmBody(sessionSets.length)}</p>
        <div className="fx-btn-row">
          <button type="button" className="fx-btn fx-btn--ghost fx-btn--lg" onClick={() => setConfirm(false)}>
            {c.live.keep}
          </button>
          <button
            type="button"
            className="fx-btn fx-btn--primary fx-btn--lg fx-btn--glow"
            onClick={() => {
              setConfirm(false);
              onFinish();
            }}
          >
            <Flag size={18} /> {c.live.complete}
          </button>
        </div>
      </FxSheet>
    </div>
  );
}
