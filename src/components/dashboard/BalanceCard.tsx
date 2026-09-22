import { useState } from 'react';
import { ChevronDown, ShieldCheck } from 'lucide-react';
import type { BalanceScore } from '@/types';
import { Badge, type Tone } from '@/components/ui/Badge';
import { BandGauge, ScoreRing } from '@/components/ui/Progress';
import { DEPENDENCY_BAND } from '@/lib/analyticsEngine';
import { cn, round } from '@/lib/utils';

const RISK_TONE: Record<BalanceScore['risk'], Tone> = {
  healthy: 'good',
  moderate: 'accent',
  elevated: 'warn',
  high: 'risk',
};

export function BalanceCard({
  balance,
  dependency,
  methodology,
}: {
  balance: BalanceScore;
  dependency: number;
  methodology: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="panel overflow-hidden">
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[auto_1fr] lg:gap-8">
        <div className="flex justify-center lg:justify-start">
          <ScoreRing
            value={balance.value}
            tone={balance.risk}
            size={186}
            thickness={13}
            caption={`AI-Human Balance Score ${balance.value} out of 100, rated ${balance.label}`}
          >
            <span className="num text-[42px] font-semibold leading-none text-ink">
              {balance.value}
            </span>
            <span className="mt-1 text-[12px] text-ink-faint">/ 100</span>
          </ScoreRing>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
              AI-Human Balance Score
            </h2>
            <Badge tone={RISK_TONE[balance.risk]} icon={<ShieldCheck size={11} />}>
              {balance.label}
            </Badge>
          </div>

          <p className="mt-2.5 max-w-xl text-[14px] leading-relaxed text-ink-muted">
            {balance.summary}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {balance.contributions.map((c) => (
              <div
                key={c.label}
                className="rounded-xl border border-hairline bg-raised px-3.5 py-3"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[12.5px] text-ink-muted">{c.label}</span>
                  <span className="num text-[13px] font-medium text-ink">
                    {round(c.value, 0)}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-ink-faint">
                  {Math.round(c.weight * 100)}% of the score
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-hairline bg-raised px-4 py-3.5">
            <div className="mb-2.5 flex items-baseline justify-between gap-3">
              <span className="text-[12.5px] text-ink-muted">
                Your AI dependency sits at{' '}
                <span className="font-medium text-ink">{round(dependency, 0)}%</span>
              </span>
            </div>
            <BandGauge
              value={dependency}
              low={DEPENDENCY_BAND.low}
              high={DEPENDENCY_BAND.high}
              label="Dependency is not scored as linearly bad. Heavy use is fine; the band above 55% is where output starts outpacing understanding."
            />
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] text-ink-muted transition-colors hover:text-ink"
          >
            <ChevronDown
              size={14}
              className={cn('transition-transform duration-200', open && 'rotate-180')}
            />
            How this score is calculated
          </button>

          {open ? (
            <ul className="mt-3 space-y-2 rounded-xl border border-hairline bg-raised p-4 text-[12.5px] leading-relaxed text-ink-muted animate-fade-in">
              {methodology.map((line) => (
                <li key={line} className="flex gap-2">
                  <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-faint" />
                  {line}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}
