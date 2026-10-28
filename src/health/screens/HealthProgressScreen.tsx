import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Download, Dumbbell, FileText, Flame, Layers, Trophy } from 'lucide-react';
import { useFitness } from '../FitnessContext';
import { useI18n } from '../../i18n';
import { useCopy } from '../copy';
import { Period, aggregateProgress, weightProgressSeries } from '../stats';
import { prByExercise } from '../achievements';
import { caloriesSeries, focusSplit, PROGRESS_GROUPS, volumeSeries } from '../progressData';
import { exportProgressCsv } from '../csvExport';
import { ACCENT, CHART_COLORS, FxArea, FxDonut, FxStackBars } from '../components/FxCharts';
import { CountUp, rise, stagger } from '../components/FxBits';
import { fitExerciseName } from '../catalog/ruLabels';
import { calendarGrid, workoutDaySet } from '../utils/calendar';
import { formatDay, useUnits } from '../utils/units';

export function HealthProgressScreen({ displayName }: { displayName: string }) {
  const { fitness, health } = useFitness();
  const { locale } = useI18n();
  const c = useCopy();
  const u = useUnits();
  const [period, setPeriod] = useState<Period>('week');
  const [prId, setPrId] = useState<string | null>(null);

  const agg = useMemo(() => aggregateProgress(fitness, period), [fitness, period]);
  const kcal = useMemo(() => caloriesSeries(fitness, period, locale), [fitness, period, locale]);
  const vol = useMemo(() => volumeSeries(fitness, period, locale), [fitness, period, locale]);
  const focus = useMemo(() => focusSplit(fitness, period), [fitness, period]);
  const prs = useMemo(() => prByExercise(fitness).sort((a, b) => b.weight - a.weight).slice(0, 6), [fitness]);
  const activePr = prs.find((p) => p.exerciseId === prId) ?? prs[0];

  const kcalTotal = kcal.points.reduce((s, p) => s + p.kcal, 0);
  const kcalAvg = Math.round(kcalTotal / Math.max(1, kcal.points.length));

  const prSeries = useMemo(
    () => (activePr ? weightProgressSeries(fitness, activePr.exerciseId).map((p) => ({ label: formatDay(p.date, locale), weight: u.toDisp(p.weight) })) : []),
    [fitness, activePr, locale, u]
  );
  const prGain = prSeries.length > 1 ? Math.round((prSeries[prSeries.length - 1].weight - prSeries[0].weight) * 10) / 10 : 0;

  const grid = useMemo(() => calendarGrid(12), []);
  const days = useMemo(() => workoutDaySet(fitness), [fitness]);
  const dayCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const w of fitness.workouts) {
      if (w.status !== 'completed') continue;
      const d = new Date(w.endedAt);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [fitness.workouts]);
  const activeDays = grid.flat().filter((d) => days.has(d.key)).length;

  const hr = fitness.hrZoneMinutes;
  const zones = [
    { id: 'z1', label: c.progress.z1, min: hr.z1 },
    { id: 'z2', label: c.progress.z2, min: hr.z2 },
    { id: 'z3', label: c.progress.z3, min: hr.z3 },
    { id: 'z4', label: c.progress.z4, min: hr.z4 },
    { id: 'z5', label: c.progress.z5, min: hr.z5 },
  ];
  const zoneMax = Math.max(...zones.map((z) => z.min), 1);

  const periods: Period[] = ['week', 'month', 'year'];
  const names = { push: c.progress.push, pull: c.progress.pull, legs: c.progress.legs, core: c.progress.core };
  const hours = Math.floor(agg.totalMin / 60);

  const tiles = [
    { icon: Dumbbell, value: agg.workouts, label: c.progress.workouts, fmt: undefined as undefined | ((n: number) => string) },
    { icon: Clock, value: agg.totalMin, label: c.progress.time, fmt: (n: number) => (n >= 60 ? `${Math.floor(n / 60)}${c.common.min === 'мин' ? 'ч' : 'h'} ${n % 60}${c.common.min === 'мин' ? 'м' : 'm'}` : `${n} ${c.common.min}`) },
    { icon: Flame, value: agg.calories, label: c.progress.kcal, fmt: undefined },
    { icon: Layers, value: agg.sets, label: c.progress.sets, fmt: undefined },
  ];

  return (
    <motion.div className="fit-scroll fx-screen" variants={stagger} initial="hidden" animate="show" key="progress">
      <motion.div variants={rise} className="fx-seg fx-seg--wide" role="tablist">
        {periods.map((p) => (
          <button key={p} type="button" role="tab" aria-selected={period === p} className={period === p ? 'on' : ''} onClick={() => setPeriod(p)}>
            {c.progress[p]}
            {period === p && <motion.i layoutId="period-seg" className="fx-seg-pill" />}
          </button>
        ))}
      </motion.div>

      <motion.div variants={rise} className="fx-tiles">
        {tiles.map((t) => (
          <div key={t.label} className="fx-card fx-tile">
            <t.icon size={16} />
            <strong>
              <CountUp value={t.value} format={t.fmt} />
            </strong>
            <span>{t.label}</span>
          </div>
        ))}
      </motion.div>

      <motion.section variants={rise} className="fx-card fx-chart-card">
        <div className="fx-chart-head">
          <div>
            <h3>{c.progress.calories}</h3>
            <p>
              {c.progress.total}: <b>{kcalTotal.toLocaleString(locale)}</b> · {c.progress.avg}: <b>{kcalAvg}</b>
            </p>
          </div>
          {kcal.isDemo && <span className="fx-chip fx-chip--demo">{c.common.demo}</span>}
        </div>
        <FxArea data={kcal.points} x="label" y="kcal" avg={kcalAvg} height={190} fmt={(v) => `${v.toLocaleString(locale)} ${c.common.kcal}`} />
      </motion.section>

      <motion.section variants={rise} className="fx-card fx-chart-card">
        <div className="fx-chart-head">
          <div>
            <h3>{c.progress.volume}</h3>
            <p>{u.volume(vol.points.reduce((s, p) => s + p.push + p.pull + p.legs + p.core, 0))}</p>
          </div>
          {vol.isDemo && <span className="fx-chip fx-chip--demo">{c.common.demo}</span>}
        </div>
        <FxStackBars data={vol.points} keys={PROGRESS_GROUPS} names={names} fmt={(v) => u.volume(v)} />
        <div className="fx-legend fx-legend--groups">
          {PROGRESS_GROUPS.map((g) => (
            <span key={g}>
              <i className="fx-dot" style={{ background: CHART_COLORS[g] }} /> {names[g]}
            </span>
          ))}
        </div>
      </motion.section>

      <motion.section variants={rise} className="fx-card fx-chart-card">
        <div className="fx-chart-head">
          <div>
            <h3>{c.progress.focus}</h3>
            <p>{focus.isDemo ? '' : `${focus.total} ${c.progress.totalSets}`}</p>
          </div>
          {focus.isDemo && <span className="fx-chip fx-chip--demo">{c.common.demo}</span>}
        </div>
        <div className="fx-focus">
          <FxDonut
            slices={PROGRESS_GROUPS.map((g) => ({ key: g, value: Math.max(focus.split[g], 1), color: CHART_COLORS[g] }))}
            center={focus.isDemo ? '100%' : String(focus.total)}
            sub={focus.isDemo ? '' : c.progress.totalSets}
          />
          <ul className="fx-focus-list">
            {PROGRESS_GROUPS.map((g) => (
              <li key={g}>
                <span>
                  <i className="fx-dot" style={{ background: CHART_COLORS[g] }} />
                  {names[g]}
                </span>
                <b>{focus.split[g]}%</b>
                <div className="fx-bar fx-bar--thin">
                  <span style={{ width: `${focus.split[g]}%`, background: CHART_COLORS[g] }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </motion.section>

      <motion.section variants={rise} className="fx-card fx-chart-card">
        <div className="fx-chart-head">
          <div>
            <h3>{c.progress.zones}</h3>
            <p>
              {zones.reduce((s, z) => s + z.min, 0)} {c.common.min}
            </p>
          </div>
        </div>
        <ul className="fx-zones">
          {zones.map((z, i) => (
            <li key={z.id}>
              <span>
                <b>{z.id.toUpperCase()}</b> {z.label}
              </span>
              <div className="fx-bar">
                <motion.span initial={{ width: 0 }} animate={{ width: `${(z.min / zoneMax) * 100}%` }} transition={{ delay: 0.15 + i * 0.07, duration: 0.8 }} className={`fx-zone fx-zone--${i + 1}`} />
              </div>
              <em>{z.min}</em>
            </li>
          ))}
        </ul>
      </motion.section>

      <motion.section variants={rise} className="fx-card fx-chart-card">
        <div className="fx-chart-head">
          <div>
            <h3>{c.progress.streakCal}</h3>
            <p>
              {activeDays} / 84
            </p>
          </div>
        </div>
        <div className="fx-heat" role="img" aria-label={c.progress.streakCal}>
          {grid.map((col, ci) => (
            <div key={ci} className="fx-heat-col">
              {col.map((cell, ri) => {
                const n = dayCounts.get(cell.key) ?? 0;
                return (
                  <motion.i
                    key={cell.key}
                    className={`fx-heat-cell lv${cell.future ? 'f' : Math.min(n, 3)}`}
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + (ci * 7 + ri) * 0.006, type: 'spring', stiffness: 380, damping: 22 }}
                    title={cell.key}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section variants={rise} className="fx-card fx-chart-card">
        <div className="fx-chart-head">
          <div>
            <h3>{c.progress.records}</h3>
            <p>{c.progress.recordsSub}</p>
          </div>
          <Trophy size={18} className="fx-chart-ico" />
        </div>
        {prs.length > 0 && (
          <>
            <div className="fx-pills fx-pills--tight">
              {prs.map((p) => (
                <button key={p.exerciseId} type="button" className={`fx-pill fx-pill--sm${activePr?.exerciseId === p.exerciseId ? ' on' : ''}`} onClick={() => setPrId(p.exerciseId)}>
                  {fitExerciseName(locale, p.exerciseId, p.name)}
                </button>
              ))}
            </div>
            {activePr && (
              <div className="fx-pr-line">
                <div>
                  <small>{c.progress.best}</small>
                  <strong>{u.fmt(activePr.weight)}</strong>
                </div>
                <div>
                  <small>{c.progress.gain}</small>
                  <strong className={prGain >= 0 ? 'up' : ''}>
                    {prGain >= 0 ? '+' : ''}
                    {prGain} {u.unit}
                  </strong>
                </div>
              </div>
            )}
            {prSeries.length >= 2 && <FxArea data={prSeries} x="label" y="weight" height={160} color={ACCENT} fmt={(v) => `${v} ${u.unit}`} yDomain={['dataMin - 5', 'dataMax + 5']} />}
          </>
        )}
      </motion.section>

      <motion.div variants={rise} className="fx-export">
        <button type="button" className="fx-btn fx-btn--ghost fx-btn--block" onClick={() => void import('../pdfExport').then((m) => m.exportProgressPdf({ fitness, health, displayName }))}>
          <FileText size={16} /> {c.progress.export} {c.progress.pdf}
        </button>
        <button type="button" className="fx-btn fx-btn--ghost fx-btn--block" onClick={() => exportProgressCsv(fitness)}>
          <Download size={16} /> {c.progress.export} {c.progress.csv}
        </button>
      </motion.div>
    </motion.div>
  );
}
