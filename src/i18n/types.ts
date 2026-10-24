export type Locale = 'ru' | 'en';

export const LOCALE_STORAGE_KEY = 'aetheris_locale';

export const LOCALES: { id: Locale; label: string }[] = [
  { id: 'ru', label: 'Русский' },
  { id: 'en', label: 'English' },
];
