import { NotificationPrefs } from './types';

let tickTimer: ReturnType<typeof setInterval> | null = null;
let lastFiredKey = '';

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const r = await Notification.requestPermission();
  return r === 'granted';
}

export function scheduleWorkoutReminder(prefs: NotificationPrefs, onFire?: () => void) {
  if (tickTimer) clearInterval(tickTimer);
  if (!prefs.enabled) return;

  tickTimer = setInterval(() => {
    const now = new Date();
    const dow = now.getDay();
    if (!prefs.daysOfWeek.includes(dow)) return;
    const key = `${now.toISOString().slice(0, 10)}-${prefs.hour}-${prefs.minute}`;
    if (
      now.getHours() === prefs.hour &&
      now.getMinutes() === prefs.minute &&
      lastFiredKey !== key
    ) {
      lastFiredKey = key;
      if (Notification.permission === 'granted') {
        new Notification('Corpus · Workout', {
          body: 'Time to train. Log your sets in AETHERIS.',
          tag: 'corpus-workout',
        });
      }
      onFire?.();
    }
  }, 20_000);
}

export function stopWorkoutReminder() {
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = null;
}

export function playRestComplete() {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 880;
    g.gain.value = 0.08;
    o.start();
    setTimeout(() => o.stop(), 120);
  } catch {
    /* ignore */
  }
  if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
}
