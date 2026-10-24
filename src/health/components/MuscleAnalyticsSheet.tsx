import { useRef } from 'react';
import { Award, Calendar, ChevronRight, Dumbbell, Layers, Lock, Scale, Shield, TrendingUp, Trophy, Zap } from 'lucide-react';
import { useI18n } from '../../i18n';
import { useCopy } from '../copy';
import { FxSheet } from './FxSheet';
import { FxArea } from './FxCharts';
import { AnatomicalBody } from './AnatomicalBody';
import { FitImage } from './FitImage';
import { exercisePhotoUrl } from '../catalog/exercisePhotos';
import { fitExerciseName } from '../catalog/ruLabels';
import { TIERS, type MuscleRegionAnalytics } from '../utils/muscleAnalytics';
import { getRegion, MuscleRegionId } from '../utils/muscleRegions';
import { relativeDay, useUnits } from '../utils/units';

export function MuscleAnalyticsSheet({
  data,
  onClose,
  onOpenExercise,
}: {
  data: MuscleRegionAnalytics | null;
  onClose: () => void;
  onOpenExercise?: (exerciseId: string) => void;
}) {
  const c = useCopy();
  const { locale } = useI18n();
  const u = useUnits();
  const lastData = useRef<MuscleRegionAnalytics | null>(null);
  if (data) lastData.current = data;
  const d = data ?? lastData.current;

  if (!d) return <FxSheet open={false} onClose={onClose}>{null}</FxSheet>;

  const region = getRegion(d.regionId as MuscleRegionId);
  const side = region.side === 'back' ? 'back' : 'front';
  const nextTier = TIERS[d.tierIndex + 1];
  const chart = d.weeklyVolume.map((p) => ({ label: p.label, kg: u.toDisp(p.kg) }));

  const milestoneLabel = (m: MuscleRegionAnalytics['milestones'][number]) =>
    m.kind === 'sets' ? c.sheet.mSets(m.target) : m.kind === 'volume' ? c.sheet.mVolume(m.target) : c.sheet.mSessions(m.target);

  return (
    <FxSheet open={!!data} onClose={onClose} kicker={c.sheet.kicker} title={c.muscle[d.regionId]} tall>
      <div className="fx-msheet-hero">
        <div className="fx-msheet-fig">
          <AnatomicalBody side={side} primary={[d.regionId]} />
        </div>
        <div className="fx-msheet-tier">
          <div className={`fx-tier-badge fx-tier-badge--${d.tier}`}>
            <Shield size={18} />
            <span>{c.tier[d.tier]}</span>
          </div>
          <p className="fx-msheet-lvl">
            {c.atlas.lvl} <b>{d.level}</b> · <b>{d.muscleXp}</b> XP
          </p>
          <div className="fx-ladder" aria-hidden>
            {TIERS.map((tier, i) => (
              <i key={tier.id} className={i <= d.tierIndex ? 'on' : ''} />
            ))}
          </div>
          <div className="fx-bar">
            <span style={{ width: `${Math.round(d.tierProgress * 100)}%` }} />
          </div>
          <small>
            {nextTier ? c.sheet.toNext(c.tier[nextTier.id], Math.max(1, nextTier.min - d.devScore)) : c.sheet.maxTier}
          </small>
        </div>
      </div>

      {d.isSample && <p className="fx-note">{c.sheet.sample}</p>}

      <div className="fx-stat-grid">
        <div className="fx-stat">
          <Layers size={16} />
          <strong>{d.sessionCount}</strong>
          <span>{c.sheet.workouts}</span>
        </div>
        <div className="fx-stat">
          <Dumbbell size={16} />
          <strong>{d.setCount}</strong>
          <span>{c.sheet.sets}</span>
        </div>
        <div className="fx-stat">
          <Calendar size={16} />
          <strong className="fx-stat-sm">{relativeDay(d.lastTrainedAt, locale, c.common)}</strong>
          <span>{c.sheet.last}</span>
        </div>
        <div className="fx-stat">
          <Scale size={16} />
          <strong>{d.avgWeightKg ? u.fmt(d.avgWeightKg) : '—'}</strong>
          <span>{c.sheet.avg}</span>
        </div>
        <div className="fx-stat">
          <Trophy size={16} />
          <strong>{d.maxWeightKg ? u.fmt(d.maxWeightKg) : '—'}</strong>
          <span>{c.sheet.max}</span>
        </div>
        <div className="fx-stat">
          <Zap size={16} />
          <strong>{u.volume(d.volumeKg)}</strong>
          <span>{c.sheet.volume}</span>
        </div>
      </div>

      <div className="fx-periods">
        <div>
          <b>{d.setsWeek}</b>
          <span>{c.sheet.week}</span>
        </div>
        <div>
          <b>{d.setsMonth}</b>
          <span>{c.sheet.month}</span>
        </div>
        <div>
          <b>{d.setsYear}</b>
          <span>{c.sheet.year}</span>
        </div>
      </div>

      <h3 className="fx-h3">
        <TrendingUp size={16} /> {c.sheet.growth}
      </h3>
      <div className="fx-card fx-card--flat">
        <FxArea data={chart} x="label" y="kg" height={160} fmt={(v) => `${v} ${u.unit}`} />
      </div>

      <h3 className="fx-h3">
        <Award size={16} /> {c.sheet.milestones}
      </h3>
      <div className="fx-milestones">
        {d.milestones.map((m) => (
          <div key={m.id} className={`fx-milestone${m.done ? ' is-done' : ''}`}>
            <span className="fx-milestone-ico">{m.done ? <Award size={16} /> : <Lock size={14} />}</span>
            <div>
              <b>{milestoneLabel(m)}</b>
              <small>
                {m.done ? '' : `${Math.min(m.value, m.target).toLocaleString(locale)} / ${m.target.toLocaleString(locale)} · `}+{m.xp} XP
              </small>
              {!m.done && (
                <div className="fx-bar fx-bar--thin">
                  <span style={{ width: `${Math.min(100, (m.value / m.target) * 100)}%` }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <h3 className="fx-h3">
        <Dumbbell size={16} /> {c.sheet.exercises}
      </h3>
      <ul className="fx-list">
        {d.exercises.map((ex) => (
          <li key={ex.exerciseId}>
            <button
              type="button"
              className="fx-row"
              onClick={() => {
                onClose();
                onOpenExercise?.(ex.exerciseId);
              }}
            >
              <span className="fx-row-thumb">
                <FitImage src={exercisePhotoUrl(ex.exerciseId)} alt="" variant="thumb" fallbackLabel={ex.name} />
              </span>
              <span className="fx-row-main">
                <b>{fitExerciseName(locale, ex.exerciseId, ex.name)}</b>
                <small>
                  {ex.sets} {c.sheet.setsShort} · {c.sheet.max.toLowerCase()} {u.fmt(ex.maxWeightKg)}
                </small>
              </span>
              <ChevronRight size={18} className="fx-row-chev" />
            </button>
          </li>
        ))}
      </ul>
    </FxSheet>
  );
}
