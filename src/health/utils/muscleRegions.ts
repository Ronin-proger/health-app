export type MuscleRegionId =
  | 'chest'
  | 'back'
  | 'traps'
  | 'lowerback'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves';

export type MuscleRegionDef = {
  id: MuscleRegionId;
  label: string;
  side: 'front' | 'back' | 'both';
  match: (exerciseId: string) => boolean;
};

type Spec = [primary: MuscleRegionId[], secondary: MuscleRegionId[]];

/** Primary and secondary muscles for every catalogue exercise. */
const EXERCISE_MUSCLES: Record<string, Spec> = {
  bench_press: [['chest'], ['triceps', 'shoulders']],
  incline_db_press: [['chest', 'shoulders'], ['triceps']],
  ohp: [['shoulders'], ['triceps', 'traps']],
  dips: [['chest', 'triceps'], ['shoulders']],
  push_up: [['chest'], ['triceps', 'shoulders', 'abs']],
  cable_fly: [['chest'], ['shoulders']],
  tricep_pushdown: [['triceps'], ['forearms']],
  lateral_raise: [['shoulders'], ['traps']],
  pull_up: [['back'], ['biceps', 'forearms', 'abs']],
  chin_up: [['back', 'biceps'], ['forearms']],
  barbell_row: [['back'], ['biceps', 'lowerback', 'traps', 'forearms']],
  lat_pulldown: [['back'], ['biceps', 'forearms']],
  seated_cable_row: [['back'], ['biceps', 'traps']],
  face_pull: [['shoulders', 'traps'], ['back']],
  bicep_curl: [['biceps'], ['forearms']],
  hammer_curl: [['biceps', 'forearms'], []],
  squat: [['quads', 'glutes'], ['hamstrings', 'lowerback', 'abs']],
  front_squat: [['quads'], ['glutes', 'abs']],
  deadlift: [['hamstrings', 'glutes', 'lowerback'], ['back', 'traps', 'forearms', 'quads']],
  rdl: [['hamstrings', 'glutes'], ['lowerback', 'forearms']],
  lunge: [['quads', 'glutes'], ['hamstrings', 'calves']],
  leg_press: [['quads'], ['glutes', 'hamstrings']],
  leg_curl: [['hamstrings'], ['calves']],
  calf_raise: [['calves'], []],
  hip_thrust: [['glutes'], ['hamstrings']],
  plank: [['abs'], ['obliques', 'shoulders']],
  cable_crunch: [['abs'], ['obliques']],
  hanging_leg_raise: [['abs'], ['forearms', 'obliques']],
  russian_twist: [['obliques'], ['abs']],
  ab_wheel: [['abs'], ['shoulders', 'lowerback']],
  burpee: [['quads', 'chest'], ['shoulders', 'abs', 'triceps']],
  box_jump: [['quads', 'glutes'], ['calves']],
  kettlebell_swing: [['glutes', 'hamstrings'], ['lowerback', 'shoulders', 'abs']],
  battle_rope: [['shoulders'], ['biceps', 'abs', 'forearms']],
  treadmill_run: [['quads', 'calves'], ['hamstrings', 'glutes']],
  bike_sprint: [['quads'], ['calves', 'glutes']],
  jump_rope: [['calves'], ['shoulders', 'forearms']],
  cat_cow: [['lowerback', 'abs'], []],
  hip_flexor_stretch: [['quads'], ['glutes']],
  shoulder_dislocate: [['shoulders'], ['chest', 'traps']],
  pistol_squat: [['quads', 'glutes'], ['calves', 'abs']],
  muscle_up: [['back', 'chest'], ['triceps', 'biceps', 'shoulders']],
  handstand_pushup: [['shoulders', 'triceps'], ['traps', 'abs']],
  clean_and_press: [['shoulders', 'glutes', 'quads'], ['traps', 'back', 'triceps']],
  power_snatch: [['shoulders', 'glutes', 'quads'], ['traps', 'back', 'hamstrings']],
  farmer_carry: [['forearms', 'traps'], ['abs', 'shoulders']],
  sled_push: [['quads', 'glutes'], ['calves', 'shoulders']],
  db_pullover: [['back', 'chest'], ['triceps']],
  skull_crusher: [['triceps'], ['shoulders']],
  chest_supported_row: [['back', 'traps'], ['biceps']],
  split_squat: [['quads', 'glutes'], ['hamstrings']],
  good_morning: [['hamstrings', 'lowerback'], ['glutes']],
  mountain_climber: [['abs'], ['shoulders', 'quads']],
  side_plank: [['obliques'], ['shoulders', 'abs']],
};

/** Primary + secondary regions of an exercise (custom ids fall back to empty). */
export function exerciseMuscles(exerciseId: string): { primary: MuscleRegionId[]; secondary: MuscleRegionId[] } {
  const s = EXERCISE_MUSCLES[exerciseId];
  return s ? { primary: s[0], secondary: s[1] } : { primary: [], secondary: [] };
}

function has(id: MuscleRegionId) {
  return (exerciseId: string) => {
    const s = EXERCISE_MUSCLES[exerciseId];
    return !!s && (s[0].includes(id) || s[1].includes(id));
  };
}

const R = (id: MuscleRegionId, label: string, side: MuscleRegionDef['side']): MuscleRegionDef => ({
  id,
  label,
  side,
  match: has(id),
});

export const MUSCLE_REGIONS: MuscleRegionDef[] = [
  R('chest', 'Chest', 'front'),
  R('shoulders', 'Shoulders', 'both'),
  R('biceps', 'Biceps', 'front'),
  R('triceps', 'Triceps', 'back'),
  R('forearms', 'Forearms', 'both'),
  R('abs', 'Abs', 'front'),
  R('obliques', 'Obliques', 'front'),
  R('quads', 'Quads', 'front'),
  R('traps', 'Traps', 'back'),
  R('back', 'Back', 'back'),
  R('lowerback', 'Lower back', 'back'),
  R('glutes', 'Glutes', 'back'),
  R('hamstrings', 'Hamstrings', 'back'),
  R('calves', 'Calves', 'both'),
];

export function getRegion(id: MuscleRegionId): MuscleRegionDef {
  return MUSCLE_REGIONS.find((r) => r.id === id) ?? MUSCLE_REGIONS[0];
}

export function regionsForExercise(exerciseId: string): MuscleRegionId[] {
  return MUSCLE_REGIONS.filter((r) => r.match(exerciseId)).map((r) => r.id);
}

/** Anatomy polygon slug → analytics region (null = non-muscle part: head, neck, knees…) */
export function regionIdFromMuscleSlug(muscle: string): MuscleRegionId | null {
  switch (muscle) {
    case 'chest':
      return 'chest';
    case 'front-deltoids':
    case 'back-deltoids':
      return 'shoulders';
    case 'biceps':
      return 'biceps';
    case 'triceps':
      return 'triceps';
    case 'forearm':
      return 'forearms';
    case 'abs':
      return 'abs';
    case 'obliques':
      return 'obliques';
    case 'quadriceps':
    case 'abductors':
      return 'quads';
    case 'trapezius':
      return 'traps';
    case 'upper-back':
      return 'back';
    case 'lower-back':
      return 'lowerback';
    case 'gluteal':
      return 'glutes';
    case 'hamstring':
    case 'adductor':
      return 'hamstrings';
    case 'calves':
    case 'left-soleus':
    case 'right-soleus':
      return 'calves';
    default:
      return null;
  }
}

export type Band = 'high' | 'mid' | 'rest';

export function bandFromScore(score: number): Band {
  if (score >= 58) return 'high';
  if (score >= 26) return 'mid';
  return 'rest';
}
