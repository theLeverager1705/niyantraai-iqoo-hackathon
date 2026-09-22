import { useState } from 'react';
import { Activity, Code2, Layers3, PieChart } from 'lucide-react';
import { RequireAnalytics } from '@/components/layout/RequireAnalytics';
import {
  AuthorshipChart,
  CategoryChart,
  RequestMixChart,
  UsageTrendChart,
} from '@/components/charts/UsageCharts';
import { ChartLegend } from '@/components/charts/ChartKit';
import { Panel, PanelBody, PanelHeader, PageHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Note } from '@/components/ui/Feedback';
import { ProgressBar } from '@/components/ui/Progress';
import { SegmentedControl } from '@/components/ui/Form';
import { CATEGORY_TONE, CHART_COLORS, TONE_COLOR } from '@/data/taxonomy';
import type { WindowStats } from '@/lib/analyticsEngine';
import { round } from '@/lib/utils';

type View = 'usage' | 'mix' | 'authorship';

const VIEWS: { value: View; label: string }[] = [
  { value: 'usage', label: 'Requests' },
  { value: 'mix', label: 'Request type' },
  { value: 'authorship', label: 'Authorship' },
];

/** Every raw signal that feeds a score, with its week-over-week movement. */
function SignalRow({
  label,
  value,
  previous,
  format = 'percent',
  hint,
}: {
  label: string;
  value: number;
  previous: number;
  format?: 'percent' | 'count';
  hint: string;
}) {
  const display =
    format === 'percent' ? `${Math.round(value * 100)}%` : `${Math.round(value)}`;
  const deltaRaw = format === 'percent' ? (value - previous) * 100 : value - previous;
  const delta = round(deltaRaw, 1);

  return (
    <div className="flex items-start justify-between gap-4 border-b border-hairline py-3 last:border-0">
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-ink">{label}</div>
        <div className="mt-0.5 text-[12px] leading-relaxed text-ink-faint">{hint}</div>
      </div>
      <div className="shrink-0 text-right">
        <div className="num text-[14px] font-medium text-ink">{display}</div>
        <div
          className={`num text-[11.5px] ${
            Math.abs(delta) < 0.05
              ? 'text-ink-faint'
              : delta > 0
                ? 'text-good'
                : 'text-warn'
          }`}
        >
          {Math.abs(delta) < 0.05 ? 'no change' : `${delta > 0 ? '+' : ''}${delta}`}
        </div>
      </div>
    </div>
  );
}

function RawSignals({ stats, previous }: { stats: WindowStats; previous: WindowStats }) {
  return (
    <div>
      <SignalRow
        label="Handover intensity"
        hint="Average assistance level across every request, where 5 means the assistant produced the whole artefact."
        value={stats.handover}
        previous={previous.handover}
      />
      <SignalRow
        label="Substitution share"
        hint="Requests that asked for generation or a complete solution."
        value={stats.substitution}
        previous={previous.substitution}
      />
      <SignalRow
        label="Attempted first"
        hint="Problems you worked on before opening an assistant."
        value={stats.attemptShare}
        previous={previous.attemptShare}
      />
      <SignalRow
        label="Edit rate"
        hint="Accepted suggestions you changed before keeping."
        value={stats.modificationRate}
        previous={previous.modificationRate}
      />
      <SignalRow
        label="Follow-up rate"
        hint="Requests followed by a clarifying question, evidence the answer was read."
        value={stats.followUpRate}
        previous={previous.followUpRate}
      />
      <SignalRow
        label="AI code authorship"
        hint="Share of lines this week that came from the assistant rather than your keyboard."
        value={stats.authorship}
        previous={previous.authorship}
      />
      <SignalRow
        label="Complete-solution requests"
        hint="Count of requests for a finished implementation."
        value={stats.completeSolutionCount}
        previous={previous.completeSolutionCount}
        format="count"
      />
      <SignalRow
        label="Independent attempts"
        hint="Count of problems attempted before asking."
        value={stats.independentCount}
        previous={previous.independentCount}
        format="count"
      />
    </div>
  );
}

export function Analytics() {
  const [view, setView] = useState<View>('usage');

  return (
    <RequireAnalytics loadingRows={6}>
      {({ snapshot, stats, previousStats, sourceMode }) => {
        const { codeSplit } = snapshot;
        const totalLines = codeSplit.generated + codeSplit.manual;
        const generatedShare = totalLines ? (codeSplit.generated / totalLines) * 100 : 0;

        return (
          <div className="space-y-5 stack-anim">
            <PageHeader
              eyebrow="Last 7 days"
              title="AI Dependency Analytics"
              description="The raw behaviour behind every score. Nothing here is a black box — each signal is countable, and each one feeds a weight you can read."
              action={
                <Badge tone="neutral">
                  {snapshot.totalInteractions} interactions
                </Badge>
              }
            />

            {/* ---------------- main chart ---------------- */}
            <Panel>
              <PanelHeader
                icon={<Activity size={15} />}
                title="Activity over the week"
                description={
                  view === 'usage'
                    ? 'AI requests against problems you attempted before asking.'
                    : view === 'mix'
                      ? 'What kind of help you asked for, day by day.'
                      : 'Lines the assistant produced against lines you wrote by hand.'
                }
                action={
                  <SegmentedControl
                    value={view}
                    options={VIEWS}
                    onChange={setView}
                    ariaLabel="Chart view"
                  />
                }
              />
              <PanelBody>
                {view === 'usage' ? <UsageTrendChart data={snapshot.daily} /> : null}
                {view === 'mix' ? <RequestMixChart data={snapshot.daily} /> : null}
                {view === 'authorship' ? <AuthorshipChart data={snapshot.daily} /> : null}

                <div className="mt-4 border-t border-hairline pt-4">
                  <ChartLegend
                    items={
                      view === 'usage'
                        ? [
                            { color: CHART_COLORS.ai, label: 'AI requests' },
                            { color: CHART_COLORS.human, label: 'Attempted first' },
                          ]
                        : view === 'mix'
                          ? [
                              { color: CHART_COLORS.warn, label: 'Complete solution' },
                              { color: CHART_COLORS.ai, label: 'Debugging' },
                              { color: CHART_COLORS.human, label: 'Explanation' },
                            ]
                          : [
                              { color: CHART_COLORS.ai, label: 'AI generated' },
                              { color: CHART_COLORS.human, label: 'Written by hand' },
                            ]
                    }
                  />
                </div>
              </PanelBody>
            </Panel>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* ---------------- categories ---------------- */}
              <Panel>
                <PanelHeader
                  icon={<PieChart size={15} />}
                  title="What you asked for"
                  description="Categories coloured by how they tend to affect understanding."
                />
                <PanelBody>
                  <CategoryChart data={snapshot.categories} />
                  <div className="mt-4 space-y-2 border-t border-hairline pt-4">
                    {snapshot.categories
                      .slice()
                      .sort((a, b) => b.count - a.count)
                      .map((c) => (
                        <div key={c.category} className="flex items-center gap-3">
                          <span
                            aria-hidden
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: TONE_COLOR[c.tone] }}
                          />
                          <span className="flex-1 truncate text-[12.5px] text-ink-muted">
                            {c.label}
                          </span>
                          <span className="num text-[12.5px] text-ink">{c.share}%</span>
                          <span className="w-16">
                            <ProgressBar
                              value={c.share}
                              tone={
                                CATEGORY_TONE[c.category] === 'good'
                                  ? 'good'
                                  : CATEGORY_TONE[c.category] === 'watch'
                                    ? 'warn'
                                    : 'accent'
                              }
                            />
                          </span>
                        </div>
                      ))}
                  </div>
                </PanelBody>
              </Panel>

              {/* ---------------- authorship + tools ---------------- */}
              <div className="space-y-4">
                <Panel>
                  <PanelHeader
                    icon={<Code2 size={15} />}
                    title="Code authorship"
                    description="Accepted AI output against code you typed, over the same seven days."
                  />
                  <PanelBody>
                    <div className="flex items-end gap-2">
                      <span className="num text-[32px] font-semibold leading-none text-ink">
                        {Math.round(generatedShare)}%
                      </span>
                      <span className="pb-1 text-[13px] text-ink-muted">
                        of lines came from an assistant
                      </span>
                    </div>
                    <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full transition-[width] duration-700"
                        style={{
                          width: `${generatedShare}%`,
                          backgroundColor: CHART_COLORS.ai,
                        }}
                      />
                      <div
                        className="h-full flex-1 transition-[width] duration-700"
                        style={{ backgroundColor: CHART_COLORS.human }}
                      />
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {[
                        { label: 'AI generated', value: codeSplit.generated, color: CHART_COLORS.ai },
                        { label: 'Hand written', value: codeSplit.manual, color: CHART_COLORS.human },
                        { label: 'Edited by you', value: codeSplit.modified, color: CHART_COLORS.warn },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-xl border border-hairline bg-raised px-3 py-2.5"
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              aria-hidden
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-[11px] text-ink-faint">{item.label}</span>
                          </div>
                          <div className="num mt-1 text-[16px] font-medium text-ink">
                            {item.value.toLocaleString()}
                          </div>
                          <div className="text-[10.5px] text-ink-faint">lines</div>
                        </div>
                      ))}
                    </div>
                  </PanelBody>
                </Panel>

                <Panel>
                  <PanelHeader
                    icon={<Layers3 size={15} />}
                    title="Assistants used"
                    description="Where this week's requests went."
                  />
                  <PanelBody>
                    <div className="space-y-3">
                      {snapshot.toolUsage.map((tool) => {
                        const share = (tool.count / Math.max(1, snapshot.totalInteractions)) * 100;
                        return (
                          <div key={tool.tool}>
                            <div className="mb-1.5 flex items-baseline justify-between gap-2">
                              <span className="text-[13px] text-ink">{tool.label}</span>
                              <span className="num text-[12.5px] text-ink-muted">
                                {tool.count} · {Math.round(share)}%
                              </span>
                            </div>
                            <ProgressBar value={share} tone="accent" />
                          </div>
                        );
                      })}
                    </div>
                  </PanelBody>
                </Panel>
              </div>
            </div>

            {/* ---------------- raw signals ---------------- */}
            <Panel>
              <PanelHeader
                title="Raw signals"
                description="Every input to the scoring model, with its change since last week. These are the numbers the weights are applied to."
              />
              <PanelBody>
                <RawSignals stats={stats} previous={previousStats} />
              </PanelBody>
            </Panel>

            <Panel>
              <PanelHeader title="How these scores are produced" />
              <PanelBody>
                <ul className="space-y-2.5 text-[12.5px] leading-relaxed text-ink-muted">
                  {snapshot.methodology.map((line) => (
                    <li key={line} className="flex gap-2.5">
                      <span
                        aria-hidden
                        className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-faint"
                      />
                      {line}
                    </li>
                  ))}
                </ul>
              </PanelBody>
            </Panel>

            {sourceMode === 'simulated' ? (
              <Note>
                This activity feed is <strong>simulated demo data</strong> generated from a
                fixed seed, so the same numbers appear on every machine. The analytics
                engine running over it is the real one.
              </Note>
            ) : null}
          </div>
        );
      }}
    </RequireAnalytics>
  );
}
