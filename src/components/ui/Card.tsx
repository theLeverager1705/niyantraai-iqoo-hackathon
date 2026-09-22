import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Panel({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('panel', className)} {...rest}>
      {children}
    </div>
  );
}

export function PanelHeader({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 px-5 pb-4 pt-5 sm:px-6',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {icon ? <span className="text-ink-muted">{icon}</span> : null}
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
        </div>
        {description ? (
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-ink-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function PanelBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('px-5 pb-5 sm:px-6 sm:pb-6', className)}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? <div className="label-caps mb-2">{eyebrow}</div> : null}
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink sm:text-[26px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

/** Subtle divider with an optional caption, used between dense sections. */
export function Divider({ label }: { label?: string }) {
  if (!label) return <div className="h-px w-full bg-hairline" />;
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-hairline" />
      <span className="label-caps">{label}</span>
      <div className="h-px flex-1 bg-hairline" />
    </div>
  );
}
