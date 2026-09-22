import { useState } from 'react';
import { Info, TrendingDown, TrendingUp } from 'lucide-react';
import type { SkillMetric } from '@/types';
import { cn, signed } from '@/lib/utils';
import { ProgressBar, useCountUp } from '@/components/ui/Progress';

const TONE_BY_KEY: Record<string, 'accent' | 'good' | 'warn' | 'info' | 'risk'> = {
  aiDependency: 'warn',
  independentThinking: 'good',
  codeUnderstanding: 'info',
  promptQuality: 'accent',
  learningMomentum: 'good',
};

export function MetricCard({
  metric,
  compact,
  suffix = '%',
  showBar = true,
}: {
  metric: SkillMetric;
  compact?: boolean;
  suffix?: string;
  showBar?: boolean;
}) {
  const [showInfo, setShowInfo] = useState(false);
  const animated = useCountUp(metric.value, 950);
  const tone = TONE_BY_KEY[metric.key] ?? 'accent';
  const improving = metric.higherIsBetter ? metric.delta > 0 : metric.delta < 0;
  const hasDelta = Math.abs(metric.delta) >= 0.05;
  const isMomentum = metric.key === 'learningMomentum';

  return (
    <div
      className={cn(
        'panel relative flex flex-col transition-colors duration-200 hover:border-edge',
        compact ? 'px-4 py-3.5' : 'px-5 py-4',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="label-caps">{metric.label}</span>
        <button
          type="button"
          aria-label={`About ${metric.label}`}
          aria-expanded={showInfo}
          onClick={() => setShowInfo((v) => !v)}
          className="-mr-1 -mt-1 rounded-md p-1 text-ink-faint transition-colors hover:bg-white/[0.06] hover:text-ink-muted"
        >
          <Info size={13} />
        </button>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span
          className={cn(
            'num font-semibold text-ink',
            compact ? 'text-[24px]' : 'text-[30px]',
          )}
        >
          {isMomentum && animated > 0 ? '+' : ''}
          {Math.round(animated * 10) / 10}
          <span className="text-[15px] font-medium text-ink-faint">{suffix}</span>
        </span>

        {hasDelta && !isMomentum ? (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[12px] font-medium tabular-nums',
              improving ? 'text-good' : 'text-warn',
            )}
            title={`${signed(metric.delta, ' pts')} versus last week`}
          >
            {metric.delta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {signed(metric.delta, '')}
          </span>
        ) : null}
      </div>

      {showBar && !isMomentum ? (
        <ProgressBar className="mt-3" value={metric.value} tone={tone} label={metric.label} />
      ) : null}

      {showInfo ? (
        <p className="mt-3 rounded-lg border border-hairline bg-raised px-3 py-2.5 text-[12px] leading-relaxed text-ink-muted animate-fade-in">
          {metric.description}
        </p>
      ) : null}
    </div>
  );
}
