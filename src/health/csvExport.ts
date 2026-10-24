import { FitnessLocalState } from './types';
import { getExercise } from './exerciseCatalog';

export function exportProgressCsv(state: FitnessLocalState) {
  const lines = ['type,date,workout,exercise,reps,weight_kg,rpe,calories,duration_min'];
  for (const w of state.workouts) {
    lines.push(
      [
        'workout',
        w.date,
        w.name,
        '',
        '',
        '',
        '',
        w.caloriesEst,
        w.durationMin,
      ].join(',')
    );
  }
  for (const s of state.setLogs) {
    const ex = getExercise(s.exerciseId);
    lines.push(
      [
        'set',
        s.loggedAt.slice(0, 10),
        '',
        ex?.name ?? s.exerciseId,
        s.reps,
        s.weightKg,
        s.rpe ?? '',
        '',
        '',
      ].join(',')
    );
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `corpus-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
