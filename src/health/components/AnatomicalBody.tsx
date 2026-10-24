import { KeyboardEvent, memo, useId, useMemo } from 'react';
import { anteriorData, posteriorData } from '../assets/anatomyData';
import { Band, MuscleRegionId, regionIdFromMuscleSlug } from '../utils/muscleRegions';
import { useCopy } from '../copy';

export type BodySide = 'front' | 'back';
type Look = Band | 'idle';

type Props = {
  side: BodySide;
  /** atlas mode: load band per region */
  bands?: Partial<Record<MuscleRegionId, Band>>;
  /** exercise mode: bright = primary, amber = secondary, rest dim */
  primary?: MuscleRegionId[];
  secondary?: MuscleRegionId[];
  selected?: MuscleRegionId | null;
  onSelect?: (id: MuscleRegionId) => void;
  className?: string;
};

const PALETTE: Record<Look | 'neutral', [string, string, string]> = {
  high: ['#e9ff7a', '#b6ee1f', '#5f8a06'],
  mid: ['#ffd27a', '#f59e2c', '#a8560a'],
  rest: ['#8fb0f0', '#4f7bd0', '#233f86'],
  idle: ['#4a5264', '#323948', '#1c212b'],
  neutral: ['#5b6272', '#3d4351', '#232731'],
};

function AnatomicalBodyBase({ side, bands, primary, secondary, selected, onSelect, className }: Props) {
  const c = useCopy();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const data = side === 'front' ? anteriorData : posteriorData;

  const lookFor = useMemo(() => {
    const exMode = !!primary || !!secondary;
    return (region: MuscleRegionId | null): Look | 'neutral' => {
      if (!region) return 'neutral';
      if (exMode) {
        if (primary?.includes(region)) return 'high';
        if (secondary?.includes(region)) return 'mid';
        return 'idle';
      }
      return bands?.[region] ?? 'rest';
    };
  }, [bands, primary, secondary]);

  const key = (e: KeyboardEvent, id: MuscleRegionId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(id);
    }
  };

  return (
    <svg
      className={`fx-body ${className ?? ''}`}
      viewBox="0 0 100 200"
      preserveAspectRatio="xMidYMid meet"
      role="group"
      aria-label={side === 'front' ? c.atlas.front : c.atlas.back}
    >
      <defs>
        {(Object.keys(PALETTE) as (keyof typeof PALETTE)[]).map((k) => (
          <linearGradient key={k} id={`${uid}-${k}`} x1="0.15" y1="0" x2="0.55" y2="1">
            <stop offset="0" stopColor={PALETTE[k][0]} />
            <stop offset="0.5" stopColor={PALETTE[k][1]} />
            <stop offset="1" stopColor={PALETTE[k][2]} />
          </linearGradient>
        ))}
        <radialGradient id={`${uid}-sheen`} cx="0.34" cy="0.28" r="0.85">
          <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="0.38" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="0.7" stopColor="#000" stopOpacity="0.08" />
          <stop offset="1" stopColor="#000" stopOpacity="0.5" />
        </radialGradient>
        <radialGradient id={`${uid}-floor`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.55" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="50" cy="196" rx="30" ry="3" fill={`url(#${uid}-floor)`} />

      {data.map((entry, gi) => {
        const region = regionIdFromMuscleSlug(entry.muscle);
        const look = lookFor(region);
        const isSel = !!region && selected === region;
        const clickable = !!region && !!onSelect;
        return (
          <g
            key={`${entry.muscle}-${gi}`}
            className={`fx-mus fx-mus--${look}${isSel ? ' is-sel' : ''}${clickable ? ' is-click' : ''}`}
            data-region={region ?? undefined}
            role={clickable ? 'button' : undefined}
            tabIndex={clickable ? 0 : undefined}
            aria-label={region ? c.muscle[region] : undefined}
            aria-pressed={clickable ? isSel : undefined}
            onClick={clickable ? () => onSelect!(region!) : undefined}
            onKeyDown={clickable ? (e) => key(e, region!) : undefined}
          >
            {entry.svgPoints.map((pts, i) => (
              <g key={i}>
                <polygon points={pts} className="fx-mus-base" fill={`url(#${uid}-${look})`} />
                <polygon points={pts} className="fx-mus-sheen" fill={`url(#${uid}-sheen)`} />
                {clickable && <polygon points={pts} className="fx-mus-hit" />}
              </g>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export const AnatomicalBody = memo(AnatomicalBodyBase);
