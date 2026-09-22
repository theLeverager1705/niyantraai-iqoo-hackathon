import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Gauge, RotateCw } from 'lucide-react';
import type { Assessment, SkillDimension } from '@/types';
import { AssessmentRunner } from '@/components/assessment/AssessmentRunner';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/Progress';
import { Note } from '@/components/ui/Feedback';
import { Wordmark } from '@/components/layout/Logo';
import { DIMENSION_LABELS, DIMENSION_ORDER } from '@/data/taxonomy';
import { startBaseline } from '@/services/mockAssessmentService';
import { useAppState } from '@/hooks/useAppState';
import { round } from '@/lib/utils';

function toneFor(score: number) {
  if (score >= 75) return 'good' as const;
  if (score >= 55) return 'accent' as const;
  if (score >= 40) return 'warn' as const;
  return 'risk' as const;
}

export function BaselineAssessment() {
  const navigate = useNavigate();
  const { user, onboarded, completeBaseline } = useAppState();
  const [result, setResult] = useState<Assessment | null>(null);
  const [runKey, setRunKey] = useState(0);

  const session = useMemo(
    () => startBaseline(user?.level ?? 'intermediate'),
    // A new session is deliberately created when the user retakes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.level, runKey],
  );

  if (!onboarded) return <Navigate to="/onboarding" replace />;

  const handleComplete = (assessment: Assessment) => {
    completeBaseline(assessment);
    setResult(assessment);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-canvas aurora">
      <div className="relative z-10 mx-auto max-w-3xl px-5 py-6 sm:px-6">
        <header className="mb-7 flex items-center justify-between">
          <Wordmark />
          <span className="text-[12.5px] text-ink-faint">Baseline</span>
        </header>

        {!result ? (
          <>
            <div className="mb-6">
              <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-ink">
                Baseline assessment
              </h1>
              <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-ink-muted">
                Eight questions that measure where you are before heavy AI assistance. There
                is no pass mark — a low score here simply makes later growth measurable.
              </p>
            </div>
            <AssessmentRunner
              key={session.id}
              initialSession={session}
              title="Baseline assessment"
              intro="Answer from memory. If you do not know something, say what you would check first — that reasoning is scored too."
              onComplete={handleComplete}
              onExit={() => navigate('/')}
            />
          </>
        ) : (
          <BaselineResults
            assessment={result}
            onRetake={() => {
              setResult(null);
              setRunKey((k) => k + 1);
            }}
            onContinue={() => navigate('/app')}
          />
        )}
      </div>
    </div>
  );
}

function BaselineResults({
  assessment,
  onRetake,
  onContinue,
}: {
  assessment: Assessment;
  onRetake: () => void;
  onContinue: () => void;
}) {
  const dimensions = DIMENSION_ORDER.filter(
    (d) => assessment.dimensionScores[d] !== undefined,
  ) as SkillDimension[];

  return (
    <div className="space-y-5 animate-fade-up">
      <Panel className="p-6 sm:p-7">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-hairline bg-raised text-accent">
            <Gauge size={18} />
          </div>
          <div className="min-w-0">
            <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
              Baseline skill score
            </h1>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">
              This is your starting point, captured before extensive AI assistance. Every
              metric on your dashboard is measured relative to it.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-end gap-3">
          <span className="num text-[44px] font-semibold leading-none text-ink">
            {round(assessment.overallScore, 0)}
          </span>
          <span className="pb-1.5 text-[14px] text-ink-muted">/ 100 overall</span>
        </div>

        <div className="mt-6 space-y-4">
          {dimensions.map((dimension) => {
            const score = assessment.dimensionScores[dimension] ?? 0;
            return (
              <div key={dimension}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="text-[13.5px] text-ink">{DIMENSION_LABELS[dimension]}</span>
                  <span className="num text-[13.5px] font-medium text-ink-muted">
                    {Math.round(score)}%
                  </span>
                </div>
                <ProgressBar value={score} tone={toneFor(score)} />
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel className="p-5 sm:p-6">
        <h2 className="text-[14.5px] font-medium text-ink">What you answered</h2>
        <div className="mt-4 space-y-3">
          {assessment.responses.map((response, index) => (
            <div key={response.questionId} className="rounded-xl border border-hairline bg-raised p-3.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[12px] text-ink-faint">Question {index + 1}</span>
                <span className="num text-[12.5px] font-medium text-ink-muted">
                  {Math.round(response.score)} / 100
                </span>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
                {response.feedback}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <Note tone="info">
        Baseline scores feed the Code Understanding metric on your dashboard. Retaking this
        replaces the previous result.
      </Note>

      <div className="flex flex-wrap items-center justify-between gap-3 pb-8">
        <Button variant="ghost" icon={<RotateCw size={15} />} onClick={onRetake}>
          Retake
        </Button>
        <Button onClick={onContinue} iconAfter={<ArrowRight size={15} />}>
          Open dashboard
        </Button>
      </div>
    </div>
  );
}
