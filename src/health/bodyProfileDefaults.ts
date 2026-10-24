import { BodyProfile } from './types';

export const DEFAULT_BODY_PROFILE: BodyProfile = {
  heightCm: 178,
  weightKg: 76,
  age: 24,
  sex: 'unspecified',
  bodyFatPct: 14,
  targetWeightKg: 74,
};

export function normalizeBodyProfile(p?: BodyProfile): BodyProfile {
  return { ...DEFAULT_BODY_PROFILE, ...p };
}

export function bmi(profile: BodyProfile) {
  const m = profile.heightCm / 100;
  if (!m) return 0;
  return Math.round((profile.weightKg / (m * m)) * 10) / 10;
}
