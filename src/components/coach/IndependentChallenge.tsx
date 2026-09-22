import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Pause, Play, RotateCw, Timer, X } from 'lucide-react';
import type { Challenge } from '@/data/challenges';
import { CHALLENGES } from '@/data/challenges';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Progress';
import { cn } from '@/lib/utils';

function formatClock(seconds: number): string {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function IndependentChallenge({
  challenge,
  onClose,
}: {
  challenge: Challenge;
  onClose: () => void;
}) {
  const [active, setActive] = useState<Challenge>(challenge);
  const [remaining, setRemaining] = useState(challenge.minutes * 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          setRunning(false);
          setFinished(true);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const total = active.minutes * 60;
  const elapsedPct = ((total - remaining) / total) * 100;

  const reset = (next: Challenge = active) => {
    setActive(next);
    setRemaining(next.minutes * 60);
    setRunning(false);
    setFinished(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/75 animate-fade-in" onClick={onClose} aria-hidden />

      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Independent challenge: ${active.title}`}
        className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-edge bg-surface shadow-lift outline-none animate-scale-in sm:rounded-2xl"
      >
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-hairline bg-surface/95 px-5 py-4 backdrop-blur">
          <div className="min-w-0">
            <Badge tone="accent" icon={<Timer size={11} />}>
              {active.minutes}-minute independent challenge
            </Badge>
            <h2 className="mt-2 text-[17px] font-semibold tracking-[-0.01em] text-ink">
              {active.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close challenge"
            className="-mr-1 -mt-1 rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-white/[0.06] hover:text-ink"
          >
            <X size={17} />
          </button>
        </div>

        <div className="px-5 py-5">
          {/* timer */}
          <div className="rounded-xl border border-hairline bg-raised px-4 py-4 text-center">
            <div
              className={cn(
                'num text-[44px] font-semibold leading-none tracking-[-0.03em]',
                finished ? 'text-good' : running ? 'text-ink' : 'text-ink-muted',
              )}
              role="timer"
              aria-live="off"
            >
              {formatClock(remaining)}
            </div>
            <ProgressBar
              className="mt-4"
              value={elapsedPct}
              tone={finished ? 'good' : 'accent'}
              label="Challenge progress"
            />
            <div className="mt-4 flex items-center justify-center gap-2">
              {!finished ? (
                <Button
                  onClick={() => setRunning((r) => !r)}
                  icon={running ? <Pause size={14} /> : <Play size={14} />}
                >
                  {running ? 'Pause' : remaining === total ? 'Start' : 'Resume'}
                </Button>
              ) : null}
              <Button variant="secondary" icon={<RotateCw size={14} />} onClick={() => reset()}>
                Reset
              </Button>
              {!finished && remaining < total ? (
                <Button
                  variant="ghost"
                  icon={<CheckCircle2 size={14} />}
                  onClick={() => {
                    setRunning(false);
                    setFinished(true);
                  }}
                >
                  Done early
                </Button>
              ) : null}
            </div>
          </div>

          {/* brief */}
          {!finished ? (
            <div className="mt-5 space-y-4">
              <div>
                <div className="label-caps">The brief</div>
                <p className="mt-2 text-[14px] leading-relaxed text-ink">{active.brief}</p>
              </div>
              <div>
                <div className="label-caps">Rules</div>
                <ul className="mt-2 space-y-1.5">
                  {active.constraints.map((c) => (
                    <li key={c} className="flex gap-2 text-[13px] leading-relaxed text-ink-muted">
                      <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-faint" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-4 animate-fade-up">
              <div className="rounded-xl border border-[rgba(63,207,142,0.28)] bg-good-soft px-4 py-3.5">
                <div className="flex items-center gap-2 text-good">
                  <CheckCircle2 size={15} />
                  <span className="text-[13.5px] font-medium">Challenge complete</span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
                  You now have something of your own to hand the assistant. Ask it to
                  critique what you produced rather than to produce the next thing.
                </p>
              </div>
              <div>
                <div className="label-caps">Before you move on</div>
                <ul className="mt-2 space-y-1.5">
                  {active.reflection.map((r) => (
                    <li key={r} className="flex gap-2 text-[13px] leading-relaxed text-ink-muted">
                      <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* other challenges */}
          <div className="mt-6 border-t border-hairline pt-4">
            <div className="label-caps mb-2.5">Other challenges</div>
            <div className="flex flex-wrap gap-2">
              {CHALLENGES.filter((c) => c.id !== active.id).map((c) => (
                <button
                  key={c.id}
                  onClick={() => reset(c)}
                  className="rounded-lg border border-hairline bg-raised px-3 py-1.5 text-[12px] text-ink-muted transition-colors hover:border-edge hover:text-ink"
                >
                  {c.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
