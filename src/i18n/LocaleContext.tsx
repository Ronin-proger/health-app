import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { translate } from './translate';
import { LOCALE_STORAGE_KEY, type Locale } from './types';

type TFn = (key: string, vars?: Record<string, string | number>) => string;

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: TFn;
};

const LocaleCtx = createContext<Ctx | null>(null);

function readStoredLocale(): Locale {
  try {
    const v = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (v === 'en' || v === 'ru') return v;
  } catch {
    // storage unavailable (private mode or quota): keep in-memory value
  }
  return 'ru';
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale());

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, l);
    } catch {
      // storage unavailable (private mode or quota): keep in-memory value
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback<TFn>(
    (key, vars) => translate(locale, key, vars),
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleCtx.Provider value={value}>{children}</LocaleCtx.Provider>;
}

export function useI18n() {
  const c = useContext(LocaleCtx);
  if (!c) throw new Error('useI18n outside LocaleProvider');
  return c;
}

/** Domain display name from locale (API may return another language). */
export function useDomainLabel(domainId: string, fallback?: string) {
  const { t } = useI18n();
  const key = `domains.${domainId}.name`;
  const localized = t(key);
  return localized === key ? (fallback ?? domainId) : localized;
}
