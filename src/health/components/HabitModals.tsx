import { useState } from 'react';
import { Droplets, Footprints, Minus, Moon, Plus, RotateCcw } from 'lucide-react';
import { api } from '../../api';
import { useFitness } from '../FitnessContext';
import { useI18n } from '../../i18n';
import { useCopy } from '../copy';
import { FxSheet } from './FxSheet';
import { CountUp, FxRing } from './FxBits';
import { GOALS, HabitKind, useHabits } from '../utils/useHabits';

const META = {
  steps: { icon: Footprints, goal: GOALS.steps, quick: [500, 1000, 2500, 5000] },
  water: { icon: Droplets, goal: GOALS.water, quick: [150, 250, 500, 750] },
  sleep: { icon: Moon, goal: GOALS.sleep, quick: [5, 6, 7, 8, 9] },
} as const;

export function HabitModals({ open, onClose }: { open: HabitKind | null; onClose: () => void }) {
  const { logDaily } = useFitness();
  const habits = useHabits();
  const c = useCopy();
  const { locale } = useI18n();
  const [custom, setCustom] = useState('');
  const [flash, setFlash] = useState(false);

  const kind: HabitKind = open ?? 'steps';
  const meta = META[kind];
  const Icon = meta.icon;
  const value = habits[kind];
  const pct = Math.min(100, Math.round((value / meta.goal) * 100));
  const unit = kind === 'steps' ? c.habit.unitSteps : kind === 'water' ? c.habit.unitMl : c.habit.unitH;
  const title = kind === 'steps' ? c.habit.stepsTitle : kind === 'water' ? c.habit.waterTitle : c.habit.sleepTitle;

  const saved = () => {
    setFlash(true);
    window.setTimeout(() => setFlash(false), 1100);
  };

  const add = async (amount: number) => {
    if (kind === 'steps') logDaily({ steps: value + amount });
    if (kind === 'water') logDaily({ waterMl: value + amount });
    saved();
    try {
      await api.logHealth(kind === 'steps' ? 'steps' : 'water', amount);
    } catch {
      /* offline: local value is already saved */
    }
  };

  const setSleep = async (h: number) => {
    const v = Math.max(0, Math.min(14, Math.round(h * 2) / 2));
    logDaily({ sleepHours: v });
    saved();
    try {
      await api.logHealth('sleep', v);
    } catch {
      /* offline */
    }
  };

  const reset = () => {
    if (kind === 'steps') logDaily({ steps: 0 });
    if (kind === 'water') logDaily({ waterMl: 0 });
    if (kind === 'sleep') logDaily({ sleepHours: 0 });
  };

  const submitCustom = () => {
    const n = Number(custom.replace(',', '.'));
    if (!n || n <= 0) return;
    if (kind === 'sleep') void setSleep(n);
    else void add(Math.round(n));
    setCustom('');
  };

  const maxBar = Math.max(meta.goal, ...habits.week.map((d) => (kind === 'steps' ? d.steps : kind === 'water' ? d.water : d.sleep)));

  return (
    <FxSheet open={!!open} onClose={onClose} kicker={c.home.quickLog} title={title}>
      <div className="fx-habit-hero">
        <FxRing pct={pct} size={132} stroke={11}>
          <Icon size={22} className="fx-habit-ico" />
          <strong>
            <CountUp value={kind === 'sleep' ? Math.round(value * 10) : value} format={(n) => (kind === 'sleep' ? String(n / 10) : n.toLocaleString(locale))} />
          </strong>
          <small>{unit}</small>
        </FxRing>
        <div className="fx-habit-meta">
          <span>
            {c.habit.goal}: <b>{meta.goal.toLocaleString(locale)}</b> {unit}
          </span>
          <em className={flash ? 'on' : ''}>{flash ? c.habit.saved : `${pct}%`}</em>
        </div>
      </div>

      {kind === 'sleep' ? (
        <>
          <div className="fx-stepper">
            <button type="button" onClick={() => setSleep(value - 0.5)} aria-label="-0.5">
              <Minus size={20} />
            </button>
            <div>
              <strong>{value || 0}</strong>
              <small>{c.habit.unitH}</small>
            </div>
            <button type="button" onClick={() => setSleep(value + 0.5)} aria-label="+0.5">
              <Plus size={20} />
            </button>
          </div>
          <p className="fx-label">{c.habit.quick}</p>
          <div className="fx-quick">
            {meta.quick.map((n) => (
              <button key={n} type="button" className={value === n ? 'on' : ''} onClick={() => setSleep(n)}>
                {n}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="fx-label">{c.habit.quick}</p>
          <div className="fx-quick">
            {meta.quick.map((n) => (
              <button key={n} type="button" onClick={() => add(n)}>
                +{n.toLocaleString(locale)}
              </button>
            ))}
          </div>
          <p className="fx-label">{c.habit.custom}</p>
          <div className="fx-input-row">
            <input
              inputMode="numeric"
              type="number"
              min={0}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder={kind === 'steps' ? '1500' : '300'}
              onKeyDown={(e) => e.key === 'Enter' && submitCustom()}
            />
            <button type="button" className="fx-btn fx-btn--primary" onClick={submitCustom} disabled={!custom}>
              {c.common.add}
            </button>
          </div>
        </>
      )}

      <p className="fx-label">{c.habit.week}</p>
      <div className="fx-weekbars">
        {habits.week.map((d, i) => {
          const v = kind === 'steps' ? d.steps : kind === 'water' ? d.water : d.sleep;
          const isToday = i === habits.week.length - 1;
          return (
            <div key={d.date} className={isToday ? 'is-today' : ''}>
              <span style={{ height: `${Math.max(6, (v / maxBar) * 100)}%` }} />
              <small>{new Date(d.date).toLocaleDateString(locale === 'en' ? 'en-US' : 'ru-RU', { weekday: 'short' }).slice(0, 2)}</small>
            </div>
          );
        })}
      </div>

      <button type="button" className="fx-btn fx-btn--ghost fx-btn--block" onClick={reset}>
        <RotateCcw size={16} /> {c.habit.reset}
      </button>
    </FxSheet>
  );
}
