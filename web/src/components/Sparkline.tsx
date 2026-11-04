import { useId } from 'react';

/** Small area chart for 0–100 values (oldest first). */
export default function Sparkline({
  values,
  className = 'h-10 w-full',
  color = 'rgb(var(--accent))',
}: {
  values: number[];
  className?: string;
  color?: string;
}) {
  const id = useId();
  const w = 100;
  const h = 32;
  const data = values.length > 1 ? values : [values[0] ?? 0, values[0] ?? 0];
  const step = w / (data.length - 1);
  // Auto-scale so low idle loads still show movement; never zoom in past 0–25%.
  const max = Math.min(100, Math.max(25, ...data) * 1.2);
  const y = (v: number) => h - 1 - (Math.min(max, Math.max(0, v)) / max) * (h - 2);
  const points = data.map((v, i) => `${(i * step).toFixed(2)},${y(v).toFixed(2)}`);
  const line = `M${points.join(' L')}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}
