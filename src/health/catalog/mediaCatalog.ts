/** Thematic fitness imagery — local training photos, Unsplash only as fallback. */

import { EXERCISE_PHOTO, WORKOUT_PHOTO, localFit } from './fitPhotos';

export function unsplashFit(photoId: string, w = 800, h = 560) {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;
}

/** Local covers (bundled) → remote Unsplash fallback */
export const WORKOUT_COVERS: Record<
  string,
  { local: string; remote: string; alt: string }
> = {
  push_day: {
    local: '/images/workouts/push_day.jpg',
    remote: unsplashFit('photo-1571019614242-c5c5dee9f50e'),
    alt: 'Bench press',
  },
  pull_day: {
    local: '/images/workouts/pull_day.jpg',
    remote: unsplashFit('photo-1517836357463-d25dfeac3438'),
    alt: 'Pull up',
  },
  leg_day: {
    local: '/images/workouts/leg_day.jpg',
    remote: unsplashFit('photo-1434682882548-47a174e062fa'),
    alt: 'Barbell squat',
  },
  core_focus: {
    local: '/images/workouts/core_focus.jpg',
    remote: unsplashFit('photo-1518612044916-336a41a3a0e3'),
    alt: 'Plank core',
  },
  full_body: {
    local: '/images/workouts/full_body.jpg',
    remote: unsplashFit('photo-1518611012118-696072aa579a'),
    alt: 'Deadlift gym',
  },
  upper_body: {
    local: '/images/workouts/upper_body.jpg',
    remote: unsplashFit('photo-1583454118551-050a774d3da6'),
    alt: 'Shoulder press',
  },
  lower_body: {
    local: '/images/workouts/lower_body.jpg',
    remote: unsplashFit('photo-1518611012118-696072aa579a'),
    alt: 'Deadlift',
  },
  hiit: {
    local: '/images/workouts/hiit.jpg',
    remote: unsplashFit('photo-1571902942392-0c6a1e2c2f2e'),
    alt: 'HIIT training',
  },
  cardio: {
    local: '/images/workouts/cardio.jpg',
    remote: unsplashFit('photo-1476480862126-209bfaa8edc8'),
    alt: 'Running cardio',
  },
  mobility: {
    local: '/images/workouts/mobility.jpg',
    remote: unsplashFit('photo-1544367567-0f2fcb009e0b'),
    alt: 'Stretch mobility',
  },
  stretching: {
    local: '/images/workouts/stretching.jpg',
    remote: unsplashFit('photo-1544367567-0f2fcb009e0b'),
    alt: 'Stretching',
  },
  abs: {
    local: '/images/workouts/abs.jpg',
    remote: unsplashFit('photo-1601422407692-ec4ee3087849'),
    alt: 'Abs workout',
  },
  glutes: {
    local: '/images/workouts/glutes.jpg',
    remote: unsplashFit('photo-1571019613454-1cb2f99b2d8b'),
    alt: 'Glute training',
  },
  back_day: {
    local: '/images/workouts/back_day.jpg',
    remote: unsplashFit('photo-1534438327276-14e5300c3a48'),
    alt: 'Barbell row',
  },
  chest_day: {
    local: '/images/workouts/chest_day.jpg',
    remote: unsplashFit('photo-1571019614242-c5c5dee9f50e'),
    alt: 'Chest press',
  },
  arms: {
    local: '/images/workouts/arms.jpg',
    remote: unsplashFit('photo-1581009146145-b5efeda835ae'),
    alt: 'Bicep curl',
  },
  shoulders: {
    local: '/images/workouts/shoulders.jpg',
    remote: unsplashFit('photo-1583454118551-050a774d3da6'),
    alt: 'Shoulder press',
  },
  functional: {
    local: '/images/workouts/functional.jpg',
    remote: unsplashFit('photo-1574680096145-d05b474e2155'),
    alt: 'Functional training',
  },
  powerlifting: {
    local: '/images/workouts/powerlifting.jpg',
    remote: unsplashFit('photo-1518611012118-696072aa579a'),
    alt: 'Powerlifting',
  },
  calisthenics: {
    local: '/images/workouts/calisthenics.jpg',
    remote: unsplashFit('photo-1599058945522-28d584b6f581'),
    alt: 'Calisthenics',
  },
};

export function workoutCoverPrimary(workoutId: string, fallbackExerciseId?: string): string {
  const file = WORKOUT_PHOTO[workoutId] ?? (fallbackExerciseId ? EXERCISE_PHOTO[fallbackExerciseId] : undefined) ?? 'press';
  return localFit(file);
}

export function workoutCoverRemote(workoutId: string, fallbackExerciseId?: string): string {
  const entry = WORKOUT_COVERS[workoutId];
  if (entry) return entry.remote;
  if (fallbackExerciseId) return exerciseCoverRemote(fallbackExerciseId);
  return WORKOUT_COVERS.push_day.remote;
}

/** Per-exercise Unsplash (thematic) */
const EXERCISE_UNSPLASH: Record<string, string> = {
  bench_press: 'photo-1571019614242-c5c5dee9f50e',
  incline_db_press: 'photo-1581009146145-b5efeda835ae',
  ohp: 'photo-1583454118551-050a774d3da6',
  dips: 'photo-1598971639058-fab3c310fb2c',
  push_up: 'photo-1598971639058-fab3c310fb2c',
  cable_fly: 'photo-1571019614242-c5c5dee9f50e',
  tricep_pushdown: 'photo-1581009146145-b5efeda835ae',
  lateral_raise: 'photo-1583454118551-050a774d3da6',
  pull_up: 'photo-1517836357463-d25dfeac3438',
  chin_up: 'photo-1517836357463-d25dfeac3438',
  barbell_row: 'photo-1534438327276-14e5300c3a48',
  lat_pulldown: 'photo-1549060279-7e168fcee0c2',
  seated_cable_row: 'photo-1534438327276-14e5300c3a48',
  face_pull: 'photo-1534438327276-14e5300c3a48',
  bicep_curl: 'photo-1581009146145-b5efeda835ae',
  hammer_curl: 'photo-1581009146145-b5efeda835ae',
  squat: 'photo-1434682882548-47a174e062fa',
  front_squat: 'photo-1434682882548-47a174e062fa',
  deadlift: 'photo-1518611012118-696072aa579a',
  rdl: 'photo-1518611012118-696072aa579a',
  lunge: 'photo-1574680096145-d05b474e2155',
  leg_press: 'photo-1434682882548-47a174e062fa',
  leg_curl: 'photo-1571019613454-1cb2f99b2d8b',
  calf_raise: 'photo-1574680096145-d05b474e2155',
  hip_thrust: 'photo-1571019613454-1cb2f99b2d8b',
  plank: 'photo-1518612044916-336a41a3a0e3',
  cable_crunch: 'photo-1601422407692-ec4ee3087849',
  hanging_leg_raise: 'photo-1601422407692-ec4ee3087849',
  russian_twist: 'photo-1601422407692-ec4ee3087849',
  ab_wheel: 'photo-1518612044916-336a41a3a0e3',
  burpee: 'photo-1571902942392-0c6a1e2c2f2e',
  box_jump: 'photo-1571902942392-0c6a1e2c2f2e',
  kettlebell_swing: 'photo-1574680096145-d05b474e2155',
  battle_rope: 'photo-1571902942392-0c6a1e2c2f2e',
  treadmill_run: 'photo-1476480862126-209bfaa8edc8',
  bike_sprint: 'photo-1476480862126-209bfaa8edc8',
  jump_rope: 'photo-1571902942392-0c6a1e2c2f2e',
  cat_cow: 'photo-1544367567-0f2fcb009e0b',
  hip_flexor_stretch: 'photo-1544367567-0f2fcb009e0b',
  shoulder_dislocate: 'photo-1544367567-0f2fcb009e0b',
  pistol_squat: 'photo-1599058945522-28d584b6f581',
  muscle_up: 'photo-1599058945522-28d584b6f581',
  handstand_pushup: 'photo-1599058945522-28d584b6f581',
  clean_and_press: 'photo-1583454118551-050a774d3da6',
  power_snatch: 'photo-1518611012118-696072aa579a',
  farmer_carry: 'photo-1518611012118-696072aa579a',
  sled_push: 'photo-1434682882548-47a174e062fa',
  db_pullover: 'photo-1549060279-7e168fcee0c2',
  skull_crusher: 'photo-1571019614242-c5c5dee9f50e',
  chest_supported_row: 'photo-1534438327276-14e5300c3a48',
  split_squat: 'photo-1574680096145-d05b474e2155',
  good_morning: 'photo-1518611012118-696072aa579a',
  mountain_climber: 'photo-1571902942392-0c6a1e2c2f2e',
  side_plank: 'photo-1518612044916-336a41a3a0e3',
};

export function exerciseCoverPrimary(exerciseId: string, _w = 800, _h = 560): string {
  return localFit(EXERCISE_PHOTO[exerciseId] ?? 'press');
}

export function exerciseCoverRemote(exerciseId: string, w = 800, h = 560): string {
  const id = EXERCISE_UNSPLASH[exerciseId] ?? EXERCISE_UNSPLASH.bench_press;
  return unsplashFit(id, w, h);
}
