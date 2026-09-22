import type { ReactNode } from 'react';
import { CHART_COLORS } from '@/data/taxonomy';

export const axisProps = {
  stroke: CHART_COLORS.axis,
  tickLine: false,
  axisLine: false,
  tick: { fill: CHART_COLORS.axis, fontSize: 11 },
} as const;

export const gridProps = {
  stroke: CHART_COLORS.grid,
  strokeDasharray: '0',
  vertical: false,
} as const;

interface TooltipEntry {
  name?: string | number;
  value?: string | number;
  color?: string;
  dataKey?: string | number;
}

export function ChartTooltip({
  active,
  payload,
  label,
  suffix,
  formatter,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  suffix?: string;
  formatter?: (entry: TooltipEntry) => ReactNode;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-edge bg-overlay/95 px-3 py-2.5 shadow-lift backdrop-blur">
      {label !== undefined ? (
        <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-faint">
          {label}
        </div>
      ) : null}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-[12.5px]">
            <span
              aria-hidden
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-ink-muted">{entry.name}</span>
            <span className="ml-auto pl-3 font-medium tabular-nums text-ink">
              {formatter ? formatter(entry) : `${entry.value}${suffix ?? ''}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartLegend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-2 text-[12px] text-ink-muted">
          <span
            aria-hidden
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

/**
 * Charts are decorative to a screen reader; the same numbers are always
 * available as text nearby. This wrapper carries the accessible summary.
 */
export function ChartFrame({
  height = 240,
  summary,
  children,
}: {
  height?: number;
  summary: string;
  children: ReactNode;
}) {
  return (
    <figure className="m-0" style={{ height }}>
      <figcaption className="sr-only">{summary}</figcaption>
      <div className="h-full w-full" aria-hidden>
        {children}
      </div>
    </figure>
  );
}
