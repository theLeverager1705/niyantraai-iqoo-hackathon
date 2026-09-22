import { ArrowDownRight, ArrowUpRight, CheckCircle2, Compass, Download, TriangleAlert } from 'lucide-react';
import { RequireAnalytics } from '@/components/layout/RequireAnalytics';
import { DependencyTrendChart } from '@/components/charts/UsageCharts';
import { ChartLegend } from '@/components/charts/ChartKit';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Panel, PanelBody, PanelHeader, PageHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button, LinkButton } from '@/components/ui/Button';
import { Note } from '@/components/ui/Feedback';
import { CHART_COLORS } from '@/data/taxonomy';
import { useAppState } from '@/hooks/useAppState';
import { round } from '@/lib/utils';

export function WeeklyReportPage() {
  const { exportData, user } = useAppState();

  return (
    <RequireAnalytics loadingRows={6}>
      {({ report, snapshot }) => (
        <div className="space-y-5 stack-anim">
          <PageHeader
            eyebrow={`Week of ${report.weekLabel}`}
            title="Your Developer Growth Report"
            description={report.headline}
            action={
              <Button variant="secondary" icon={<Download size={14} />} onClick={exportData}>
                Export
              </Button>
            }
          />

          {/* ---------------- headline ---------------- */}
          <Panel>
            <PanelBody className="pt-5">
              <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-10">
                <div>
                  <div className="label-caps">AI-Human Balance</div>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="num text-[46px] font-semibold leading-none text-ink">
                      {report.balance}
                    </span>
                    <span className="pb-1.5 text-[14px] text-ink-muted">/ 100</span>
                  </div>
                  <div className="mt-2.5">
                    <Badge tone={report.balanceDelta >= 0 ? 'good' : 'warn'}>
                      {report.balanceDelta >= 0 ? (
                        <ArrowUpRight size={11} />
                      ) : (
                        <ArrowDownRight size={11} />
                      )}
                      {report.balanceDelta >= 0 ? '+' : ''}
                      {round(report.balanceDelta, 1)} vs last week
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {report.metrics.slice(0, 4).map((metric) => (
                    <MetricCard key={metric.key} metric={metric} compact />
                  ))}
                </div>
              </div>
            </PanelBody>
          </Panel>

          {/* ---------------- trend ---------------- */}
          <Panel>
            <PanelHeader
              title="Dependency trend"
              description="This week against the same weekdays last week, computed per day from that day's interactions."
            />
            <PanelBody>
              <DependencyTrendChart data={report.dependencyTrend} />
              <div className="mt-4 border-t border-hairline pt-4">
                <ChartLegend
                  items={[
                    { color: CHART_COLORS.ai, label: 'This week' },
                    { color: 'rgba(255,255,255,0.32)', label: 'Last week' },
                  ]}
                />
              </div>
            </PanelBody>
          </Panel>

          {/* ---------------- what changed ---------------- */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel>
              <PanelHeader
                icon={<CheckCircle2 size={15} className="text-good" />}
                title="What improved"
              />
              <PanelBody>
                <ul className="space-y-3">
                  {report.improved.map((line) => (
                    <li
                      key={line}
                      className="flex gap-2.5 rounded-xl border border-[rgba(63,207,142,0.18)] bg-good-soft px-3.5 py-3 text-[13px] leading-relaxed text-ink"
                    >
                      <ArrowUpRight size={14} className="mt-0.5 shrink-0 text-good" />
                      {line}
                    </li>
                  ))}
                </ul>
              </PanelBody>
            </Panel>

            <Panel>
              <PanelHeader
                icon={<TriangleAlert size={15} className="text-warn" />}
                title="What needs attention"
              />
              <PanelBody>
                <ul className="space-y-3">
                  {report.needsAttention.map((line) => (
                    <li
                      key={line}
                      className="flex gap-2.5 rounded-xl border border-[rgba(240,180,41,0.18)] bg-warn-soft px-3.5 py-3 text-[13px] leading-relaxed text-ink"
                    >
                      <TriangleAlert size={14} className="mt-0.5 shrink-0 text-warn" />
                      {line}
                    </li>
                  ))}
                </ul>
              </PanelBody>
            </Panel>
          </div>

          {/* ---------------- next steps ---------------- */}
          <Panel>
            <PanelHeader
              icon={<Compass size={15} />}
              title="Recommended next steps"
              description="Three concrete moves for the coming week, ordered by impact on your weakest signal."
            />
            <PanelBody>
              <ol className="space-y-3">
                {report.nextSteps.map((step, i) => (
                  <li key={step} className="flex gap-3 rounded-xl border border-hairline bg-raised px-4 py-3.5">
                    <span className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-[12px] font-semibold text-accent">
                      {i + 1}
                    </span>
                    <span className="text-[13.5px] leading-relaxed text-ink">{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-5 flex flex-wrap gap-2">
                <LinkButton to="/app/coach" variant="primary" size="sm">
                  Open AI Coach
                </LinkButton>
                <LinkButton to="/app/assessment" variant="secondary" size="sm">
                  Take an assessment
                </LinkButton>
              </div>
            </PanelBody>
          </Panel>

          <Note>
            Report generated for {user?.name ?? 'your profile'} from{' '}
            {snapshot.totalInteractions} interactions over {snapshot.windowDays} days.
            Prototype heuristic — every number on this page traces back to a countable
            behaviour in AI Analytics.
          </Note>
        </div>
      )}
    </RequireAnalytics>
  );
}
