import { useEffect, useId, useRef, useState } from 'react';
import { cn, clamp } from '@/lib/utils';

/** Respects the user's reduced-motion preference for the count-up animation. */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** True when the animation should be skipped entirely rather than played. */
function shouldSkipAnimation(): boolean {
  if (prefersReducedMotion()) return true;
  // requestAnimationFrame does not fire in a backgrounded tab, so a page
  // opened in the background would otherwise sit on 0 until it is focused.
  return typeof document !== 'undefined' && document.visibilityState === 'hidden';
}

export function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(() => (shouldSkipAnimation() ? target : 0));
  const frame = useRef<number>();

  useEffect(() => {
    if (shouldSkipAnimation()) {
      setValue(target);
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - (1 - t) ** 3;
      setValue(target * eased);
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);

    // Safety net: whatever happens to the frame loop (throttling, the tab
    // being hidden mid-animation), the number always lands on its real value.
    const settle = window.setTimeout(() => setValue(target), duration + 400);

    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      window.clearTimeout(settle);
    };
  }, [target, duration]);

  return value;
}

export function ProgressBar({
  value,
  tone = 'accent',
  className,
  trackClassName,
  label,
  animate = true,
}: {
  value: number;
  tone?: 'accent' | 'good' | 'warn' | 'risk' | 'info';
  className?: string;
  trackClassName?: string;
  label?: string;
  animate?: boolean;
}) {
  const colors = {
    accent: 'bg-accent',
    good: 'bg-good',
    warn: 'bg-warn',
    risk: 'bg-risk',
    info: 'bg-info',
  } as const;
  const pct = clamp(value);

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]', trackClassName)}
    >
      <div
        className={cn(
          'h-full rounded-full',
          colors[tone],
          animate && 'transition-[width] duration-700 ease-out',
          className,
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

const RISK_COLOR = {
  healthy: '#3fcf8e',
  moderate: '#7c8cff',
  elevated: '#f0b429',
  high: '#f0616f',
} as const;

export function ScoreRing({
  value,
  max = 100,
  size = 200,
  thickness = 12,
  tone = 'moderate',
  caption,
  children,
}: {
  value: number;
  max?: number;
  size?: number;
  thickness?: number;
  tone?: keyof typeof RISK_COLOR;
  caption?: string;
  children?: React.ReactNode;
}) {
  const animated = useCountUp(value, 1100);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = clamp(animated / max, 0, 1);
  const color = RISK_COLOR[tone];
  // Unique per instance: two rings on one page would otherwise share the
  // first gradient definition in the document.
  const gradientId = useId().replace(/:/g, '');

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={caption ?? `Score ${Math.round(value)} out of ${max}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.55" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 120ms linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

/** Horizontal band gauge used to show where a value sits in a healthy range. */
export function BandGauge({
  value,
  low,
  high,
  label,
}: {
  value: number;
  low: number;
  high: number;
  label?: string;
}) {
  const pos = clamp(value);
  return (
    <div className="w-full">
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="absolute inset-y-0 rounded-full bg-good/25"
          style={{ left: `${low}%`, width: `${high - low}%` }}
        />
        <div
          className="absolute -top-1 h-4 w-[3px] rounded-full bg-ink shadow-[0_0_0_3px_rgba(7,8,11,0.9)]"
          style={{ left: `calc(${pos}% - 1.5px)` }}
          aria-hidden
        />
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-ink-faint">
        <span>0</span>
        <span className="text-good">
          healthy band {low}-{high}
        </span>
        <span>100</span>
      </div>
      {label ? <p className="mt-2 text-[12px] text-ink-muted">{label}</p> : null}
    </div>
  );
}
