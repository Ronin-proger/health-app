import { MuscleGroup } from '../types';
import { workoutCoverUrl } from './exercisePhotos';

export interface WorkoutTemplateDef {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  description: string;
  coverUrl: string;
  durationMin: number;
  caloriesEst: number;
  exerciseIds: string[];
  builtin: true;
}

function w(
  def: Omit<WorkoutTemplateDef, 'coverUrl' | 'builtin'> & { exerciseIds: string[] }
): WorkoutTemplateDef {
  return {
    ...def,
    coverUrl: workoutCoverUrl(def.id, def.exerciseIds[0]),
    builtin: true,
  };
}

export const WORKOUTS_LIST: WorkoutTemplateDef[] = [
  w({ id: 'push_day', name: 'Push Day', muscleGroup: 'push', description: 'Chest, shoulders, triceps.', durationMin: 45, caloriesEst: 320, exerciseIds: ['bench_press', 'ohp', 'incline_db_press', 'tricep_pushdown', 'lateral_raise'] }),
  w({ id: 'pull_day', name: 'Pull Day', muscleGroup: 'pull', description: 'Back thickness and biceps.', durationMin: 42, caloriesEst: 300, exerciseIds: ['pull_up', 'barbell_row', 'lat_pulldown', 'face_pull', 'bicep_curl'] }),
  w({ id: 'leg_day', name: 'Leg Day', muscleGroup: 'legs', description: 'Quads, hamstrings, glutes.', durationMin: 50, caloriesEst: 380, exerciseIds: ['squat', 'rdl', 'leg_press', 'lunge', 'calf_raise'] }),
  w({ id: 'core_focus', name: 'Core Focus', muscleGroup: 'core', description: 'Anti-rotation and bracing.', durationMin: 28, caloriesEst: 180, exerciseIds: ['plank', 'cable_crunch', 'hanging_leg_raise', 'russian_twist'] }),
  w({ id: 'full_body', name: 'Full Body', muscleGroup: 'all', description: 'Compound lifts for total strength.', durationMin: 55, caloriesEst: 400, exerciseIds: ['squat', 'bench_press', 'barbell_row', 'ohp', 'plank'] }),
  w({ id: 'upper_body', name: 'Upper Body', muscleGroup: 'push', description: 'Push + pull supersets.', durationMin: 48, caloriesEst: 340, exerciseIds: ['bench_press', 'pull_up', 'ohp', 'barbell_row', 'dips'] }),
  w({ id: 'lower_body', name: 'Lower Body', muscleGroup: 'legs', description: 'Strength and power for legs.', durationMin: 52, caloriesEst: 390, exerciseIds: ['deadlift', 'front_squat', 'hip_thrust', 'split_squat', 'leg_curl'] }),
  w({ id: 'hiit', name: 'HIIT', muscleGroup: 'all', description: 'Intervals for conditioning.', durationMin: 30, caloriesEst: 350, exerciseIds: ['burpee', 'kettlebell_swing', 'battle_rope', 'box_jump', 'mountain_climber'] }),
  w({ id: 'cardio', name: 'Cardio', muscleGroup: 'all', description: 'Engine building session.', durationMin: 35, caloriesEst: 320, exerciseIds: ['treadmill_run', 'bike_sprint', 'jump_rope'] }),
  w({ id: 'mobility', name: 'Mobility', muscleGroup: 'core', description: 'Move better, recover faster.', durationMin: 25, caloriesEst: 120, exerciseIds: ['cat_cow', 'hip_flexor_stretch', 'shoulder_dislocate', 'side_plank'] }),
  w({ id: 'stretching', name: 'Stretching', muscleGroup: 'core', description: 'Long-hold flexibility.', durationMin: 20, caloriesEst: 90, exerciseIds: ['hip_flexor_stretch', 'cat_cow', 'shoulder_dislocate'] }),
  w({ id: 'abs', name: 'Abs', muscleGroup: 'core', description: 'Direct core volume.', durationMin: 22, caloriesEst: 150, exerciseIds: ['cable_crunch', 'hanging_leg_raise', 'russian_twist', 'ab_wheel'] }),
  w({ id: 'glutes', name: 'Glutes', muscleGroup: 'legs', description: 'Posterior chain emphasis.', durationMin: 40, caloriesEst: 280, exerciseIds: ['hip_thrust', 'rdl', 'split_squat', 'lunge', 'good_morning'] }),
  w({ id: 'back_day', name: 'Back', muscleGroup: 'pull', description: 'Width and density.', durationMin: 44, caloriesEst: 310, exerciseIds: ['pull_up', 'chest_supported_row', 'lat_pulldown', 'seated_cable_row', 'db_pullover'] }),
  w({ id: 'chest_day', name: 'Chest', muscleGroup: 'push', description: 'Pressing volume.', durationMin: 40, caloriesEst: 290, exerciseIds: ['bench_press', 'incline_db_press', 'cable_fly', 'push_up', 'dips'] }),
  w({ id: 'arms', name: 'Arms', muscleGroup: 'pull', description: 'Biceps and triceps.', durationMin: 35, caloriesEst: 240, exerciseIds: ['bicep_curl', 'hammer_curl', 'skull_crusher', 'tricep_pushdown'] }),
  w({ id: 'shoulders', name: 'Shoulders', muscleGroup: 'push', description: 'Delts from all angles.', durationMin: 38, caloriesEst: 260, exerciseIds: ['ohp', 'lateral_raise', 'face_pull', 'handstand_pushup'] }),
  w({ id: 'functional', name: 'Functional', muscleGroup: 'all', description: 'Carries and real-world strength.', durationMin: 42, caloriesEst: 330, exerciseIds: ['farmer_carry', 'kettlebell_swing', 'sled_push', 'clean_and_press'] }),
  w({ id: 'powerlifting', name: 'Powerlifting', muscleGroup: 'legs', description: 'SBD focus.', durationMin: 60, caloriesEst: 420, exerciseIds: ['squat', 'bench_press', 'deadlift', 'good_morning'] }),
  w({ id: 'calisthenics', name: 'Calisthenics', muscleGroup: 'all', description: 'Bodyweight mastery.', durationMin: 45, caloriesEst: 300, exerciseIds: ['pull_up', 'push_up', 'pistol_squat', 'muscle_up', 'plank'] }),
];
