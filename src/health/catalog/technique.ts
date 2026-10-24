import { getExercise } from '../exerciseCatalog';

type Steps = { ru: string[]; en: string[] };

const BY_ID: Record<string, Steps> = {
  bench_press: {
    ru: ['Лопатки сведены и прижаты к скамье, стопы упираются в пол.', 'Опусти гриф к середине груди, локти под углом около 45°.', 'Выжми вверх по лёгкой дуге, не отрывая таз от скамьи.'],
    en: ['Pull shoulder blades together, feet planted.', 'Lower the bar to mid-chest, elbows ~45°.', 'Press up in a slight arc without lifting your hips.'],
  },
  squat: {
    ru: ['Гриф на трапециях, корпус напряжён, взгляд вперёд.', 'Садись, разводя колени по линии носков, до параллели бёдер с полом.', 'Вставай, толкая пол всей стопой, не заваливая корпус.'],
    en: ['Bar on traps, brace the core, eyes forward.', 'Sit down with knees tracking toes to parallel.', 'Drive up through the whole foot, keep the torso tall.'],
  },
  deadlift: {
    ru: ['Гриф над серединой стопы, спина нейтральная, лопатки «в карманы».', 'Тяни, выпрямляя ноги и таз одновременно, гриф скользит по ногам.', 'В верхней точке сожми ягодицы, не прогибай поясницу.'],
    en: ['Bar over mid-foot, neutral spine, lats tight.', 'Push the floor away, bar slides along your legs.', 'Lock out with glutes, do not hyperextend.'],
  },
  pull_up: {
    ru: ['Хват чуть шире плеч, лопатки опущены вниз.', 'Тяни грудь к перекладине, локти идут к бокам.', 'Опускайся медленно до полного выпрямления рук.'],
    en: ['Grip slightly wider than shoulders, depress the scapula.', 'Pull chest to the bar, elbows to ribs.', 'Lower slowly to full extension.'],
  },
  push_up: {
    ru: ['Корпус — прямая линия от головы до пяток.', 'Опускайся до касания груди пола, локти под 45°.', 'Выжимайся вверх, не проваливая поясницу.'],
    en: ['Body in a straight line from head to heels.', 'Lower chest to the floor, elbows ~45°.', 'Press up without sagging the lower back.'],
  },
  ohp: {
    ru: ['Гриф на уровне ключиц, ягодицы и пресс напряжены.', 'Выжимай вверх, слегка отводя голову назад.', 'Зафиксируй гриф над макушкой, локти почти прямые.'],
    en: ['Bar at collarbone height, glutes and abs tight.', 'Press up, moving your head slightly back.', 'Lock out overhead with near-straight elbows.'],
  },
  plank: {
    ru: ['Локти под плечами, корпус — прямая линия.', 'Сожми ягодицы и пресс, смотри в пол.', 'Дыши ровно, не задирай таз.'],
    en: ['Elbows under shoulders, body in one line.', 'Squeeze glutes and abs, gaze at the floor.', 'Breathe steadily, keep hips level.'],
  },
};

const BY_GROUP: Record<string, Steps> = {
  push: {
    ru: ['Зафиксируй лопатки и напряги корпус.', 'Опускай вес под контролем 2–3 секунды.', 'Выжимай мощно, без рывков, сохраняя локти под углом 45°.'],
    en: ['Set your shoulder blades and brace the core.', 'Lower the weight under control for 2–3 seconds.', 'Press powerfully with no jerking, elbows ~45°.'],
  },
  pull: {
    ru: ['Начинай движение лопатками, а не руками.', 'Тяни локти к корпусу, сводя лопатки.', 'Возвращай вес медленно до полного растяжения мышц.'],
    en: ['Start the pull with your shoulder blades, not arms.', 'Drive elbows to your torso and squeeze the back.', 'Return slowly to a full stretch.'],
  },
  legs: {
    ru: ['Стопы устойчиво, колени идут по линии носков.', 'Корпус напряжён, спина нейтральная.', 'Вставай, толкая пол пятками и серединой стопы.'],
    en: ['Stable feet, knees track over toes.', 'Brace the core, keep the spine neutral.', 'Drive up through heels and mid-foot.'],
  },
  core: {
    ru: ['Подкрути таз и напряги пресс до начала движения.', 'Двигайся медленно, без инерции.', 'Не задерживай дыхание — выдох на усилии.'],
    en: ['Tuck the pelvis and brace the abs before moving.', 'Move slowly, no momentum.', 'Exhale on effort, never hold your breath.'],
  },
  all: {
    ru: ['Разомнись и отработай технику на лёгком весе.', 'Держи корпус стабильным, двигайся плавно.', 'Заканчивай подход, пока техника не ломается.'],
    en: ['Warm up and groove the pattern first.', 'Stay stable and move smoothly.', 'Stop the set before form breaks.'],
  },
};

export function techniqueSteps(locale: string, exerciseId: string): string[] {
  const lang = locale === 'en' ? 'en' : 'ru';
  const exact = BY_ID[exerciseId];
  if (exact) return exact[lang];
  const group = getExercise(exerciseId)?.muscleGroup ?? 'all';
  return (BY_GROUP[group] ?? BY_GROUP.all)[lang];
}

const EQUIP_RU: [RegExp, string][] = [
  [/Barbell/gi, 'Штанга'],
  [/Dumbbells?/gi, 'Гантели'],
  [/Bodyweight/gi, 'Свой вес'],
  [/Bench/gi, 'Скамья'],
  [/Rack/gi, 'Стойка'],
  [/Cable/gi, 'Блок'],
  [/Machine/gi, 'Тренажёр'],
  [/Treadmill/gi, 'Беговая дорожка'],
  [/Kettlebell/gi, 'Гиря'],
  [/Pull-up bar/gi, 'Турник'],
  [/Gym/gi, 'Тренажёрный зал'],
];

export function equipmentLabel(locale: string, eq: string) {
  if (locale === 'en') return eq;
  return EQUIP_RU.reduce((s, [re, to]) => s.replace(re, to), eq);
}
