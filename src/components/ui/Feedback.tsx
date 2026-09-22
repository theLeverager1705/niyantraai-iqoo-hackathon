import type { ReactNode } from 'react';
import { AlertTriangle, Info, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('shimmer rounded-lg bg-white/[0.04]', className)}
      aria-hidden
    />
  );
}

export function LoadingPanel({ rows = 3, title }: { rows?: number; title?: string }) {
  return (
    <div className="panel p-6" role="status" aria-live="polite">
      <span className="sr-only">{title ?? 'Loading'}</span>
      <Skeleton className="h-4 w-40" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-edge bg-surface/60 px-6 py-14 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-hairline bg-raised text-ink-muted">
          {icon}
        </div>
      ) : null}
      <h3 className="text-[15px] font-medium text-ink">{title}</h3>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-ink-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-2xl border border-[rgba(240,97,111,0.28)] bg-risk-soft px-5 py-4"
    >
      <div className="flex items-center gap-2 text-risk">
        <AlertTriangle size={16} />
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <p className="text-[13px] leading-relaxed text-ink-muted">{description}</p>
      {onRetry ? (
        <Button size="sm" variant="secondary" icon={<RotateCw size={14} />} onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

/**
 * Used wherever the prototype shows simulated data or a prototype heuristic.
 * Being explicit about this is a product requirement, not a disclaimer.
 */
export function Note({
  children,
  tone = 'neutral',
  icon,
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'info' | 'warn';
  icon?: ReactNode;
  className?: string;
}) {
  const tones = {
    neutral: 'border-hairline bg-white/[0.03] text-ink-muted',
    info: 'border-[rgba(76,201,240,0.22)] bg-info-soft text-ink-muted',
    warn: 'border-[rgba(240,180,41,0.24)] bg-warn-soft text-ink-muted',
  } as const;

  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[12.5px] leading-relaxed',
        tones[tone],
        className,
      )}
    >
      <span className="mt-[1px] shrink-0 text-ink-faint">{icon ?? <Info size={14} />}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
