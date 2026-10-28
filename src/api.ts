/** Пусто = только локальные данные. Адрес API задаётся через VITE_API_URL. */
const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

function getInitData(): string {
  return window.Telegram?.WebApp?.initData || '';
}

function devHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (import.meta.env.DEV && !getInitData()) h['X-Dev-User-Id'] = '123456789';
  h['X-Tz-Offset'] = String(-new Date().getTimezoneOffset());
  return h;
}

async function apiFetch(path: string, options: RequestInit = {}) {
  if (!API_URL) throw new Error('offline');
  const headers: Record<string, string> = {
    ...devHeaders(),
    ...(options.headers as Record<string, string>),
  };
  const initData = getInitData();
  if (initData) headers['X-Telegram-Init-Data'] = initData;
  if (/ngrok/i.test(API_URL) || /ngrok/i.test(location.hostname)) {
    headers['ngrok-skip-browser-warning'] = '1';
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    signal: options.signal ?? AbortSignal.timeout(4000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json();
}

export interface HealthDashboard {
  date: string;
  steps: number;
  water_ml: number;
  workout_minutes: number;
  meals_logged: number;
  sleep_hours: number;
  discipline_score: number;
  goals: {
    steps: number;
    water_ml: number;
    workout_minutes: number;
    meals_logged: number;
    sleep_hours: number;
  };
  progress: {
    steps: number;
    water: number;
    workout: number;
    nutrition: number;
    sleep: number;
  };
  patron: {
    name: string;
    greek: string;
    domain: string;
    workoutPatron?: string;
    motto: string;
  };
  corpus_streak?: number;
  daily_kcal_target?: number;
  today_workout?: {
    id: string;
    title: string;
    subtitle: string;
    patron: { name: string; greek: string; emoji: string };
    durationMin: number;
    intensity: string;
    caloriesEst: number;
    tags: string[];
    exercises: { name: string; sets: string; muscle: string }[];
  };
  meals_plan?: {
    slot: string;
    label: string;
    time: string;
    kcal: number;
    sample: string;
    logged: boolean;
  }[];
  habits?: {
    id: string;
    label: string;
    icon: string;
    value: number;
    goal: number;
    pctKey: string;
    unit?: string;
  }[];
  week?: { date: string; score: number; steps: number; dayLabel?: string }[];
}

export const api = {
  getHealth: (): Promise<HealthDashboard> => apiFetch('/health/today'),
  logHealth: (type: string, value?: number): Promise<{ health: HealthDashboard; xpCorpus: number }> =>
    apiFetch('/health/log', { method: 'POST', body: JSON.stringify({ type, value }) }),
  syncFitness: (state: unknown) =>
    apiFetch('/health/fitness/sync', { method: 'POST', body: JSON.stringify({ state }) }),
  getFitnessSync: () => apiFetch('/health/fitness/sync'),
};

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe?: { user?: { id: number; first_name?: string; last_name?: string }; start_param?: string };
        ready: () => void;
        expand: () => void;
        themeParams: Record<string, string>;
        HapticFeedback?: {
          impactOccurred: (s: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (s: 'error' | 'success' | 'warning') => void;
        };
      };
    };
  }
}
