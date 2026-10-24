import { useId } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export const ACCENT = '#C6F531';
export const CHART_COLORS = {
  push: '#C6F531',
  pull: '#6FA8FF',
  legs: '#FF9F43',
  core: '#B58CFF',
} as const;

const axisTick = { fill: 'rgba(255,255,255,0.45)', fontSize: 10 };

type TipProps = {
  active?: boolean;
  payload?: { value?: number | string; name?: string; color?: string; dataKey?: string }[];
  label?: string | number;
  fmt?: (v: number, key: string) => string;
  names?: Record<string, string>;
};

function Tip({ active, payload, label, fmt, names }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="fx-tip">
      <b>{label}</b>
      {payload.map((p) => (
        <span key={String(p.dataKey)}>
          <i style={{ background: p.color }} />
          {names?.[String(p.dataKey)] ? `${names[String(p.dataKey)]}: ` : ''}
          {fmt ? fmt(Number(p.value ?? 0), String(p.dataKey)) : p.value}
        </span>
      ))}
    </div>
  );
}

export function FxArea({
  data,
  x,
  y,
  height = 170,
  color = ACCENT,
  fmt,
  avg,
  dots = true,
  yDomain,
  hideY = true,
  xInterval = 'preserveStartEnd',
}: {
  data: Record<string, string | number>[];
  x: string;
  y: string;
  height?: number;
  color?: string;
  fmt?: (v: number) => string;
  avg?: number;
  dots?: boolean;
  yDomain?: [number | string, number | string];
  hideY?: boolean;
  xInterval?: number | 'preserveStartEnd' | 'preserveStart' | 'preserveEnd';
}) {
  const gid = `g${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <div className="fx-chart" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 14, right: 10, left: hideY ? -26 : -8, bottom: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.5} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey={x} tick={axisTick} axisLine={false} tickLine={false} interval={xInterval} tickMargin={6} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} hide={hideY} domain={yDomain ?? [0, 'auto']} width={34} />
          <Tooltip
            cursor={{ stroke: 'rgba(255,255,255,0.25)', strokeDasharray: '3 3' }}
            content={<Tip fmt={fmt ? (v) => fmt(v) : undefined} />}
          />
          {avg !== undefined && (
            <ReferenceLine y={avg} stroke="rgba(255,255,255,0.35)" strokeDasharray="4 4" />
          )}
          <Area
            type="monotone"
            dataKey={y}
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gid})`}
            dot={dots ? { r: 3.2, fill: color, stroke: '#0b0d12', strokeWidth: 2 } : false}
            activeDot={{ r: 6, fill: '#fff', stroke: color, strokeWidth: 3 }}
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FxStackBars({
  data,
  keys,
  names,
  height = 190,
  fmt,
}: {
  data: Record<string, string | number>[];
  keys: ('push' | 'pull' | 'legs' | 'core')[];
  names: Record<string, string>;
  height?: number;
  fmt?: (v: number) => string;
}) {
  return (
    <div className="fx-chart" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 6, left: -26, bottom: 0 }} barCategoryGap="22%">
          <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval="preserveStartEnd" tickMargin={6} />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            content={<Tip names={names} fmt={fmt ? (v) => fmt(v) : undefined} />}
          />
          {keys.map((k, i) => (
            <Bar
              key={k}
              dataKey={k}
              stackId="v"
              fill={CHART_COLORS[k]}
              radius={i === keys.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
              animationDuration={800}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FxDonut({
  slices,
  center,
  sub,
}: {
  slices: { key: string; value: number; color: string }[];
  center: string;
  sub: string;
}) {
  return (
    <div className="fx-donut">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={slices}
            dataKey="value"
            innerRadius="68%"
            outerRadius="94%"
            paddingAngle={3}
            cornerRadius={6}
            stroke="none"
            startAngle={90}
            endAngle={-270}
            animationDuration={900}
          >
            {slices.map((s) => (
              <Cell key={s.key} fill={s.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="fx-donut-center">
        <strong>{center}</strong>
        <span>{sub}</span>
      </div>
    </div>
  );
}

