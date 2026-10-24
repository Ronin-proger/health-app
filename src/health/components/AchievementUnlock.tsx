import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { FitnessAchievement } from '../types';
import { AchIcon } from './AchIcon';
import { CountUp } from './FxBits';
import { fitAchievement } from '../catalog/ruLabels';
import { useI18n } from '../../i18n';
import { useCopy } from '../copy';
import { playRestComplete } from '../notifications';
import { fireWorkoutConfetti } from '../utils/confetti';
import { haptic } from '../utils/telegramWebApp';

export function AchievementUnlock({ queue, onDismiss }: { queue: FitnessAchievement[]; onDismiss: () => void }) {
  const { locale } = useI18n();
  const c = useCopy();
  const a = queue[0];

  useEffect(() => {
    if (!a) return;
    playRestComplete();
    haptic('success');
    fireWorkoutConfetti();
    const t = window.setTimeout(onDismiss, 6500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a?.id]);

  const copy = a ? fitAchievement(locale, a.id, a.title, a.desc) : null;

  return (
    <AnimatePresence>
      {a && copy && (
        <motion.div key={a.id} className={`fx-unlock fx-rar--${a.rarity}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onDismiss} role="dialog" aria-modal="true">
          <div className="fx-unlock-rays" aria-hidden />
          <motion.div
            className="fx-unlock-card"
            initial={{ scale: 0.6, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="fx-kicker">
              <Sparkles size={13} /> {c.ach.unlock}
            </span>
            <motion.div
              className="fx-unlock-medal"
              initial={{ rotate: -40, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.15 }}
            >
              <AchIcon name={a.icon} size={46} />
            </motion.div>
            <span className="fx-rar-tag fx-rar-tag--lg">{c.rarity[a.rarity]}</span>
            <h2 className="fx-grad-text">{copy.title}</h2>
            <p>{copy.desc}</p>
            <div className="fx-unlock-xp">
              +<CountUp value={a.xp} duration={1200} /> XP
            </div>
            <button type="button" className="fx-btn fx-btn--primary fx-btn--lg fx-btn--block fx-btn--glow" onClick={onDismiss}>
              {c.ach.awesome}
              {queue.length > 1 ? ` · ${queue.length - 1}+` : ''}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
