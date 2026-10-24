import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import { useFitness } from '../FitnessContext';
import { allWorkouts } from '../exerciseCatalog';
import { fitWorkoutName } from '../catalog/ruLabels';
import { useI18n } from '../../i18n';
import { useCopy } from '../copy';

/** Pulsing "workout in progress" strip above the tab bar. */
export function LiveMiniBar({ onOpen }: { onOpen: () => void }) {
  const { live, fitness } = useFitness();
  const { locale } = useI18n();
  const c = useCopy();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  if (!live) return null;
  const w = allWorkouts(fitness.customWorkouts).find((x) => x.id === live.workoutId);
  const s = Math.max(0, Math.floor((now - live.startedAt) / 1000));
  const clock = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return (
    <motion.button
      type="button"
      className="fx-minibar"
      onClick={onOpen}
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      whileTap={{ scale: 0.98 }}
    >
      <i className="fx-minibar-dot" />
      <span className="fx-minibar-main">
        <b>{w ? fitWorkoutName(locale, w.id, w.name) : c.live.title}</b>
        <small>{c.workouts.inProgress}</small>
      </span>
      <strong>{clock}</strong>
      <span className="fx-minibar-go">
        {c.home.continueBtn} <ChevronUp size={14} />
      </span>
    </motion.button>
  );
}
