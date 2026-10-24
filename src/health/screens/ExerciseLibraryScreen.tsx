import { useMemo, useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { EXERCISES } from '../exerciseCatalog';
import { MuscleGroup } from '../types';
import { FitImage } from '../components/FitImage';
import { rise, stagger } from '../components/FxBits';
import { exercisePhotoUrl } from '../catalog/exercisePhotos';
import { fitExerciseName } from '../catalog/ruLabels';
import { useI18n } from '../../i18n';
import { useCopy } from '../copy';
import { DifficultyBars } from './HealthWorkoutsScreen';
import { exerciseDifficulty } from '../utils/workoutMeta';
import { exerciseMuscles } from '../utils/muscleRegions';

export function ExerciseLibraryScreen({ onOpenExercise }: { onOpenExercise: (id: string) => void }) {
  const { locale } = useI18n();
  const c = useCopy();
  const [filter, setFilter] = useState<MuscleGroup>('all');
  const [q, setQ] = useState('');

  const filters: { id: MuscleGroup; label: string }[] = [
    { id: 'all', label: c.workouts.filterAll },
    { id: 'push', label: c.workouts.push },
    { id: 'pull', label: c.workouts.pull },
    { id: 'legs', label: c.workouts.legs },
    { id: 'core', label: c.workouts.core },
  ];

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return EXERCISES.filter((e) => {
      if (filter !== 'all' && e.muscleGroup !== filter) return false;
      if (!query) return true;
      const m = exerciseMuscles(e.id);
      const muscles = [...m.primary, ...m.secondary].map((r) => c.muscle[r].toLowerCase()).join(' ');
      return (
        e.name.toLowerCase().includes(query) ||
        fitExerciseName(locale, e.id, e.name).toLowerCase().includes(query) ||
        muscles.includes(query)
      );
    });
  }, [filter, q, locale, c]);

  return (
    <motion.div className="fit-scroll fx-screen" variants={stagger} initial="hidden" animate="show">
      <motion.div variants={rise} className="fx-search">
        <Search size={18} />
        <input type="search" placeholder={locale === 'en' ? 'Search exercises or muscles' : 'Поиск упражнения или мышцы'} value={q} onChange={(e) => setQ(e.target.value)} />
      </motion.div>

      <motion.div variants={rise} className="fx-pills">
        {filters.map((f) => (
          <button key={f.id} type="button" className={`fx-pill${filter === f.id ? ' on' : ''}`} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </motion.div>

      <ul className="fx-list fx-list--gap">
        {list.map((ex) => {
          const m = exerciseMuscles(ex.id);
          return (
            <motion.li key={ex.id} variants={rise}>
              <button type="button" className="fx-row fx-row--card" onClick={() => onOpenExercise(ex.id)}>
                <span className="fx-row-thumb fx-row-thumb--lg">
                  <FitImage src={exercisePhotoUrl(ex.id)} alt="" variant="thumb" fallbackLabel={ex.name} />
                </span>
                <span className="fx-row-main">
                  <b>{fitExerciseName(locale, ex.id, ex.name)}</b>
                  <small>{m.primary.map((r) => c.muscle[r]).join(' · ') || ex.targetMuscles.join(' · ')}</small>
                  <DifficultyBars level={exerciseDifficulty(ex.id)} />
                </span>
                <ChevronRight size={18} className="fx-row-chev" />
              </button>
            </motion.li>
          );
        })}
      </ul>
    </motion.div>
  );
}
