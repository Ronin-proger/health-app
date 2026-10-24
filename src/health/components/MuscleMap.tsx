import { useMemo } from 'react';
import { AnatomicalBody } from './AnatomicalBody';
import { useCopy } from '../copy';
import { exerciseMuscles } from '../utils/muscleRegions';

/** Front + back anatomy with the exercise's primary / secondary muscles lit up. */
export function MuscleMap({ exerciseId }: { exerciseId: string }) {
  const c = useCopy();
  const { primary, secondary } = useMemo(() => exerciseMuscles(exerciseId), [exerciseId]);
  return (
    <div className="fx-exmap">
      <div className="fx-exmap-figs">
        <figure>
          <div className="fx-stage fx-stage--sm">
            <AnatomicalBody side="front" primary={primary} secondary={secondary} />
          </div>
          <figcaption>{c.ex.front}</figcaption>
        </figure>
        <figure>
          <div className="fx-stage fx-stage--sm">
            <AnatomicalBody side="back" primary={primary} secondary={secondary} />
          </div>
          <figcaption>{c.ex.back}</figcaption>
        </figure>
      </div>
      <div className="fx-exmap-legend">
        {primary.length > 0 && (
          <div>
            <span className="fx-legend-tag fx-legend-tag--high">{c.ex.primary}</span>
            <p>{primary.map((r) => c.muscle[r]).join(' · ')}</p>
          </div>
        )}
        {secondary.length > 0 && (
          <div>
            <span className="fx-legend-tag fx-legend-tag--mid">{c.ex.secondary}</span>
            <p>{secondary.map((r) => c.muscle[r]).join(' · ')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
