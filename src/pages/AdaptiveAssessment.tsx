import { useState } from 'react';
import { ChevronsDown, ChevronsUp, Play, RotateCw, Target } from 'lucide-react';
import type { Assessment, SkillDimension } from '@/types';
import type { AdaptiveSession } from '@/lib/assessmentEngine';
import { AssessmentRunner } from '@/components/assessment/AssessmentRunner';
import { Panel, PanelBody, PanelHeader, PageHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Note } from '@/components/ui/Feedback';
import { ProgressBar } from '@/components/ui/Progress';
import { DIMENSION_LABELS, DIFFICULTY_LABELS } from '@/data/taxonomy';
import { STEP_DOWN_THRESHOLD, STEP_UP_THRESHOLD } from '@/lib/assessmentEngine';
import { PROJECT_QUESTIONS } from '@/data/questionBank';
import { applyToUnderstanding, startAdaptive } from '@/services/mockAssessmentService';
import { useAppState } from '@/hooks/useAppState';
import { round } from '@/lib/utils';

export function AdaptiveAssessment() {
  const { user, project, understanding, assessments, recordAssessment } = useAppState();
  const [session, setSession] = useState<AdaptiveSession | null>(null);
  const [result, setResult] = useState<Assessment | null>(null);

  const history = assessments.filter((a) => a.kind === 'adaptive');

  const start = () => {
    setResult(null);
    setSession(startAdaptive(project, user?.level ?? 'intermediate', 6));
  };

  const handleComplete = (assessment: Assessment, finished: AdaptiveSession) => {
    const updated = project
      ? applyToUnderstanding(understanding, finished, project.id, PROJECT_QUESTIONS)
      : undefined;
    recordAssessment(assessment, updated);
    setResult(assessment);
    setSession(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (session) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Adaptive"
          title="The engine is learning about you"
          description="Answer well and the next question gets harder. Struggle and it steps back to a more foundational concept. Every move is shown."
        />
        <AssessmentRunner
          initialSession={session}
          title="Adaptive assessment"
          intro="Six questions, selected live from your performance, your stack and the dimensions not yet covered."
          onComplete={handleComplete}
          onExit={() => setSession(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 stack-anim">
      <PageHeader
        eyebrow="Adaptive Assessment"
        title="Questions that adjust to your answers"
        description="A fixed quiz measures whether you saw the material. An adaptive one finds the edge of what you actually understand."
        action={
          <Button onClick={start} icon={<Play size={14} />}>
            Start assessment
          </Button>
        }
      />

      {result ? <ResultPanel assessment={result} /> : null}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Panel>
          <PanelHeader
            icon={<Target size={15} />}
            title="How the engine selects questions"
            description="No hidden model. Four visible rules, applied after every answer."
          />
          <PanelBody className="space-y-3">
            {[
              {
                icon: <ChevronsUp size={14} className="text-good" />,
                title: `Score ${STEP_UP_THRESHOLD} or above`,
                body: 'Difficulty steps up one level. The engine assumes the concept is held, not guessed.',
              },
              {
                icon: <ChevronsDown size={14} className="text-warn" />,
                title: `Score below ${STEP_DOWN_THRESHOLD}`,
                body: 'Difficulty steps down and the next question targets the concept underneath the one you missed.',
              },
              {
                icon: <Target size={14} className="text-accent" />,
                title: 'Dimensions not yet covered are favoured',
                body: 'The engine widens coverage before it deepens it, so one strong area cannot carry the score.',
              },
              {
                icon: <Target size={14} className="text-info" />,
                title: 'Your stack breaks ties',
                body: project
                  ? `Questions tagged with ${project.stack.slice(0, 3).join(', ')} are preferred at equal fit.`
                  : 'Connect a project and questions about your own stack get preference.',
              },
            ].map((rule) => (
              <div
                key={rule.title}
                className="flex gap-3 rounded-xl border border-hairline bg-raised px-4 py-3.5"
              >
                <span className="mt-0.5 shrink-0">{rule.icon}</span>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium text-ink">{rule.title}</div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">
                    {rule.body}
                  </p>
                </div>
              </div>
            ))}
          </PanelBody>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <PanelHeader title="Your starting point" />
            <PanelBody>
              <div className="space-y-3 text-[13px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-ink-muted">Declared level</span>
                  <Badge tone="accent">
                    {user?.level ? DIFFICULTY_LABELS[
                      user.level === 'beginner'
                        ? 'foundational'
                        : user.level === 'advanced'
                          ? 'advanced'
                          : 'intermediate'
                    ] : 'Intermediate'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-ink-muted">Questions per run</span>
                  <span className="num text-ink">6</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-ink-muted">Adaptive runs completed</span>
                  <span className="num text-ink">{history.length}</span>
                </div>
              </div>
            </PanelBody>
          </Panel>

          {history.length ? (
            <Panel>
              <PanelHeader title="Previous runs" />
              <PanelBody className="space-y-2.5">
                {history
                  .slice()
                  .reverse()
                  .slice(0, 4)
                  .map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-raised px-3.5 py-3"
                    >
                      <span className="text-[12.5px] text-ink-muted">
                        {a.responses.length} questions
                      </span>
                      <span className="num text-[13px] font-medium text-ink">
                        {round(a.overallScore, 0)} / 100
                      </span>
                    </div>
                  ))}
              </PanelBody>
            </Panel>
          ) : null}

          <Note tone="info">
            Adaptive results feed straight back into your project understanding profile and
            your dashboard metrics. Scores move; they are not decoration.
          </Note>
        </div>
      </div>
    </div>
  );
}

function ResultPanel({ assessment }: { assessment: Assessment }) {
  const dimensions = Object.entries(assessment.dimensionScores) as [SkillDimension, number][];

  return (
    <Panel className="border-accent-line">
      <PanelHeader
        title="Assessment complete"
        description={`${assessment.responses.length} questions answered. Your profile has been updated.`}
        action={
          <Badge tone="accent" className="tabular-nums">
            {round(assessment.overallScore, 0)} / 100
          </Badge>
        }
      />
      <PanelBody>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-3.5">
            <div className="label-caps">By dimension</div>
            {dimensions.map(([dimension, score]) => (
              <div key={dimension}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="text-[13px] text-ink">{DIMENSION_LABELS[dimension]}</span>
                  <span className="num text-[12.5px] text-ink-muted">
                    {Math.round(score)}%
                  </span>
                </div>
                <ProgressBar
                  value={score}
                  tone={score >= 75 ? 'good' : score >= 50 ? 'accent' : 'warn'}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2.5">
            <div className="label-caps">Feedback</div>
            {assessment.responses.map((response, i) => (
              <div key={response.questionId} className="rounded-xl border border-hairline bg-raised p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[12px] text-ink-faint">Q{i + 1}</span>
                  <span className="num text-[12px] text-ink-muted">
                    {Math.round(response.score)}
                  </span>
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">
                  {response.feedback}
                </p>
              </div>
            ))}
          </div>
        </div>
      </PanelBody>
    </Panel>
  );
}

export function RetakeButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" icon={<RotateCw size={14} />} onClick={onClick}>
      Run again
    </Button>
  );
}
