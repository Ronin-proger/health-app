import { ChangeEvent, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Camera,
  Check,
  Download,
  Flame,
  Globe,
  Lock,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  Ruler,
  Scale,
  Send,
  StickyNote,
  Target,
  Trash2,
  Trophy,
} from 'lucide-react';
import { useFitness } from '../FitnessContext';
import { exportProgressCsv } from '../csvExport';
import { ensureNotificationPermission } from '../notifications';
import { fitAchievement } from '../catalog/ruLabels';
import { LOCALES, useI18n, type Locale } from '../../i18n';
import { useCopy } from '../copy';
import { AchIcon } from '../components/AchIcon';
import { FxSheet } from '../components/FxSheet';
import { FxArea } from '../components/FxCharts';
import { CountUp, FxRing, Section, rise, stagger } from '../components/FxBits';
import { levelProgress } from '../gamification';
import { prByExercise } from '../achievements';
import { bmi } from '../bodyProfileDefaults';
import { localDayKey } from '../utils/calendar';
import { downscaleImage } from '../utils/image';
import { formatDay, round1, useUnits } from '../utils/units';
import { getTelegramWebApp } from '../utils/telegramWebApp';
import { FitTheme, Rarity, UnitSystem } from '../types';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
const RARITIES: Rarity[] = ['common', 'rare', 'epic', 'legendary'];
const THEMES: FitTheme[] = ['midnight', 'amoled', 'graphite'];

type TgUser = { id?: number; first_name?: string; last_name?: string; username?: string; photo_url?: string };

function tgUser(): TgUser | undefined {
  return (getTelegramWebApp() as unknown as { initDataUnsafe?: { user?: TgUser } } | undefined)?.initDataUnsafe?.user;
}

export function HealthProfileScreen({ displayName }: { displayName: string }) {
  const { locale, setLocale, t } = useI18n();
  const c = useCopy();
  const u = useUnits();
  const { fitness, health, achievements, syncing, corpusStreak, setNotifications, refreshHealth, persist } = useFitness();

  const [sheet, setSheet] = useState<null | 'weight' | 'body'>(null);
  const [wInput, setWInput] = useState(0);
  const [note, setNote] = useState('');
  const [rarity, setRarity] = useState<Rarity | 'all'>('all');
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoBusy, setPhotoBusy] = useState(false);

  const user = tgUser();
  const lvl = levelProgress(fitness.corpusXp);
  const profile = fitness.bodyProfile!;
  const history = fitness.weightHistory ?? [];
  const settings = fitness.settings ?? { units: 'metric' as UnitSystem, theme: 'midnight' as FitTheme };
  const n = fitness.notifications;
  const prCount = useMemo(() => prByExercise(fitness).length, [fitness]);
  const workoutCount = fitness.workouts.filter((w) => w.status === 'completed').length;

  // ── goal ──
  const startKg = history[0]?.kg ?? profile.weightKg;
  const nowKg = history[history.length - 1]?.kg ?? profile.weightKg;
  const targetKg = profile.targetWeightKg ?? nowKg;
  const span = startKg - targetKg;
  const goalPct = span === 0 ? 100 : Math.max(0, Math.min(100, Math.round(((startKg - nowKg) / span) * 100)));
  const leftKg = Math.abs(nowKg - targetKg);
  const reached = goalPct >= 100;
  const chartData = history.map((h) => ({ label: formatDay(h.date, locale), kg: u.toDisp(h.kg) }));
  const histRows = [...history].reverse().slice(0, 5);

  const openWeight = () => {
    setWInput(u.toDisp(nowKg));
    setSheet('weight');
  };
  const saveWeight = () => {
    const kg = Math.round(u.fromDisp(wInput) * 10) / 10;
    if (!kg || kg < 20 || kg > 400) return;
    const date = localDayKey();
    const next = [...history.filter((h) => h.date !== date), { date, kg }].sort((a, b) => a.date.localeCompare(b.date));
    persist({ ...fitness, weightHistory: next, bodyProfile: { ...profile, weightKg: kg } });
    setSheet(null);
  };

  // ── body sheet ──
  const [body, setBody] = useState({ height: 0, age: 0, fat: 0, target: 0 });
  const openBody = () => {
    setBody({
      height: u.imperial ? Math.round(profile.heightCm / 2.54) : profile.heightCm,
      age: profile.age,
      fat: profile.bodyFatPct ?? 0,
      target: u.toDisp(targetKg),
    });
    setSheet('body');
  };
  const saveBody = () => {
    persist({
      ...fitness,
      bodyProfile: {
        ...profile,
        heightCm: Math.round(u.imperial ? body.height * 2.54 : body.height),
        age: body.age,
        bodyFatPct: body.fat || undefined,
        targetWeightKg: Math.round(u.fromDisp(body.target) * 10) / 10,
      },
    });
    setSheet(null);
  };

  // ── notes & photos ──
  const addNote = () => {
    const text = note.trim();
    if (!text) return;
    persist({ ...fitness, notes: [{ id: crypto.randomUUID?.() ?? String(Date.now()), at: new Date().toISOString(), text }, ...(fitness.notes ?? [])].slice(0, 50) });
    setNote('');
  };
  const removeNote = (id: string) => persist({ ...fitness, notes: (fitness.notes ?? []).filter((x) => x.id !== id) });

  const photos = fitness.progressPhotos ?? [];
  const onPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoBusy(true);
    try {
      const src = await downscaleImage(file);
      persist({
        ...fitness,
        progressPhotos: [...photos, { id: crypto.randomUUID?.() ?? String(Date.now()), at: new Date().toISOString(), src }].slice(-6),
      });
    } catch {
      /* unreadable file */
    } finally {
      setPhotoBusy(false);
    }
  };
  const removePhoto = (id: string) => persist({ ...fitness, progressPhotos: photos.filter((p) => p.id !== id) });
  const slotLabels = [c.profile.before, c.profile.nowPhoto, c.profile.next];

  // ── settings ──
  const setUnits = (units: UnitSystem) => persist({ ...fitness, settings: { ...settings, units } });
  const setTheme = (theme: FitTheme) => persist({ ...fitness, settings: { ...settings, theme } });

  const toggleNotify = async () => {
    if (!n.enabled) {
      const ok = await ensureNotificationPermission();
      if (!ok) return;
    }
    setNotifications({ ...n, enabled: !n.enabled });
  };
  const toggleDay = (d: number) => {
    const days = n.daysOfWeek.includes(d) ? n.daysOfWeek.filter((x) => x !== d) : [...n.daysOfWeek, d].sort();
    setNotifications({ ...n, daysOfWeek: days });
  };

  const ach = useMemo(
    () =>
      achievements
        .map((a) => ({ ...a, ...fitAchievement(locale, a.id, a.title, a.desc) }))
        .filter((a) => rarity === 'all' || a.rarity === rarity)
        .sort((a, b) => Number(b.unlocked) - Number(a.unlocked) || (b.unlockedAt ?? '').localeCompare(a.unlockedAt ?? '') || b.progress / b.target - a.progress / a.target),
    [achievements, locale, rarity]
  );
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const initials = (displayName || 'A').trim().slice(0, 1).toUpperCase();
  const bmiVal = bmi(profile);

  const stepNum = (v: number, d: number, set: (n: number) => void, min = 0, max = 999) => set(Math.max(min, Math.min(max, round1(v + d))));

  return (
    <motion.div className="fit-scroll fx-screen" variants={stagger} initial="hidden" animate="show">
      {/* identity */}
      <motion.section variants={rise} className="fx-card fx-identity">
        <div className="fx-avatar">
          <FxRing pct={lvl.pct} size={92} stroke={5} />
          <span className="fx-avatar-in">{user?.photo_url ? <img src={user.photo_url} alt="" /> : initials}</span>
          <em>{lvl.level}</em>
        </div>
        <div className="fx-identity-main">
          <h2 className="fx-grad-text">{displayName}</h2>
          <p>{c.profile.level(lvl.level)}</p>
          <div className="fx-bar">
            <span style={{ width: `${lvl.pct}%` }} />
          </div>
          <small>{c.profile.xpLine(lvl.into, lvl.span)}</small>
        </div>
        <div className="fx-identity-stats">
          <div>
            <Flame size={15} />
            <b>
              <CountUp value={Math.max(corpusStreak, 0)} />
            </b>
            <span>{c.profile.streak}</span>
          </div>
          <div>
            <Trophy size={15} />
            <b>
              <CountUp value={workoutCount} />
            </b>
            <span>{c.profile.workouts}</span>
          </div>
          <div>
            <Target size={15} />
            <b>
              <CountUp value={prCount} />
            </b>
            <span>{c.profile.records}</span>
          </div>
        </div>
      </motion.section>

      {/* goal */}
      <motion.section variants={rise} className="fx-card fx-goal">
        <div className="fx-goal-top">
          <FxRing pct={goalPct} size={84} stroke={8}>
            <b>{goalPct}%</b>
          </FxRing>
          <div className="fx-goal-main">
            <span className="fx-kicker">{c.profile.goal}</span>
            <strong>{reached ? c.profile.goalReached : c.profile.goalLeft(`${u.toDisp(leftKg)} ${u.unit}`)}</strong>
            <small>
              {c.profile.from} {u.fmt(startKg)} → {c.profile.target} {u.fmt(targetKg)}
            </small>
          </div>
        </div>
        <div className="fx-goal-nums">
          <div>
            <small>{c.profile.from}</small>
            <b>{u.num(startKg)}</b>
          </div>
          <div className="now">
            <small>{c.profile.now}</small>
            <b>{u.num(nowKg)}</b>
          </div>
          <div>
            <small>{c.profile.target}</small>
            <b>{u.num(targetKg)}</b>
          </div>
        </div>
        {chartData.length >= 2 && (
          <FxArea data={chartData} x="label" y="kg" height={150} fmt={(v) => `${v} ${u.unit}`} yDomain={['dataMin - 1', 'dataMax + 1']} xInterval="preserveStartEnd" />
        )}
        <button type="button" className="fx-btn fx-btn--primary fx-btn--block" onClick={openWeight}>
          <Scale size={17} /> {c.profile.logWeight}
        </button>
      </motion.section>

      {/* history */}
      <Section title={c.profile.weightHistory}>
        <ul className="fx-hist fx-hist--card">
          {histRows.map((h, i) => {
            const prev = histRows[i + 1];
            const delta = prev ? round1(u.toDisp(h.kg) - u.toDisp(prev.kg)) : 0;
            return (
              <li key={h.date}>
                <span>{formatDay(h.date, locale, { day: 'numeric', month: 'long' })}</span>
                <b>{u.fmt(h.kg)}</b>
                {prev && <em className={delta < 0 ? 'down' : delta > 0 ? 'up' : ''}>{delta > 0 ? `+${delta}` : delta}</em>}
              </li>
            );
          })}
        </ul>
      </Section>

      {/* body */}
      <Section
        title={c.profile.params}
        action={
          <button type="button" className="fx-link" onClick={openBody}>
            <Pencil size={13} /> {c.profile.edit}
          </button>
        }
      >
        <div className="fx-stat-grid fx-stat-grid--3">
          <div className="fx-stat">
            <Ruler size={16} />
            <strong>{u.height(profile.heightCm)}</strong>
            <span>{c.profile.height}</span>
          </div>
          <div className="fx-stat">
            <Scale size={16} />
            <strong>{u.fmt(nowKg)}</strong>
            <span>{c.profile.weight}</span>
          </div>
          <div className="fx-stat">
            <Target size={16} />
            <strong>{profile.age}</strong>
            <span>{c.profile.age}</span>
          </div>
          <div className="fx-stat">
            <Flame size={16} />
            <strong>{profile.bodyFatPct ?? '—'}%</strong>
            <span>{c.profile.fat}</span>
          </div>
          <div className="fx-stat">
            <Trophy size={16} />
            <strong>{bmiVal}</strong>
            <span>{c.profile.bmi}</span>
          </div>
          <div className="fx-stat">
            <Target size={16} />
            <strong>{u.fmt(targetKg)}</strong>
            <span>{c.profile.targetW}</span>
          </div>
        </div>
      </Section>

      {/* photos */}
      <Section title={c.profile.photos}>
        <div className="fx-photos">
          {Array.from({ length: Math.max(3, photos.length + (photos.length >= 6 ? 0 : 1)) }, (_, i) => {
            const p = photos[i];
            return p ? (
              <div key={p.id} className="fx-photo">
                <img src={p.src} alt="" />
                <span>{formatDay(p.at, locale)}</span>
                <button type="button" className="fx-photo-del" onClick={() => removePhoto(p.id)} aria-label={c.common.delete}>
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <button key={`slot${i}`} type="button" className="fx-photo fx-photo--slot" onClick={() => fileRef.current?.click()} disabled={photoBusy}>
                <Camera size={22} />
                <b>{slotLabels[i] ?? c.profile.addPhoto}</b>
                <small>{c.profile.addPhoto}</small>
              </button>
            );
          })}
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPhoto} />
        <p className="fx-hint">{c.profile.photoLocal}</p>
      </Section>

      {/* notes */}
      <Section title={c.profile.notes}>
        <div className="fx-card fx-card--flat">
          <textarea className="fx-textarea" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder={c.profile.notesPh} />
          <button type="button" className="fx-btn fx-btn--primary fx-btn--block" onClick={addNote} disabled={!note.trim()}>
            <StickyNote size={16} /> {c.profile.addNote}
          </button>
        </div>
        <ul className="fx-notes">
          {(fitness.notes ?? []).slice(0, 6).map((nt) => (
            <li key={nt.id} className="fx-card fx-card--flat">
              <div>
                <small>{formatDay(nt.at, locale, { day: 'numeric', month: 'long' })}</small>
                <p>{nt.text}</p>
              </div>
              <button type="button" className="fx-icon-btn fx-icon-btn--sm" onClick={() => removeNote(nt.id)} aria-label={c.common.delete}>
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      </Section>

      {/* settings */}
      <Section title={c.profile.settings}>
        <div className="fx-card fx-settings">
          <div className="fx-set-block">
            <p className="fx-label">{c.profile.units}</p>
            <div className="fx-seg fx-seg--wide">
              {(['metric', 'imperial'] as UnitSystem[]).map((x) => (
                <button key={x} type="button" className={settings.units === x ? 'on' : ''} onClick={() => setUnits(x)}>
                  {x === 'metric' ? c.profile.metric : c.profile.imperial}
                  <small>{x === 'metric' ? c.profile.metricSub : c.profile.imperialSub}</small>
                  {settings.units === x && <motion.i layoutId="units-seg" className="fx-seg-pill" />}
                </button>
              ))}
            </div>
          </div>

          <div className="fx-set-block">
            <p className="fx-label">{c.profile.theme}</p>
            <div className="fx-themes">
              {THEMES.map((th) => (
                <button key={th} type="button" className={`fx-theme fx-theme--${th}${settings.theme === th ? ' on' : ''}`} onClick={() => setTheme(th)} aria-pressed={settings.theme === th}>
                  <i>{settings.theme === th && <Check size={14} strokeWidth={3} />}</i>
                  <span>{c.profile[th]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="fx-set-block">
            <p className="fx-label">
              <Globe size={13} /> {t('settings.language')}
            </p>
            <div className="fx-seg fx-seg--wide">
              {LOCALES.map((l) => (
                <button key={l.id} type="button" className={locale === l.id ? 'on' : ''} onClick={() => setLocale(l.id as Locale)}>
                  {l.id.toUpperCase()}
                  {locale === l.id && <motion.i layoutId="lang-seg" className="fx-seg-pill" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="fx-card fx-tg">
          <span className="fx-tg-ico">
            <Send size={20} />
          </span>
          <div>
            <b>{user?.username ? `@${user.username}` : user?.first_name || c.profile.tgNone}</b>
            <small>{user ? c.profile.tgSub : c.profile.tgNone}</small>
          </div>
          <span className={`fx-chip ${user ? 'fx-chip--ok' : ''}`}>{user ? c.profile.tgLinked : c.profile.telegram}</span>
        </div>

        <div className="fx-card fx-notify">
          <div className="fx-notify-top">
            <span className="fx-notify-ico">
              <Bell size={18} />
            </span>
            <div>
              <b>{c.profile.notify}</b>
              <small>{c.profile.notifyOn}</small>
            </div>
            <button type="button" className={`fx-switch${n.enabled ? ' on' : ''}`} onClick={toggleNotify} role="switch" aria-checked={n.enabled} aria-label={c.profile.notifyOn}>
              <i />
            </button>
          </div>
          {n.enabled && (
            <>
              <div className="fx-days">
                {DAY_KEYS.map((key, d) => (
                  <button key={key} type="button" className={n.daysOfWeek.includes(d) ? 'on' : ''} onClick={() => toggleDay(d)}>
                    {t(`days.${key}`)}
                  </button>
                ))}
              </div>
              <div className="fx-time">
                <label>
                  {c.profile.hour}
                  <input type="number" min={0} max={23} value={n.hour} onChange={(e) => setNotifications({ ...n, hour: Math.max(0, Math.min(23, Number(e.target.value))) })} />
                </label>
                <label>
                  {c.profile.minute}
                  <input type="number" min={0} max={59} value={n.minute} onChange={(e) => setNotifications({ ...n, minute: Math.max(0, Math.min(59, Number(e.target.value))) })} />
                </label>
              </div>
            </>
          )}
        </div>
      </Section>

      {/* achievements */}
      <Section
        title={c.profile.achievements}
        action={<span className="fx-chip">{c.profile.unlocked(unlockedCount, achievements.length)}</span>}
      >
        <div className="fx-pills fx-pills--tight">
          <button type="button" className={`fx-pill fx-pill--sm${rarity === 'all' ? ' on' : ''}`} onClick={() => setRarity('all')}>
            {c.common.all}
          </button>
          {RARITIES.map((r) => (
            <button key={r} type="button" className={`fx-pill fx-pill--sm fx-pill--${r}${rarity === r ? ' on' : ''}`} onClick={() => setRarity(r)}>
              {c.rarity[r]}
            </button>
          ))}
        </div>
        <ul className="fx-ach-grid">
          {ach.map((a, i) => {
            const pct = Math.round((a.progress / a.target) * 100);
            return (
              <motion.li
                key={a.id}
                className={`fx-card fx-ach fx-rar--${a.rarity}${a.unlocked ? ' is-on' : ''}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(0.4, i * 0.03) }}
              >
                <span className="fx-medal">{a.unlocked ? <AchIcon name={a.icon} size={22} /> : <Lock size={18} />}</span>
                <b>{a.title}</b>
                <small>{a.desc}</small>
                <div className="fx-ach-foot">
                  <span className="fx-rar-tag">{c.rarity[a.rarity]}</span>
                  <span className="fx-xp-badge">+{a.xp} XP</span>
                </div>
                {a.unlocked ? (
                  <em>{c.profile.opened(formatDay(a.unlockedAt ?? new Date().toISOString(), locale, { day: 'numeric', month: 'short', year: 'numeric' }))}</em>
                ) : (
                  <>
                    <div className="fx-bar fx-bar--thin">
                      <span style={{ width: `${pct}%` }} />
                    </div>
                    <em>
                      {a.progress.toLocaleString(locale)} / {a.target.toLocaleString(locale)}
                    </em>
                  </>
                )}
              </motion.li>
            );
          })}
        </ul>
      </Section>

      <motion.div variants={rise} className="fx-export">
        <button type="button" className="fx-btn fx-btn--ghost fx-btn--block" onClick={() => refreshHealth()}>
          <RefreshCw size={16} className={syncing ? 'fx-spin' : ''} /> {syncing ? c.profile.syncing : c.profile.syncNow}
        </button>
        <button type="button" className="fx-btn fx-btn--ghost fx-btn--block" onClick={() => void import('../pdfExport').then((m) => m.exportProgressPdf({ fitness, health, displayName }))}>
          <Download size={16} /> PDF
        </button>
        <button type="button" className="fx-btn fx-btn--ghost fx-btn--block" onClick={() => exportProgressCsv(fitness)}>
          <Download size={16} /> CSV
        </button>
      </motion.div>

      {/* sheets */}
      <FxSheet open={sheet === 'weight'} onClose={() => setSheet(null)} kicker={c.profile.goal} title={c.profile.logWeight}>
        <div className="fx-stepper fx-stepper--lg">
          <button type="button" onClick={() => stepNum(wInput, -0.1, setWInput, 20)} aria-label="-0.1">
            <Minus size={22} />
          </button>
          <div>
            <input
              inputMode="decimal"
              value={wInput}
              onChange={(e) => {
                const v = Number(e.target.value.replace(',', '.'));
                if (!Number.isNaN(v)) setWInput(Math.min(999, v));
              }}
              aria-label={c.profile.weightPh}
            />
            <small>{u.unit}</small>
          </div>
          <button type="button" onClick={() => stepNum(wInput, 0.1, setWInput, 20)} aria-label="+0.1">
            <Plus size={22} />
          </button>
        </div>
        <div className="fx-quick">
          {[-1, -0.5, 0.5, 1].map((d) => (
            <button key={d} type="button" onClick={() => stepNum(wInput, d, setWInput, 20)}>
              {d > 0 ? `+${d}` : d}
            </button>
          ))}
        </div>
        <button type="button" className="fx-btn fx-btn--primary fx-btn--lg fx-btn--block fx-btn--glow" onClick={saveWeight}>
          <Check size={18} /> {c.common.save}
        </button>
      </FxSheet>

      <FxSheet open={sheet === 'body'} onClose={() => setSheet(null)} kicker={c.profile.params} title={c.profile.edit}>
        <div className="fx-form">
          {(
            [
              ['height', c.profile.height, u.imperial ? 'in' : 'cm'],
              ['age', c.profile.age, ''],
              ['fat', c.profile.fat, '%'],
              ['target', c.profile.targetW, u.unit],
            ] as const
          ).map(([key, label, suffix]) => (
            <label key={key} className="fx-field">
              <span>{label}</span>
              <div>
                <input
                  type="number"
                  inputMode="decimal"
                  value={body[key]}
                  onChange={(e) => setBody((b) => ({ ...b, [key]: Number(e.target.value) }))}
                />
                {suffix && <em>{suffix}</em>}
              </div>
            </label>
          ))}
        </div>
        <button type="button" className="fx-btn fx-btn--primary fx-btn--lg fx-btn--block fx-btn--glow" onClick={saveBody}>
          <Check size={18} /> {c.common.save}
        </button>
      </FxSheet>
    </motion.div>
  );
}
