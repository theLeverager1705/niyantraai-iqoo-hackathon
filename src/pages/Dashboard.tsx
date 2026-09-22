import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Activity,
  Flame,
  FlaskConical,
  Sparkles,
  Target,
  TrendingDown,
  Zap,
} from 'lucide-react';
import { useAppState } from '@/hooks/useAppState';
import { RequireAnalytics } from '@/components/layout/RequireAnalytics';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { UsageTrendChart } from '@/components/charts/UsageCharts';
import { ChartLegend } from '@/components/charts/ChartKit';
import { Badge } from '@/components/ui/Badge';
import { LinkButton } from '@/components/ui/Button';
import { Panel, PanelBody, PanelHeader } from '@/components/ui/Card';
import { Note } from '@/components/ui/Feedback';
import { ProgressBar } from '@/components/ui/Progress';
import { CHART_COLORS } from '@/data/taxonomy';
import { greeting, round } from '@/lib/utils';

export function Dashboard() {
  const { user, project, understanding, xp, achievements } = useAppState();
  const earned = achievements.filter((a) => a.earned);

  return (
    <RequireAnalytics loadingRows={5}>
      {({ snapshot, recommendations, sourceLabel, sourceMode }) => {
        const dep = snapshot.metrics.aiDependency;
        const topRec = recommendations[0];

        return (
          <div className="space-y-5 stack-anim">
            {/* ---------------- greeting ---------------- */}
            <header className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-[24px] font-semibold tracking-[-0.025em] text-ink sm:text-[28px]">
                  {greeting()}, {user?.name ?? 'Developer'} <span aria-hidden>👋</span>
                </h1>
                <p className="mt-1.5 text-[14px] text-ink-muted">
                  Here's how you're working with AI today.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {sourceMode === 'simulated' ? (
                  <Badge tone="accent" icon={<FlaskConical size={11} />} title={sourceLabel}>
                    {sourceLabel}
                  </Badge>
                ) : null}
                <Badge tone="neutral" icon={<Zap size={11} />}>
                  {xp.toLocaleString()} XP
                </Badge>
                {user?.streakDays ? (
                  <Badge tone="warn" icon={<Flame size={11} />}>
                    {user.streakDays}-day streak
                  </Badge>
                ) : null}
              </div>
            </header>

            {/* ---------------- balance ---------------- */}
            <BalanceCard
              balance={snapshot.balance}
              dependency={dep.value}
              methodology={snapshot.methodology}
            />

            {/* ---------------- metrics ---------------- */}
            <section
              aria-label="Key metrics"
              className="grid grid-cols-2 gap-3 lg:grid-cols-5"
            >
              <MetricCard metric={snapshot.metrics.aiDependency} />
              <MetricCard metric={snapshot.metrics.independentThinking} />
              <MetricCard metric={snapshot.metrics.codeUnderstanding} />
              <MetricCard metric={snapshot.metrics.promptQuality} />
              <MetricCard
                metric={snapshot.metrics.learningMomentum}
                suffix=" pts"
                showBar={false}
              />
            </section>

            {/* ---------------- usage + recommendation ---------------- */}
            <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
              <Panel>
                <PanelHeader
                  icon={<Activity size={15} />}
                  title="Seven-day AI usage"
                  description={`${snapshot.totalInteractions} interactions across ${snapshot.toolUsage.length} assistants.`}
                  action={
                    <LinkButton
                      to="/app/analytics"
                      variant="ghost"
                      size="sm"
                      iconAfter={<ArrowRight size={14} />}
                    >
                      Details
                    </LinkButton>
                  }
                />
                <PanelBody>
                  <UsageTrendChart data={snapshot.daily} />
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
                    <ChartLegend
                      items={[
                        { color: CHART_COLORS.ai, label: 'AI requests' },
                        { color: CHART_COLORS.human, label: 'Attempted first' },
                      ]}
                    />
                    {dep.delta < 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-good">
                        <TrendingDown size={13} />
                        AI dependency decreased {Math.abs(dep.delta)} points this week
                      </span>
                    ) : (
                      <span className="text-[12.5px] text-ink-muted">
                        Dependency held steady week over week
                      </span>
                    )}
                  </div>
                </PanelBody>
              </Panel>

              <div className="space-y-4">
                {topRec ? (
                  <Panel>
                    <PanelHeader
                      icon={<Sparkles size={15} />}
                      title="Today's recommendation"
                    />
                    <PanelBody>
                      <h3 className="text-[15px] font-medium leading-snug text-ink">
                        {topRec.title}
                      </h3>
                      <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
                        {topRec.evidence}
                      </p>
                      <div className="mt-4 rounded-xl border border-accent-line bg-accent-soft px-3.5 py-3">
                        <div className="label-caps text-accent">Try this</div>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-ink">
                          {topRec.tryThis}
                        </p>
                      </div>
                      <LinkButton
                        to="/app/coach"
                        variant="secondary"
                        size="sm"
                        className="mt-4 w-full"
                        iconAfter={<ArrowRight size={14} />}
                      >
                        Open AI Coach
                      </LinkButton>
                    </PanelBody>
                  </Panel>
                ) : null}

                {understanding ? (
                  <Panel>
                    <PanelHeader
                      icon={<Target size={15} />}
                      title="Project understanding"
                      description={project?.name}
                    />
                    <PanelBody>
                      <div className="flex items-end gap-2">
                        <span className="num text-[30px] font-semibold leading-none text-ink">
                          {understanding.overall}
                        </span>
                        <span className="pb-1 text-[13px] text-ink-muted">% understood</span>
                      </div>
                      <div className="mt-4 space-y-2.5">
                        {[...understanding.areas]
                          .sort((a, b) => a.score - b.score)
                          .slice(0, 3)
                          .map((area) => (
                            <div key={area.key}>
                              <div className="mb-1 flex items-baseline justify-between gap-2">
                                <span className="text-[12.5px] text-ink-muted">
                                  {area.label}
                                </span>
                                <span className="num text-[12.5px] text-ink">
                                  {area.score}%
                                </span>
                              </div>
                              <ProgressBar
                                value={area.score}
                                tone={area.score >= 80 ? 'good' : 'warn'}
                              />
                            </div>
                          ))}
                      </div>
                      <LinkButton
                        to="/app/project"
                        variant="secondary"
                        size="sm"
                        className="mt-4 w-full"
                        iconAfter={<ArrowRight size={14} />}
                      >
                        Test your understanding
                      </LinkButton>
                    </PanelBody>
                  </Panel>
                ) : (
                  <Panel>
                    <PanelHeader
                      icon={<Target size={15} />}
                      title="No project connected"
                      description="Add a repository to unlock project-specific understanding checks."
                    />
                    <PanelBody>
                      <LinkButton to="/app/integrations" variant="secondary" size="sm" className="w-full">
                        Connect a repository
                      </LinkButton>
                    </PanelBody>
                  </Panel>
                )}
              </div>
            </div>

            {/* ---------------- achievements strip ---------------- */}
            <Panel>
              <PanelHeader
                title="Recent achievements"
                description={`${earned.length} of ${achievements.length} benchmarks met from this week's behaviour.`}
                action={
                  <LinkButton
                    to="/app/achievements"
                    variant="ghost"
                    size="sm"
                    iconAfter={<ArrowRight size={14} />}
                  >
                    All
                  </LinkButton>
                }
              />
              <PanelBody>
                <div className="flex flex-wrap gap-2">
                  {achievements.slice(0, 6).map((a) => (
                    <span
                      key={a.id}
                      title={a.description}
                      className={
                        a.earned
                          ? 'inline-flex items-center gap-1.5 rounded-full border border-[rgba(63,207,142,0.3)] bg-good-soft px-3 py-1.5 text-[12px] font-medium text-good'
                          : 'inline-flex items-center gap-1.5 rounded-full border border-hairline bg-raised px-3 py-1.5 text-[12px] text-ink-faint'
                      }
                    >
                      {a.name}
                      <span className="tabular-nums opacity-70">
                        {Math.min(a.progress, a.target)}/{a.target}
                      </span>
                    </span>
                  ))}
                </div>
              </PanelBody>
            </Panel>

            <Note tone="info">
              All scores on this page are a <strong>prototype heuristic</strong> —
              transparent weighted blends of observable behaviour, not a validated
              psychometric instrument. Open{' '}
              <Link to="/app/analytics" className="text-accent underline-offset-2 hover:underline">
                AI Analytics
              </Link>{' '}
              to see the raw signals behind every number.
              {sourceMode === 'simulated'
                ? ' AI activity in this prototype is simulated demo data.'
                : ''}
            </Note>

            <p className="pb-2 text-center text-[12px] text-ink-faint">
              Balance {round(snapshot.balance.value, 0)}/100 · Dependency{' '}
              {round(dep.value, 0)}% · {snapshot.totalInteractions} interactions analysed
            </p>
          </div>
        );
      }}
    </RequireAnalytics>
  );
}
