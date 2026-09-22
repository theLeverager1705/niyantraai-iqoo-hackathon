import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  optional,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
  optional?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink">
          {label}
        </label>
        {optional ? <span className="text-[11px] text-ink-faint">Optional</span> : null}
      </div>
      {children}
      {error ? (
        <p className="text-[12px] text-risk" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12px] leading-relaxed text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
}

const INPUT_BASE =
  'w-full rounded-xl border border-edge bg-raised px-3.5 text-sm text-ink placeholder:text-ink-faint transition-colors hover:border-[rgba(255,255,255,0.18)] focus:border-accent-line focus:bg-overlay';

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(INPUT_BASE, 'h-11', className)} {...rest} />;
}

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(INPUT_BASE, 'min-h-[120px] resize-y py-3 leading-relaxed', className)}
      {...rest}
    />
  );
}

export function OptionCard({
  selected,
  onSelect,
  title,
  description,
  icon,
  compact,
  disabled,
}: {
  selected: boolean;
  onSelect: () => void;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  compact?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'group relative w-full rounded-xl border text-left transition-all duration-150',
        compact ? 'px-3.5 py-3' : 'px-4 py-3.5',
        selected
          ? 'border-accent-line bg-accent-soft'
          : 'border-hairline bg-raised hover:border-edge hover:bg-overlay',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      <div className="flex items-start gap-3">
        {icon ? (
          <span className={cn('mt-0.5 shrink-0', selected ? 'text-accent' : 'text-ink-faint')}>
            {icon}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className={cn('text-[13.5px] font-medium', selected ? 'text-ink' : 'text-ink')}>
            {title}
          </div>
          {description ? (
            <div className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">{description}</div>
          ) : null}
        </div>
        <span
          aria-hidden
          className={cn(
            'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors',
            selected ? 'border-accent bg-accent text-[#0b0c11]' : 'border-edge',
          )}
        >
          {selected ? <Check size={11} strokeWidth={3} /> : null}
        </span>
      </div>
    </button>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  id,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  id: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <label htmlFor={id} className="block text-[13.5px] font-medium text-ink">
          {label}
        </label>
        {description ? (
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">{description}</p>
        ) : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors duration-200',
          checked ? 'border-accent-line bg-accent' : 'border-edge bg-white/[0.06]',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all duration-200',
            checked ? 'left-[22px] bg-[#0b0c11]' : 'left-[3px] bg-ink-muted',
          )}
        />
      </button>
    </div>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (next: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex rounded-xl border border-hairline bg-raised p-1"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors',
              active ? 'bg-overlay text-ink shadow-card' : 'text-ink-muted hover:text-ink',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
