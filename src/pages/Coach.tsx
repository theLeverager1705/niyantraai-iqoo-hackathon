import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Compass,
  HeartHandshake,
  Lightbulb,
  ShieldCheck,
  Timer,
} from 'lucide-react';
import type { Recommendation } from '@/types';
import { RequireAnalytics } from '@/components/layout/RequireAnalytics';
import { IndependentChallenge } from '@/components/coach/IndependentChallenge';
import { Panel, PanelBody, PanelHeader, PageHeader } from '@/components/ui/Card';
import { Badge, type Tone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Note } from '@/components/ui/Feedback';
import { challengeForArea } from '@/data/challenges';
import { useAppState } from '@/hooks/useAppState';

const PRIORITY_TONE: Record<Recommendation['priority'], Tone> = {
  primary: 'warn',
  supporting: 'accent',
  reinforce: 'good',
};

const PRIORITY_LABEL: Record<Recommendation['priority'], string> = {
  primary: 'Biggest opportunity',
  supporting: 'Worth doing next',
  reinforce: 'Keep doing this',
};

export function Coach() {
  const navigate = useNavigate();
  const { user } = useAppState();
  const [challengeOpen, setChallengeOpen] = useState(false);

  const runAction = (rec: Recommendation) => {
    switch (rec.actionKind) {
      case 'challenge':
        setChallengeOpen(true);
        break;
      case 'assessment':
        navigate(rec.targetMetric === 'Project Understanding' ? '/app/project' : '/app/assessment');
        break;
      case 'prompt-lab':
        navigate('/app/prompts');
        break;
      case 'review':
        navigate(rec.targetMetric === 'AI Dependency' ? '/app/report' : '/app/analytics');
        break;
    }
  };

  return (
    <RequireAnalytics loadingRows={5}>
      {({ recommendations, snapshot }) => {
        const primary = recommendations.filter((r) => r.priority === 'primary');
        const supporting = recommendations.filter((r) => r.priority === 'supporting');
        const reinforce = recommendations.filter((r) => r.priority === 'reinforce');

        return (
          <div className="space-y-5 stack-anim">
            <PageHeader
              eyebrow="Your AI Coach"
              title="What to change next, and why"
              description="Every card below exists because something in your data triggered it. No card is generic advice, and none of them will ever tell you to use AI less."
            />

            {/* ---------------- principle ---------------- */}
            <Panel className="border-accent-line">
              <PanelBody className="pt-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-accent-line bg-accent-soft text-accent">
                    <HeartHandshake size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium leading-relaxed text-ink">
                      "AI usage is not the problem. Unconscious dependence is."
                    </p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
                      The goal is optimisation, not restriction. Your balance score of{' '}
                      {snapshot.balance.value}/100 already reflects that: heavy AI use is
                      not penalised, only the part where your own reasoning drops out.
                    </p>
                  </div>
                </div>
              </PanelBody>
            </Panel>

            {/* ---------------- primary ---------------- */}
            {primary.map((rec) => (
              <Panel key={rec.id}>
                <PanelBody className="pt-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={PRIORITY_TONE[rec.priority]} icon={<Compass size={11} />}>
                      {PRIORITY_LABEL[rec.priority]}
                    </Badge>
                    <Badge tone="neutral">Targets {rec.targetMetric}</Badge>
                    <Badge tone="neutral" icon={<Timer size={11} />}>
                      {rec.estimatedMinutes} min
                    </Badge>
                  </div>

                  <h2 className="mt-3.5 text-[20px] font-semibold leading-snug tracking-[-0.02em] text-ink">
                    {rec.title}
                  </h2>

                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-hairline bg-raised px-4 py-3.5">
                      <div className="label-caps">Why</div>
                      <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">
                        {rec.why}
                      </p>
                    </div>
                    <div className="rounded-xl border border-hairline bg-raised px-4 py-3.5">
                      <div className="label-caps flex items-center gap-1.5">
                        <BarChart3 size={11} /> Evidence from your week
                      </div>
                      <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">
                        {rec.evidence}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-accent-line bg-accent-soft px-4 py-3.5">
                    <div className="label-caps flex items-center gap-1.5 text-accent">
                      <Lightbulb size={11} /> Try this
                    </div>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-ink">{rec.tryThis}</p>
                  </div>

                  <div className="mt-5">
                    <Button onClick={() => runAction(rec)} iconAfter={<ArrowRight size={15} />}>
                      {rec.actionLabel}
                    </Button>
                  </div>
                </PanelBody>
              </Panel>
            ))}

            {/* ---------------- supporting ---------------- */}
            {supporting.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {supporting.map((rec) => (
                  <RecommendationCard key={rec.id} rec={rec} onAction={() => runAction(rec)} />
                ))}
              </div>
            ) : null}

            {/* ---------------- reinforcement ---------------- */}
            {reinforce.length ? (
              <Panel>
                <PanelHeader
                  icon={<ShieldCheck size={15} />}
                  title="What is already working"
                  description="Habits worth protecting when you are short on time."
                />
                <PanelBody className="grid gap-3 sm:grid-cols-2">
                  {reinforce.map((rec) => (
                    <div
                      key={rec.id}
                      className="rounded-xl border border-[rgba(63,207,142,0.2)] bg-good-soft px-4 py-3.5"
                    >
                      <h3 className="text-[13.5px] font-medium text-ink">{rec.title}</h3>
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">
                        {rec.evidence}
                      </p>
                      <button
                        onClick={() => runAction(rec)}
                        className="mt-2.5 inline-flex items-center gap-1 text-[12.5px] font-medium text-good transition-opacity hover:opacity-80"
                      >
                        {rec.actionLabel}
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  ))}
                </PanelBody>
              </Panel>
            ) : null}

            <Note>
              Recommendations are regenerated from your data every time analytics reload.
              Change the behaviour and the card disappears — that is the only way to clear
              one.
            </Note>

            {challengeOpen ? (
              <IndependentChallenge
                challenge={challengeForArea(user?.area)}
                onClose={() => setChallengeOpen(false)}
              />
            ) : null}
          </div>
        );
      }}
    </RequireAnalytics>
  );
}

function RecommendationCard({
  rec,
  onAction,
}: {
  rec: Recommendation;
  onAction: () => void;
}) {
  return (
    <Panel className="flex flex-col">
      <PanelBody className="flex flex-1 flex-col pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={PRIORITY_TONE[rec.priority]}>{PRIORITY_LABEL[rec.priority]}</Badge>
          <Badge tone="neutral" icon={<Timer size={11} />}>
            {rec.estimatedMinutes} min
          </Badge>
        </div>
        <h3 className="mt-3 text-[15.5px] font-medium leading-snug text-ink">{rec.title}</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{rec.why}</p>
        <div className="mt-3 rounded-lg border border-hairline bg-raised px-3.5 py-2.5">
          <div className="label-caps">Evidence</div>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">{rec.evidence}</p>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-ink">{rec.tryThis}</p>
        <div className="mt-auto pt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={onAction}
            iconAfter={<ArrowRight size={14} />}
          >
            {rec.actionLabel}
          </Button>
        </div>
      </PanelBody>
    </Panel>
  );
}
