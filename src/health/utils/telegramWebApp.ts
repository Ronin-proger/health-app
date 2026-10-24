type TgWebApp = NonNullable<typeof window.Telegram>['WebApp'] & {
  version?: string;
  isVersionAtLeast?: (version: string) => boolean;
  BackButton?: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
};

export function getTelegramWebApp(): TgWebApp | undefined {
  return window.Telegram?.WebApp as TgWebApp | undefined;
}

function telegramVersionAtLeast(version: string): boolean {
  const tg = getTelegramWebApp();
  if (!tg) return false;
  if (typeof tg.isVersionAtLeast === 'function') return tg.isVersionAtLeast(version);
  const current = parseFloat(String(tg.version ?? '6.0'));
  const needed = parseFloat(version);
  return !Number.isNaN(current) && !Number.isNaN(needed) && current >= needed;
}

/** BackButton API requires Telegram WebApp ≥ 6.1 (6.0 logs errors on hide/show). */
export function telegramBackButtonSupported(): boolean {
  const tg = getTelegramWebApp();
  if (!tg?.BackButton) return false;
  return telegramVersionAtLeast('6.1');
}

/** setHeaderColor / setBackgroundColor exist since WebApp 6.1. 6.0 logs an error and does not throw. */
export function telegramThemeColorsSupported(): boolean {
  return telegramVersionAtLeast('6.1');
}

/** Light haptic feedback inside Telegram (no-op elsewhere). */
export function haptic(kind: 'light' | 'medium' | 'success' = 'light') {
  const hf = (getTelegramWebApp() as unknown as {
    HapticFeedback?: {
      impactOccurred?: (s: string) => void;
      notificationOccurred?: (s: string) => void;
    };
  })?.HapticFeedback;
  try {
    if (kind === 'success') hf?.notificationOccurred?.('success');
    else hf?.impactOccurred?.(kind);
  } catch {
    /* unsupported */
  }
}
