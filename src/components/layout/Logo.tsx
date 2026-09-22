import { cn } from '@/lib/utils';

export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <rect width="32" height="32" rx="8" fill="#12151c" />
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        rx="7.5"
        fill="none"
        stroke="rgba(255,255,255,0.1)"
      />
      <path
        d="M9.5 23V9.5L22.5 23V9.5"
        stroke="#7c8cff"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.5" cy="9.5" r="1.7" fill="#3fcf8e" />
      <circle cx="22.5" cy="23" r="1.7" fill="#4cc9f0" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
        Niyantra<span className="text-accent">AI</span>
      </span>
    </span>
  );
}
