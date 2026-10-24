const RU_EX: Record<string, string> = {
  bench_press: 'Жим лёжа',
  incline_db_press: 'Жим гантелей на наклонной',
  ohp: 'Жим стоя',
  dips: 'Брусья',
  push_up: 'Отжимания',
  cable_fly: 'Сведения в кроссовере',
  tricep_pushdown: 'Разгибания на трицепс',
  lateral_raise: 'Махи в стороны',
  pull_up: 'Подтягивания',
  chin_up: 'Подтягивания обратным хватом',
  barbell_row: 'Тяга штанги в наклоне',
  lat_pulldown: 'Тяга верхнего блока',
  seated_cable_row: 'Горизонтальная тяга',
  face_pull: 'Фейс-пулл',
  bicep_curl: 'Сгибания на бицепс',
  hammer_curl: 'Молотки',
  squat: 'Присед со штангой',
  front_squat: 'Фронтальный присед',
  deadlift: 'Становая тяга',
  rdl: 'Румынская тяга',
  lunge: 'Выпады',
  leg_press: 'Жим ногами',
  leg_curl: 'Сгибания ног',
  calf_raise: 'Подъёмы на носки',
  hip_thrust: 'Ягодичный мост',
  plank: 'Планка',
  cable_crunch: 'Скручивания в блоке',
  hanging_leg_raise: 'Подъём ног в висе',
  russian_twist: 'Русские скручивания',
  ab_wheel: 'Ролик',
  burpee: 'Бёрпи',
  box_jump: 'Запрыгивания на тумбу',
  kettlebell_swing: 'Махи гирей',
  battle_rope: 'Канаты',
  treadmill_run: 'Беговая дорожка',
  bike_sprint: 'Спринты на байке',
  jump_rope: 'Скакалка',
  cat_cow: 'Кошка-корова',
  hip_flexor_stretch: 'Растяжка бедра',
  shoulder_dislocate: 'Мобилити плеч',
  pistol_squat: 'Пистолетик',
  muscle_up: 'Выход силой',
  handstand_pushup: 'Отжимания в наклоне',
  clean_and_press: 'Взятие и жим',
  power_snatch: 'Рывок',
  farmer_carry: 'Прогулка фермера',
  sled_push: 'Сани',
  db_pullover: 'Пуловер',
  skull_crusher: 'Французский жим',
  chest_supported_row: 'Тяга с упором',
  split_squat: 'Болгарские выпады',
  good_morning: 'Гуд морнинг',
  mountain_climber: 'Альпинист',
  side_plank: 'Боковая планка',
};

const RU_WORKOUTS: Record<string, { name: string; description: string }> = {
  push_day: { name: 'Жимовой день', description: 'Грудь, плечи и трицепс.' },
  pull_day: { name: 'Тяговый день', description: 'Спина и бицепс.' },
  leg_day: { name: 'День ног', description: 'Квадрицепс, бицепс бедра, ягодицы.' },
  core_focus: { name: 'Кор', description: 'Пресс и стабилизация.' },
  full_body: { name: 'Всё тело', description: 'Базовые движения на силу.' },
  upper_body: { name: 'Верх тела', description: 'Жимы и тяги.' },
  lower_body: { name: 'Низ тела', description: 'Сила и мощность ног.' },
  hiit: { name: 'Интервалы', description: 'Короткие раунды высокой интенсивности.' },
  cardio: { name: 'Кардио', description: 'Пульс и выносливость.' },
  mobility: { name: 'Мобилити', description: 'Суставы и контроль.' },
  stretching: { name: 'Растяжка', description: 'Длинные удержания.' },
  abs: { name: 'Пресс', description: 'Прямая работа на кор.' },
  glutes: { name: 'Ягодицы', description: 'Задняя цепь.' },
  back_day: { name: 'Спина', description: 'Ширина и толщина.' },
  chest_day: { name: 'Грудь', description: 'Жимовой объём.' },
  arms: { name: 'Руки', description: 'Бицепс и трицепс.' },
  shoulders: { name: 'Плечи', description: 'Дельты со всех сторон.' },
  functional: { name: 'Функционал', description: 'Переноски и мощность.' },
  powerlifting: { name: 'Троеборье', description: 'Присед, жим, тяга.' },
  calisthenics: { name: 'Калистеника', description: 'Вес собственного тела.' },
};

export function fitExerciseName(locale: string, id: string, fallback: string) {
  if (locale !== 'ru') return fallback;
  return RU_EX[id] ?? fallback;
}

export function fitWorkoutName(locale: string, id: string, fallback: string) {
  if (locale !== 'ru') return fallback;
  return RU_WORKOUTS[id]?.name ?? fallback;
}

export function fitWorkoutBlurb(locale: string, id: string, fallback: string) {
  if (locale !== 'ru') return fallback;
  return RU_WORKOUTS[id]?.description ?? fallback;
}

export function fitAchievement(locale: string, id: string, title: string, desc: string) {
  if (locale !== 'ru') return { title, desc };
  return RU_ACH[id] ?? { title, desc };
}

const RU_ACH: Record<string, { title: string; desc: string }> = {
  streak_7: { title: 'Серия 7 дней', desc: 'Неделя дисциплины' },
  streak_30: { title: 'Серия 30 дней', desc: 'Месяц привычки' },
  streak_100: { title: 'Серия 100 дней', desc: 'Сто дней воли' },
  streak_365: { title: 'Серия 365 дней', desc: 'Год Corpus' },
  workouts_10: { title: '10 тренировок', desc: 'Старт положен' },
  workouts_50: { title: '50 тренировок', desc: 'Уже система' },
  workouts_100: { title: '100 тренировок', desc: 'Ветеран' },
  workouts_500: { title: '500 тренировок', desc: 'Элитный объём' },
  sets_1000: { title: '1000 подходов', desc: 'Подход за подходом' },
  sets_10000: { title: '10 000 подходов', desc: 'Промышленный объём' },
  kcal_100k: { title: '100 000 ккал', desc: 'Энергия потрачена' },
  pr_5: { title: '5 рекордов', desc: 'Карта силы' },
  water_30: { title: '30 дней воды', desc: 'Привычка пить' },
  sleep_7: { title: '7 ночей по 8 ч', desc: 'Восстановление' },
  steps_1m: { title: '1 000 000 шагов', desc: 'Пройденный путь' },
  level_5: { title: 'Corpus ур. 5', desc: 'Новый ранг' },
  level_10: { title: 'Corpus ур. 10', desc: 'Мастер' },
  challenge_30: { title: 'Челлендж 30 дней', desc: 'Дойти до конца' },
  custom_5: { title: '5 своих программ', desc: 'Свой план' },
  hiit_20: { title: '20 интервалов', desc: 'Выносливость' },
};
