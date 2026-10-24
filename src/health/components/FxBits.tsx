import { ReactNode, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/** Animated circular progress. `pct` 0-100. */
export function FxRing({
  pct,
  size = 56,
  stroke = 6,
  children,
  className,
  gradient = true,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
  className?: string;
  gradient?: boolean;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const id = useRef(`r${Math.random().toString(36).slice(2, 8)}`).current;
  return (
    <div className={`fx-ring ${className ?? ''}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        {gradient && (
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#e6ff6b" />
              <stop offset="1" stopColor="#8fd10a" />
            </linearGradient>
          </defs>
        )}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={gradient ? `url(#${id})` : '#C6F531'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - clamped / 100) }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {children && <div className="fx-ring-in">{children}</div>}
    </div>
  );
}

/** Number that counts smoothly to its target. */
export function CountUp({ value, duration = 700, format }: { value: number; duration?: number; format?: (n: number) => string }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current;
    const diff = value - start;
    if (diff === 0) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const v = start + diff * (1 - Math.pow(1 - p, 3));
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      from.current = value;
    };
  }, [value, duration]);
  const n = Math.round(shown);
  return <>{format ? format(n) : n.toLocaleString('ru')}</>;
}

export function Section({ title, action, children, className }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`fx-section ${className ?? ''}`}>
      {(title || action) && (
        <div className="fx-section-head">
          {title && <h2 className="fx-h2">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Staggered entrance wrapper for screen children. */
export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.02 } },
};
export const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
};
