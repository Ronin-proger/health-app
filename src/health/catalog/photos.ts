/** Curated Unsplash photo IDs for exercise / athlete imagery */
export const PHOTOS = {
  bench: 'photo-1571019614242-c5c5dee9f50e',
  squat: 'photo-1434682882548-47a174e062fa',
  deadlift: 'photo-1518611012118-696072aa579a',
  pullup: 'photo-1517836357463-d25dfeac3438',
  pushup: 'photo-1598971639058-fab3c310fb2c',
  plank: 'photo-1518612044916-336a41a3a0e3',
  lunge: 'photo-1574680096145-d05b474e2155',
  row: 'photo-1534438327276-14e5300c3a48',
  ohp: 'photo-1583454118551-050a774d3da6',
  curl: 'photo-1581009146145-b5efeda835ae',
  lat: 'photo-1549060279-7e168fcee0c2',
  run: 'photo-1476480862126-209bfaa8edc8',
  hiit: 'photo-1518612044916-336a41a3a0e3',
  stretch: 'photo-1544367567-0f2fcb009e0b',
  athlete: 'photo-1534438327276-14e5300c3a48',
  gym: 'photo-1534438327276-14e5300c3a48',
  abs: 'photo-1601422407692-ec4ee3087849',
  glutes: 'photo-1571019613454-1cb2f99b2d8b',
  cardio: 'photo-1571902942392-0c6a1e2c2f2e',
  calisthenics: 'photo-1599058945522-28d584b6f581',
} as const;

export function unsplash(id: string, w = 640) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
}

export function athleteCover(seed: keyof typeof PHOTOS = 'athlete') {
  return unsplash(PHOTOS[seed], 800);
}

/** Placehold.co fallback when Unsplash fails */
export function workoutPlaceholderUrl(label = 'Workout') {
  const text = encodeURIComponent(label.slice(0, 24));
  return `https://placehold.co/800x600/1A1A1A/C5F82A?text=${text}`;
}

/** Curated cover URLs for custom workout gallery picker */
export const COVER_GALLERY: { key: string; url: string }[] = (
  Object.entries(PHOTOS) as [keyof typeof PHOTOS, string][]
).map(([key, id]) => ({ key, url: unsplash(id, 800) }));

/** Per-exercise direct URLs (fixed Unsplash IDs) */
export const EXERCISE_PHOTO_URL: Record<string, string> = {
  bench_press: unsplash(PHOTOS.bench, 800),
  squat: unsplash(PHOTOS.squat, 800),
  deadlift: unsplash(PHOTOS.deadlift, 800),
  pull_up: unsplash(PHOTOS.pullup, 800),
  push_up: unsplash(PHOTOS.pushup, 800),
  plank: unsplash(PHOTOS.plank, 800),
  lunge: unsplash(PHOTOS.lunge, 800),
  barbell_row: unsplash(PHOTOS.row, 800),
  ohp: unsplash(PHOTOS.ohp, 800),
  bicep_curl: unsplash(PHOTOS.curl, 800),
  dips: unsplash(PHOTOS.pushup, 800),
  lat_pulldown: unsplash(PHOTOS.lat, 800),
  leg_press: unsplash(PHOTOS.squat, 800),
  hip_thrust: unsplash(PHOTOS.glutes, 800),
  calf_raise: unsplash(PHOTOS.lunge, 800),
};
