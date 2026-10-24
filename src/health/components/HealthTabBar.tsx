import { motion } from 'framer-motion';
import { Dumbbell, Home, LineChart, User } from 'lucide-react';
import { HealthTab } from '../types';
import { useCopy } from '../copy';

const TABS: { id: HealthTab; Icon: typeof Home }[] = [
  { id: 'home', Icon: Home },
  { id: 'workouts', Icon: Dumbbell },
  { id: 'progress', Icon: LineChart },
  { id: 'profile', Icon: User },
];

export function HealthTabBar({ tab, onTab, pulse }: { tab: HealthTab; onTab: (t: HealthTab) => void; pulse?: boolean }) {
  const c = useCopy();
  return (
    <nav className="fx-tabbar" aria-label="Health">
      {TABS.map(({ id, Icon }) => {
        const on = tab === id;
        return (
          <button key={id} type="button" className={`fx-tab${on ? ' on' : ''}`} onClick={() => onTab(id)} aria-current={on ? 'page' : undefined}>
            {on && <motion.i layoutId="tab-glow" className="fx-tab-glow" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            <span className="fx-tab-ico">
              <Icon size={22} strokeWidth={on ? 2.4 : 1.9} />
              {pulse && id === 'workouts' && <em className="fx-tab-dot" />}
            </span>
            <span className="fx-tab-label">{c.nav[id]}</span>
          </button>
        );
      })}
    </nav>
  );
}
