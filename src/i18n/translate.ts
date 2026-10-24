import type { Locale } from './types';
import { en } from './locales/en';
import { gameEn } from './locales/game.en';
import { gameRu } from './locales/game.ru';
import { ru } from './locales/ru';

const catalogs: Record<Locale, Record<string, unknown>> = { ru: { ...ru, ...gameRu }, en: { ...en, ...gameEn } };

export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>
): string {
  const parts = key.split('.');
  let cur: unknown = catalogs[locale];
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as object)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      cur = undefined;
      break;
    }
  }
  let text = typeof cur === 'string' ? cur : key;
  if (vars) {
    text = text.replace(/\{\{(\w+)\}\}/g, (_, k: string) =>
      vars[k] !== undefined ? String(vars[k]) : `{{${k}}}`
    );
  }
  return text;
}
