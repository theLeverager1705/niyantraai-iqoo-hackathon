import type {
  AIInteraction,
  AnalyticsSnapshot,
  ProjectUnderstanding,
  WeeklyReport,
} from '@/types';
import type { AssessmentEvidence, WindowStats } from './analyticsEngine';
import {
  aiDependencyScore,
  balanceScore,
  buildDailySeries,
  codeUnderstandingScore,
  independentThinkingScore,
} from './analyticsEngine';
import { WINDOW_DAYS } from '@/data/demoDataset';
import { round } from './utils';

interface ReportInput {
  interactions: AIInteraction[];
  reference: Date;
  snapshot: AnalyticsSnapshot;
  stats: WindowStats;
  previous: WindowStats;
  evidence: AssessmentEvidence;
  understanding: ProjectUnderstanding | null;
}

const pctOf = (value: number) => `${Math.round(value * 100)}%`;

function weekLabel(reference: Date): string {
  const end = new Date(reference);
  const start = new Date(reference);
  start.setDate(start.getDate() - (WINDOW_DAYS - 1));
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} - ${fmt(end)}`;
}

export function buildWeeklyReport(input: ReportInput): WeeklyReport {
  const { snapshot, stats, previous, evidence, understanding, interactions, reference } = input;

  const improved: string[] = [];
  const needsAttention: string[] = [];
  const nextSteps: string[] = [];

  const dep = snapshot.metrics.aiDependency;
  const ind = snapshot.metrics.independentThinking;
  const und = snapshot.metrics.codeUnderstanding;
  const pq = snapshot.metrics.promptQuality;

  /* ---------------- what improved ---------------- */

  if (dep.delta < 0) {
    improved.push(
      `AI dependency fell ${Math.abs(dep.delta)} points, from ${round(
        dep.value - dep.delta,
        0,
      )}% to ${round(dep.value, 0)}%.`,
    );
  }
  if (previous.completeSolutionCount > stats.completeSolutionCount) {
    const drop = Math.round(
      ((previous.completeSolutionCount - stats.completeSolutionCount) /
        previous.completeSolutionCount) *
        100,
    );
    improved.push(
      `You reduced complete-solution prompts by ${drop}% (${previous.completeSolutionCount} to ${stats.completeSolutionCount}).`,
    );
  }
  if (ind.delta > 0) {
    improved.push(
      `Independent thinking rose ${ind.delta} points, driven by an attempt-first rate of ${pctOf(
        stats.attemptShare,
      )} against ${pctOf(previous.attemptShare)} last week.`,
    );
  }
  if (pq.delta > 0) {
    improved.push(`Prompt quality improved ${round(pq.delta, 0)} points to ${round(pq.value, 0)}/100.`);
  }
  if (stats.modificationRate > previous.modificationRate) {
    improved.push(
      `You edited ${pctOf(stats.modificationRate)} of accepted suggestions, up from ${pctOf(
        previous.modificationRate,
      )}.`,
    );
  }

  /* ---------------- what needs attention ---------------- */

  if (dep.value >= 60) {
    needsAttention.push(
      `Dependency is still ${round(dep.value, 0)}%, above the ${55}% point where output starts outpacing understanding.`,
    );
  }
  if (stats.substitution > 0.5) {
    needsAttention.push(
      `${pctOf(
        stats.substitution,
      )} of requests asked for generation or a complete solution. That is where the remaining risk sits.`,
    );
  }
  if (understanding) {
    const weakest = [...understanding.areas].sort((a, b) => a.score - b.score)[0];
    if (weakest) {
      needsAttention.push(
        `${weakest.label} understanding remains your weakest area at ${weakest.score}%.`,
      );
    }
  }
  if (evidence.architecture < 70) {
    needsAttention.push(
      `Architecture scored ${round(
        evidence.architecture,
        0,
      )}% in assessment, the lowest of your measured dimensions.`,
    );
  }
  if (stats.unexamined > 0.5) {
    needsAttention.push(
      `${pctOf(stats.unexamined)} of accepted code went in unmodified and unreviewed.`,
    );
  }

  /* ---------------- next steps ---------------- */

  nextSteps.push(
    'Run one independent challenge before your next build session - design first, then ask for critique.',
  );
  if (understanding) {
    const weakest = [...understanding.areas].sort((a, b) => a.score - b.score)[0];
    nextSteps.push(
      `Take a targeted knowledge check on ${weakest.label.toLowerCase()} and answer from memory before opening the repo.`,
    );
  }
  nextSteps.push(
    'Convert two "generate this" prompts into "here is mine, where does it break?" prompts.',
  );

  const previousBalance = balanceScore(
    aiDependencyScore(previous),
    independentThinkingScore(previous),
    codeUnderstandingScore(previous, evidence),
    previous.analysedPrompts ? previous.promptQuality : snapshot.metrics.promptQuality.value,
    evidence,
  ).value;

  const currentSeries = buildDailySeries(interactions, reference, WINDOW_DAYS, 0);
  const previousSeries = buildDailySeries(interactions, reference, WINDOW_DAYS, WINDOW_DAYS);

  const headline =
    dep.delta < 0 && und.delta > 0
      ? 'You shipped less AI-authored code and understood more of what you shipped.'
      : dep.delta < 0
        ? 'Dependency is trending down. Understanding has not caught up yet.'
        : und.delta > 0
          ? 'Understanding is climbing even though your AI usage held steady.'
          : 'A steady week. The habits are holding, the mix has not moved yet.';

  return {
    id: `rep_${reference.toISOString().slice(0, 10)}`,
    weekLabel: weekLabel(reference),
    generatedAt: new Date().toISOString(),
    headline,
    balance: snapshot.balance.value,
    balanceDelta: round(snapshot.balance.value - previousBalance, 1),
    metrics: [dep, ind, und, pq, snapshot.metrics.learningMomentum],
    improved: improved.length ? improved : ['No measurable improvement recorded this week.'],
    needsAttention: needsAttention.length
      ? needsAttention
      : ['Nothing flagged. Your behaviour sits inside every healthy band this week.'],
    nextSteps,
    dependencyTrend: currentSeries.map((d, i) => ({
      day: d.label,
      current: d.dependency,
      previous: previousSeries[i]?.dependency ?? 0,
    })),
  };
}
