import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'quiet';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent text-[#0b0c11] font-medium hover:bg-[#8e9bff] active:bg-[#7181f5] shadow-[0_8px_24px_-14px_rgba(124,140,255,0.9)]',
  secondary:
    'bg-raised text-ink border border-edge hover:bg-overlay hover:border-[rgba(255,255,255,0.18)]',
  ghost: 'text-ink-muted hover:text-ink hover:bg-white/[0.04]',
  quiet: 'bg-white/[0.04] text-ink hover:bg-white/[0.08] border border-hairline',
  danger:
    'bg-risk/10 text-risk border border-[rgba(240,97,111,0.35)] hover:bg-risk/[0.16]',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-xl',
};

const BASE =
  'inline-flex items-center justify-center whitespace-nowrap font-medium transition-[background-color,border-color,color,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-45 select-none';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  iconAfter?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, icon, iconAfter, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
      {children}
      {!loading && iconAfter}
    </button>
  );
});

export function LinkButton({
  to,
  variant = 'primary',
  size = 'md',
  className,
  icon,
  iconAfter,
  children,
  ...rest
}: {
  to: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  icon?: ReactNode;
  iconAfter?: ReactNode;
  children: ReactNode;
} & Omit<React.ComponentProps<typeof Link>, 'to' | 'className' | 'children'>) {
  return (
    <Link to={to} className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...rest}>
      {icon}
      {children}
      {iconAfter}
    </Link>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="presentation"
      className={cn(
        'h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-[1.5px] border-current border-r-transparent opacity-80',
        className,
      )}
    />
  );
}
