import { MuscleGroup } from '../types';
import { PHOTOS } from './photos';
import { exercisePhotoUrl } from './exercisePhotos';
import { getExerciseMeta } from './exerciseMeta';

type E = {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  targetMuscles: string[];
  photo: keyof typeof PHOTOS;
  defaultSets: number;
  defaultReps: string;
  restSec: number;
};

const RAW: E[] = [
  { id: 'bench_press', name: 'Bench Press', muscleGroup: 'push', targetMuscles: ['Chest', 'Triceps'], photo: 'bench', defaultSets: 4, defaultReps: '8-12', restSec: 90 },
  { id: 'incline_db_press', name: 'Incline Dumbbell Press', muscleGroup: 'push', targetMuscles: ['Upper chest'], photo: 'bench', defaultSets: 3, defaultReps: '10-12', restSec: 90 },
  { id: 'ohp', name: 'Shoulder Press', muscleGroup: 'push', targetMuscles: ['Shoulders', 'Triceps'], photo: 'ohp', defaultSets: 4, defaultReps: '8-10', restSec: 90 },
  { id: 'dips', name: 'Parallel Bar Dips', muscleGroup: 'push', targetMuscles: ['Chest', 'Triceps'], photo: 'pushup', defaultSets: 3, defaultReps: '6-12', restSec: 75 },
  { id: 'push_up', name: 'Push Up', muscleGroup: 'push', targetMuscles: ['Chest', 'Core'], photo: 'pushup', defaultSets: 3, defaultReps: '12-20', restSec: 60 },
  { id: 'cable_fly', name: 'Cable Fly', muscleGroup: 'push', targetMuscles: ['Chest'], photo: 'bench', defaultSets: 3, defaultReps: '12-15', restSec: 60 },
  { id: 'tricep_pushdown', name: 'Tricep Pushdown', muscleGroup: 'push', targetMuscles: ['Triceps'], photo: 'curl', defaultSets: 3, defaultReps: '12-15', restSec: 60 },
  { id: 'lateral_raise', name: 'Lateral Raise', muscleGroup: 'push', targetMuscles: ['Side delts'], photo: 'ohp', defaultSets: 3, defaultReps: '12-15', restSec: 45 },
  { id: 'pull_up', name: 'Pull Up', muscleGroup: 'pull', targetMuscles: ['Lats', 'Biceps'], photo: 'pullup', defaultSets: 4, defaultReps: '5-10', restSec: 120 },
  { id: 'chin_up', name: 'Chin Up', muscleGroup: 'pull', targetMuscles: ['Lats', 'Biceps'], photo: 'pullup', defaultSets: 3, defaultReps: '6-10', restSec: 90 },
  { id: 'barbell_row', name: 'Barbell Row', muscleGroup: 'pull', targetMuscles: ['Back', 'Biceps'], photo: 'row', defaultSets: 4, defaultReps: '8-12', restSec: 90 },
  { id: 'lat_pulldown', name: 'Lat Pulldown', muscleGroup: 'pull', targetMuscles: ['Lats'], photo: 'lat', defaultSets: 3, defaultReps: '10-12', restSec: 75 },
  { id: 'seated_cable_row', name: 'Seated Cable Row', muscleGroup: 'pull', targetMuscles: ['Mid back'], photo: 'row', defaultSets: 3, defaultReps: '10-12', restSec: 75 },
  { id: 'face_pull', name: 'Face Pull', muscleGroup: 'pull', targetMuscles: ['Rear delts'], photo: 'row', defaultSets: 3, defaultReps: '15-20', restSec: 45 },
  { id: 'bicep_curl', name: 'Bicep Curl', muscleGroup: 'pull', targetMuscles: ['Biceps'], photo: 'curl', defaultSets: 3, defaultReps: '10-12', restSec: 60 },
  { id: 'hammer_curl', name: 'Hammer Curl', muscleGroup: 'pull', targetMuscles: ['Brachialis'], photo: 'curl', defaultSets: 3, defaultReps: '10-12', restSec: 60 },
  { id: 'squat', name: 'Back Squat', muscleGroup: 'legs', targetMuscles: ['Quads', 'Glutes'], photo: 'squat', defaultSets: 4, defaultReps: '6-10', restSec: 120 },
  { id: 'front_squat', name: 'Front Squat', muscleGroup: 'legs', targetMuscles: ['Quads', 'Core'], photo: 'squat', defaultSets: 3, defaultReps: '6-8', restSec: 120 },
  { id: 'deadlift', name: 'Deadlift', muscleGroup: 'legs', targetMuscles: ['Hamstrings', 'Glutes', 'Back'], photo: 'deadlift', defaultSets: 4, defaultReps: '5-8', restSec: 150 },
  { id: 'rdl', name: 'Romanian Deadlift', muscleGroup: 'legs', targetMuscles: ['Hamstrings'], photo: 'deadlift', defaultSets: 3, defaultReps: '8-12', restSec: 90 },
  { id: 'lunge', name: 'Walking Lunge', muscleGroup: 'legs', targetMuscles: ['Quads', 'Glutes'], photo: 'lunge', defaultSets: 3, defaultReps: '10/leg', restSec: 60 },
  { id: 'leg_press', name: 'Leg Press', muscleGroup: 'legs', targetMuscles: ['Quads'], photo: 'squat', defaultSets: 4, defaultReps: '10-15', restSec: 90 },
  { id: 'leg_curl', name: 'Leg Curl', muscleGroup: 'legs', targetMuscles: ['Hamstrings'], photo: 'glutes', defaultSets: 3, defaultReps: '12-15', restSec: 60 },
  { id: 'calf_raise', name: 'Calf Raise', muscleGroup: 'legs', targetMuscles: ['Calves'], photo: 'lunge', defaultSets: 4, defaultReps: '15-20', restSec: 45 },
  { id: 'hip_thrust', name: 'Hip Thrust', muscleGroup: 'legs', targetMuscles: ['Glutes'], photo: 'glutes', defaultSets: 4, defaultReps: '8-12', restSec: 90 },
  { id: 'plank', name: 'Plank', muscleGroup: 'core', targetMuscles: ['Core'], photo: 'plank', defaultSets: 3, defaultReps: '45-60s', restSec: 45 },
  { id: 'cable_crunch', name: 'Cable Crunch', muscleGroup: 'core', targetMuscles: ['Abs'], photo: 'abs', defaultSets: 3, defaultReps: '12-15', restSec: 45 },
  { id: 'hanging_leg_raise', name: 'Hanging Leg Raise', muscleGroup: 'core', targetMuscles: ['Lower abs'], photo: 'abs', defaultSets: 3, defaultReps: '10-15', restSec: 60 },
  { id: 'russian_twist', name: 'Russian Twist', muscleGroup: 'core', targetMuscles: ['Obliques'], photo: 'abs', defaultSets: 3, defaultReps: '20', restSec: 45 },
  { id: 'ab_wheel', name: 'Ab Wheel Rollout', muscleGroup: 'core', targetMuscles: ['Core'], photo: 'plank', defaultSets: 3, defaultReps: '8-12', restSec: 60 },
  { id: 'burpee', name: 'Burpee', muscleGroup: 'all', targetMuscles: ['Full body'], photo: 'hiit', defaultSets: 3, defaultReps: '10-15', restSec: 60 },
  { id: 'box_jump', name: 'Box Jump', muscleGroup: 'legs', targetMuscles: ['Power'], photo: 'hiit', defaultSets: 3, defaultReps: '8-10', restSec: 75 },
  { id: 'kettlebell_swing', name: 'Kettlebell Swing', muscleGroup: 'legs', targetMuscles: ['Hips', 'Core'], photo: 'hiit', defaultSets: 4, defaultReps: '15-20', restSec: 60 },
  { id: 'battle_rope', name: 'Battle Ropes', muscleGroup: 'all', targetMuscles: ['Cardio', 'Shoulders'], photo: 'hiit', defaultSets: 4, defaultReps: '30s', restSec: 45 },
  { id: 'treadmill_run', name: 'Treadmill Run', muscleGroup: 'all', targetMuscles: ['Cardio'], photo: 'run', defaultSets: 1, defaultReps: '20 min', restSec: 0 },
  { id: 'bike_sprint', name: 'Assault Bike Sprint', muscleGroup: 'all', targetMuscles: ['Cardio'], photo: 'cardio', defaultSets: 6, defaultReps: '30s', restSec: 60 },
  { id: 'jump_rope', name: 'Jump Rope', muscleGroup: 'all', targetMuscles: ['Cardio', 'Calves'], photo: 'cardio', defaultSets: 3, defaultReps: '2 min', restSec: 45 },
  { id: 'cat_cow', name: 'Cat Cow', muscleGroup: 'core', targetMuscles: ['Spine mobility'], photo: 'stretch', defaultSets: 2, defaultReps: '10', restSec: 30 },
  { id: 'hip_flexor_stretch', name: 'Hip Flexor Stretch', muscleGroup: 'legs', targetMuscles: ['Hips'], photo: 'stretch', defaultSets: 2, defaultReps: '45s/side', restSec: 30 },
  { id: 'shoulder_dislocate', name: 'Band Shoulder Dislocate', muscleGroup: 'push', targetMuscles: ['Mobility'], photo: 'stretch', defaultSets: 2, defaultReps: '12', restSec: 30 },
  { id: 'pistol_squat', name: 'Pistol Squat', muscleGroup: 'legs', targetMuscles: ['Quads', 'Balance'], photo: 'calisthenics', defaultSets: 3, defaultReps: '5/leg', restSec: 90 },
  { id: 'muscle_up', name: 'Muscle Up', muscleGroup: 'pull', targetMuscles: ['Lats', 'Chest'], photo: 'calisthenics', defaultSets: 3, defaultReps: '3-6', restSec: 120 },
  { id: 'handstand_pushup', name: 'Pike Push Up', muscleGroup: 'push', targetMuscles: ['Shoulders'], photo: 'calisthenics', defaultSets: 3, defaultReps: '8-12', restSec: 75 },
  { id: 'clean_and_press', name: 'Clean & Press', muscleGroup: 'all', targetMuscles: ['Full body'], photo: 'ohp', defaultSets: 4, defaultReps: '5-8', restSec: 120 },
  { id: 'power_snatch', name: 'Power Snatch', muscleGroup: 'all', targetMuscles: ['Explosive'], photo: 'deadlift', defaultSets: 4, defaultReps: '3-5', restSec: 150 },
  { id: 'farmer_carry', name: 'Farmer Carry', muscleGroup: 'all', targetMuscles: ['Grip', 'Core'], photo: 'deadlift', defaultSets: 3, defaultReps: '40m', restSec: 90 },
  { id: 'sled_push', name: 'Sled Push', muscleGroup: 'legs', targetMuscles: ['Quads'], photo: 'squat', defaultSets: 4, defaultReps: '20m', restSec: 90 },
  { id: 'db_pullover', name: 'Dumbbell Pullover', muscleGroup: 'pull', targetMuscles: ['Lats', 'Chest'], photo: 'lat', defaultSets: 3, defaultReps: '12-15', restSec: 60 },
  { id: 'skull_crusher', name: 'Skull Crusher', muscleGroup: 'push', targetMuscles: ['Triceps'], photo: 'bench', defaultSets: 3, defaultReps: '10-12', restSec: 75 },
  { id: 'chest_supported_row', name: 'Chest Supported Row', muscleGroup: 'pull', targetMuscles: ['Upper back'], photo: 'row', defaultSets: 3, defaultReps: '10-12', restSec: 75 },
  { id: 'split_squat', name: 'Bulgarian Split Squat', muscleGroup: 'legs', targetMuscles: ['Quads', 'Glutes'], photo: 'lunge', defaultSets: 3, defaultReps: '10/leg', restSec: 75 },
  { id: 'good_morning', name: 'Good Morning', muscleGroup: 'legs', targetMuscles: ['Hamstrings'], photo: 'deadlift', defaultSets: 3, defaultReps: '10-12', restSec: 90 },
  { id: 'mountain_climber', name: 'Mountain Climber', muscleGroup: 'core', targetMuscles: ['Core', 'Cardio'], photo: 'hiit', defaultSets: 3, defaultReps: '30s', restSec: 45 },
  { id: 'side_plank', name: 'Side Plank', muscleGroup: 'core', targetMuscles: ['Obliques'], photo: 'plank', defaultSets: 3, defaultReps: '40s/side', restSec: 45 },
];

export const EXERCISES_LIST = RAW.map((e) => {
  const meta = getExerciseMeta(e.id, e.name, e.muscleGroup);
  return {
    id: e.id,
    name: e.name,
    muscleGroup: e.muscleGroup,
    targetMuscles: e.targetMuscles,
    imageUrl: exercisePhotoUrl(e.id, 800, 600),
    demoGifUrl: exercisePhotoUrl(e.id, 720, 540),
    defaultSets: e.defaultSets,
    defaultReps: e.defaultReps,
    restSec: e.restSec,
    caloriesPerSet: 8 + Math.min(8, e.defaultSets),
    description: meta.description,
    technique: meta.technique,
    difficulty: meta.difficulty,
    equipment: meta.equipment,
  };
});
