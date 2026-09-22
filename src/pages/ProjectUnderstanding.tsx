import { useState } from 'react';
import { ArrowRight, FolderGit2, Github, Play, Sparkles, Target } from 'lucide-react';
import type { Assessment } from '@/types';
import type { AdaptiveSession } from '@/lib/assessmentEngine';
import { AssessmentRunner } from '@/components/assessment/AssessmentRunner';
import { UnderstandingRadar } from '@/components/charts/UsageCharts';
import { Panel, PanelBody, PanelHeader, PageHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button, LinkButton } from '@/components/ui/Button';
import { EmptyState, Note } from '@/components/ui/Feedback';
import { ProgressBar, ScoreRing } from '@/components/ui/Progress';
import { useAppState } from '@/hooks/useAppState';
import { PROJECT_QUESTIONS } from '@/data/questionBank';
import { applyToUnderstanding, startProjectCheck } from '@/services/mockAssessmentService';
import { formatDate } from '@/lib/utils';

export function ProjectUnderstanding() {
  const { project, understanding, user, recordAssessment } = useAppState();
  const [session, setSession] = useState<AdaptiveSession | null>(null);
  const [result, setResult] = useState<Assessment | null>(null);

  if (!project) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Project Understanding"
          title="Do you understand what you built?"
          description="Working software is not evidence that you understand it. Connect a project and NiyantraAI will ask you about the code you shipped."
        />
        <EmptyState
          icon={<FolderGit2 size={18} />}
          title="No project connected yet"
          description="Add a repository or a project name and stack, and the assessment engine will generate questions about the architecture you actually built."
          action={
            <LinkButton to="/app/integrations" variant="primary">
              Connect a project
            </LinkButton>
          }
        />
      </div>
    );
  }

  const handleStart = () => {
    setResult(null);
    setSession(startProjectCheck(project, user?.level ?? 'intermediate'));
  };

  const handleComplete = (assessment: Assessment, finished: AdaptiveSession) => {
    const updated = applyToUnderstanding(
      understanding,
      finished,
      project.id,
      PROJECT_QUESTIONS,
    );
    recordAssessment(assessment, updated);
    setResult(assessment);
    setSession(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ---------------- running the check ---------------- */

  if (session) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow={project.name}
          title="Knowledge check"
          description="Five adaptive questions about this project. Answer from memory — the gaps are the useful part."
        />
        <AssessmentRunner
          initialSession={session}
          title="Project understanding"
          intro="These questions are selected from your stack. Difficulty adjusts after each answer."
          onComplete={handleComplete}
          onExit={() => setSession(null)}
        />
      </div>
    );
  }

  /* ---------------- profile ---------------- */

  const areas = understanding?.areas ?? [];
  const sortedAreas = [...areas].sort((a, b) => b.score - a.score);
  const weakest = [...areas].sort((a, b) => a.score - b.score)[0];

  return (
    <div className="space-y-5 stack-anim">
      <PageHeader
        eyebrow="Project Understanding"
        title="Do you understand what you built?"
        description="A high score here cannot be earned by shipping. It is earned by explaining the mechanism without the code in front of you."
        action={
          <Button onClick={handleStart} icon={<Play size={14} />}>
            {understanding ? 'Start knowledge check' : 'Run first check'}
          </Button>
        }
      />

      {result ? (
        <Panel className="border-accent-line">
          <PanelBody className="pt-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="accent" icon={<Sparkles size={11} />}>
                Check complete
              </Badge>
              <span className="num text-[14px] font-medium text-ink">
                {Math.round(result.overallScore)} / 100 across {result.responses.length}{' '}
                questions
              </span>
            </div>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-muted">
              Your project understanding profile and dashboard metrics have been updated
              with these answers.
            </p>
            <div className="mt-4 space-y-2.5">
              {result.responses.map((response, i) => (
                <div key={response.questionId} className="rounded-xl border border-hairline bg-raised p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12px] text-ink-faint">Question {i + 1}</span>
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
          </PanelBody>
        </Panel>
      ) : null}

      {/* ---------------- project card ---------------- */}
      <Panel>
        <PanelBody className="pt-5">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="min-w-0">
              <div className="label-caps">Project</div>
              <h2 className="mt-1.5 text-[20px] font-semibold tracking-[-0.02em] text-ink">
                {project.name}
              </h2>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {project.stack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-md border border-hairline bg-raised px-2 py-1 text-[11.5px] text-ink-muted"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {project.repoUrl ? (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] text-ink-muted transition-colors hover:text-ink"
                >
                  <Github size={13} />
                  {project.repoUrl.replace('https://github.com/', '')}
                </a>
              ) : null}

              {understanding?.lastCheckedAt ? (
                <p className="mt-3 text-[12px] text-ink-faint">
                  Last checked {formatDate(understanding.lastCheckedAt)} ·{' '}
                  {understanding.questionsAnswered} questions answered
                </p>
              ) : null}
            </div>

            {understanding ? (
              <div className="flex justify-center lg:justify-end">
                <ScoreRing
                  value={understanding.overall}
                  tone={
                    understanding.overall >= 80
                      ? 'healthy'
                      : understanding.overall >= 60
                        ? 'moderate'
                        : 'elevated'
                  }
                  size={150}
                  thickness={11}
                  caption={`Project understanding ${understanding.overall} percent`}
                >
                  <span className="num text-[32px] font-semibold leading-none text-ink">
                    {understanding.overall}
                  </span>
                  <span className="mt-0.5 text-[11px] text-ink-faint">understood</span>
                </ScoreRing>
              </div>
            ) : null}
          </div>
        </PanelBody>
      </Panel>

      {understanding ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel>
            <PanelHeader
              icon={<Target size={15} />}
              title="Understanding by area"
              description="Derived from your answers, not from what the repository contains."
            />
            <PanelBody>
              <UnderstandingRadar areas={areas} />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Where you stand" />
            <PanelBody className="space-y-4">
              {sortedAreas.map((area) => (
                <div key={area.key}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <span className="text-[13.5px] text-ink">{area.label}</span>
                    <span className="num text-[13px] font-medium text-ink-muted">
                      {area.score}%
                    </span>
                  </div>
                  <ProgressBar
                    value={area.score}
                    tone={area.score >= 85 ? 'good' : area.score >= 70 ? 'accent' : 'warn'}
                  />
                  <p className="mt-1.5 text-[12px] leading-relaxed text-ink-faint">
                    {area.note}
                  </p>
                </div>
              ))}
            </PanelBody>
          </Panel>
        </div>
      ) : (
        <EmptyState
          icon={<Target size={18} />}
          title="No understanding profile yet"
          description="Run your first knowledge check and NiyantraAI will build a per-area profile of what you can explain about this project."
          action={
            <Button onClick={handleStart} icon={<Play size={14} />}>
              Run first check
            </Button>
          }
        />
      )}

      {weakest ? (
        <Panel>
          <PanelHeader title="Knowledge check" description="A sample of what you will be asked." />
          <PanelBody>
            <div className="rounded-xl border border-hairline bg-raised px-4 py-3.5">
              <div className="label-caps">Example question</div>
              <p className="mt-2 text-[14px] leading-relaxed text-ink">
                "Why does your backend use middleware before reaching the resume
                controller? Explain what the middleware does with control afterwards."
              </p>
              <p className="mt-3 text-[12.5px] leading-relaxed text-ink-faint">
                Answers are scored on concept coverage and causal reasoning. Partial
                answers score partially — the feedback names exactly what you left out.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[12.5px] text-ink-muted">
                Weakest area right now: <span className="text-ink">{weakest.label}</span> at{' '}
                {weakest.score}%.
              </p>
              <Button onClick={handleStart} iconAfter={<ArrowRight size={14} />}>
                Start knowledge check
              </Button>
            </div>
          </PanelBody>
        </Panel>
      ) : null}

      <Note tone="info">
        Understanding scores blend into the Code Understanding metric on your dashboard, so
        answering these questions moves your AI-Human Balance. Existing area scores move
        toward new evidence rather than being replaced.
      </Note>
    </div>
  );
}
