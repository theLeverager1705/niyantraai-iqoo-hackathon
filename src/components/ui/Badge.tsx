import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type Tone = 'neutral' | 'accent' | 'good' | 'warn' | 'risk' | 'info';

const TONES: Record<Tone, string> = {
  neutral: 'bg-white/[0.05] text-ink-muted border-hairline',
  accent: 'bg-accent-soft text-accent border-accent-line',
  good: 'bg-good-soft text-good border-[rgba(63,207,142,0.3)]',
  warn: 'bg-warn-soft text-warn border-[rgba(240,180,41,0.3)]',
  risk: 'bg-risk-soft text-risk border-[rgba(240,97,111,0.3)]',
  info: 'bg-info-soft text-info border-[rgba(76,201,240,0.3)]',
};

export function Badge({
  tone = 'neutral',
  children,
  icon,
  className,
  title,
}: {
  tone?: Tone;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium leading-none',
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** Small dot + label, used in chart legends and list rows. */
export function Dot({ color, label }: { color: string; label: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[12px] text-ink-muted">
      <span
        aria-hidden
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

export function DeltaBadge({
  delta,
  higherIsBetter = true,
  suffix = 'pts',
}: {
  delta: number;
  higherIsBetter?: boolean;
  suffix?: string;
}) {
  if (Math.abs(delta) < 0.05) {
    return (
      <Badge tone="neutral" className="tabular-nums">
        No change
      </Badge>
    );
  }
  const improving = higherIsBetter ? delta > 0 : delta < 0;
  const sign = delta > 0 ? '+' : '';
  return (
    <Badge tone={improving ? 'good' : 'warn'} className="tabular-nums">
      {sign}
      {Math.round(delta * 10) / 10} {suffix}
    </Badge>
  );
}
