import { CustomWorkout, ExercisePrescription, MuscleGroup } from './types';
import { EXERCISES_LIST } from './catalog/exercisesList';
import { WORKOUTS_LIST, WorkoutTemplateDef } from './catalog/workoutsList';
import { athleteCover } from './catalog/photos';

export type ExerciseDef = (typeof EXERCISES_LIST)[number];

export const EXERCISES = EXERCISES_LIST;
export const WORKOUT_TEMPLATES = WORKOUTS_LIST;

export function getExercise(id: string) {
  return EXERCISES.find((e) => e.id === id);
}

export function defaultPrescription(exerciseId: string): ExercisePrescription {
  const ex = getExercise(exerciseId);
  return {
    exerciseId,
    sets: ex?.defaultSets ?? 3,
    reps: ex?.defaultReps ?? '10',
    weightKg: ex?.muscleGroup === 'legs' ? 60 : 40,
    restSec: ex?.restSec ?? 90,
    notes: '',
  };
}

export function prescriptionsForWorkout(w: {
  exerciseIds: string[];
  prescriptions?: ExercisePrescription[];
}) {
  const map = new Map((w.prescriptions ?? []).map((p) => [p.exerciseId, p]));
  return w.exerciseIds.map((id) => map.get(id) ?? defaultPrescription(id));
}

export function allWorkouts(custom: CustomWorkout[]) {
  const built = WORKOUTS_LIST.map((w) => ({ ...w, builtin: true as const }));
  const customMapped = custom.map((c) => ({
    id: c.id,
    name: c.name,
    muscleGroup: c.muscleGroup,
    description: c.description ?? 'Custom program',
    coverUrl: c.coverUrl ?? c.imageUrl ?? athleteCover(),
    imageUrl: c.coverUrl ?? c.imageUrl ?? athleteCover(),
    durationMin: c.durationMin ?? Math.max(20, c.exerciseIds.length * 12),
    caloriesEst: c.caloriesEst ?? c.exerciseIds.length * 45,
    exerciseIds: c.exerciseIds,
    prescriptions: c.prescriptions,
    builtin: false as const,
  }));
  return [...built, ...customMapped];
}

export const MUSCLE_FILTERS: { id: MuscleGroup; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'push', label: 'Push' },
  { id: 'pull', label: 'Pull' },
  { id: 'legs', label: 'Legs' },
  { id: 'core', label: 'Core' },
];

export type WorkoutTemplate = WorkoutTemplateDef;
