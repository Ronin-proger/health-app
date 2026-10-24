export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export type ExerciseMeta = {
  description: string;
  technique: string;
  difficulty: Difficulty;
  equipment: string;
};

const DEFAULT: ExerciseMeta = {
  description: 'Compound movement for strength and muscle development.',
  technique: 'Brace your core, move with control, and use a full range of motion. Stop before form breaks down.',
  difficulty: 'Intermediate',
  equipment: 'Gym',
};

const BY_ID: Record<string, Partial<ExerciseMeta>> = {
  bench_press: {
    description: 'Horizontal press for chest, shoulders, and triceps.',
    technique: 'Retract shoulder blades, feet planted, lower bar to mid-chest, press up without flaring elbows excessively.',
    difficulty: 'Intermediate',
    equipment: 'Barbell · Bench',
  },
  squat: {
    description: 'King of leg training — quads, glutes, and core stability.',
    technique: 'Break at hips and knees together, chest up, depth where hip crease passes knee, drive through mid-foot.',
    difficulty: 'Intermediate',
    equipment: 'Barbell · Rack',
  },
  deadlift: {
    description: 'Full posterior chain loader — hamstrings, glutes, back.',
    technique: 'Hinge with neutral spine, lats tight, bar close to shins, stand by pushing floor away.',
    difficulty: 'Advanced',
    equipment: 'Barbell',
  },
  pull_up: {
    description: 'Vertical pull for lats and biceps strength.',
    technique: 'Depress scapula, pull chest toward bar, control the descent.',
    difficulty: 'Intermediate',
    equipment: 'Pull-up bar',
  },
  push_up: {
    description: 'Bodyweight horizontal press — chest and core.',
    technique: 'Plank position, elbows ~45°, full depth, maintain straight line head to heels.',
    difficulty: 'Beginner',
    equipment: 'Bodyweight',
  },
  plank: {
    description: 'Isometric core bracing for stability.',
    technique: 'Elbows under shoulders, squeeze glutes, breathe without losing position.',
    difficulty: 'Beginner',
    equipment: 'Bodyweight',
  },
  burpee: {
    description: 'Full-body conditioning drill.',
    technique: 'Squat down, jump back to plank, optional push-up, jump feet in, explosive jump.',
    difficulty: 'Intermediate',
    equipment: 'Bodyweight',
  },
  treadmill_run: {
    description: 'Steady-state or interval cardio.',
    technique: 'Upright posture, quick cadence, land softly under hips.',
    difficulty: 'Beginner',
    equipment: 'Treadmill',
  },
};

export function getExerciseMeta(id: string, name: string, muscleGroup: string): ExerciseMeta {
  const base = BY_ID[id] ?? {};
  return {
    ...DEFAULT,
    ...base,
    description:
      base.description ??
      `${name} targets ${muscleGroup === 'all' ? 'multiple systems' : muscleGroup + ' patterns'} with controlled reps and progressive overload.`,
  };
}
