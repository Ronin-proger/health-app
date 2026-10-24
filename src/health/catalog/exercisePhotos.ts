import {
  exerciseCoverPrimary,
  workoutCoverPrimary,
  workoutCoverRemote,
} from './mediaCatalog';

/** Primary URL (Unsplash thematic). Local workout files used via FitImage fallback chain. */
export function exercisePhotoUrl(exerciseId: string, w = 800, h = 560): string {
  return exerciseCoverPrimary(exerciseId, w, h);
}

/** Primary cover: local training photo. Remote Unsplash is the fallback. */
export function workoutCoverUrl(workoutId: string, fallbackExerciseId?: string): string {
  return workoutCoverPrimary(workoutId, fallbackExerciseId);
}

export function workoutCoverLocalUrl(workoutId: string): string {
  return workoutCoverPrimary(workoutId);
}

export function workoutCoverFallbackUrl(workoutId: string, fallbackExerciseId?: string): string {
  return workoutCoverRemote(workoutId, fallbackExerciseId);
}
