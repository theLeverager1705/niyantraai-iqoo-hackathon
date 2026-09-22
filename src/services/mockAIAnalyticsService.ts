import type {
  AIInteraction,
  AnalyticsSnapshot,
  PromptAnalysis,
  ProjectUnderstanding,
  Recommendation,
  WeeklyReport,
} from '@/types';
import {
  computeAnalytics,
  windowStatsFor,
  type AssessmentEvidence,
  type WindowStats,
} from '@/lib/analyticsEngine';
import { analysePrompt } from '@/lib/promptAnalyzer';
import { buildRecommendations } from '@/lib/recommendations';
import { buildWeeklyReport } from '@/lib/weeklyReport';
import { TOTAL_DAYS, dayStart } from '@/data/demoDataset';
import { usageProviders } from './providers/aiUsageProvider';
import './providers/simulatedProvider';

/**
 * Analytics service.
 *
 * Thin orchestration only: it pulls interactions from whichever usage
 * provider is active and hands them to the pure functions in lib/. Swapping
 * the provider is the entire integration story.
 */

export interface AnalyticsBundle {
  interactions: AIInteraction[];
  snapshot: AnalyticsSnapshot;
  prompts: PromptAnalysis[];
  recommendations: Recommendation[];
  report: WeeklyReport;
  /** Raw signals, surfaced in the UI so every score can be traced back. */
  stats: WindowStats;
  previousStats: WindowStats;
  sourceLabel: string;
  sourceMode: 'simulated' | 'live';
}

export async function loadInteractions(reference = new Date()): Promise<AIInteraction[]> {
  const provider = usageProviders.active;
  // Query to the end of the current day rather than "now": a partially
  // elapsed today would make every score drift with the wall clock, and the
  // demo has to read the same at 09:00 and at 23:00.
  const until = new Date(reference);
  until.setHours(23, 59, 59, 999);
  return provider.fetchInteractions({
    since: dayStart(reference, TOTAL_DAYS - 1),
    until,
  });
}

export function analysePrompts(interactions: AIInteraction[]): PromptAnalysis[] {
  return interactions
    .filter((i) => Boolean(i.promptText))
    .map((i) => analysePrompt(i.id, i.promptText as string, i.category))
    .sort((a, b) => b.score - a.score);
}

export async function loadAnalytics(
  evidence: AssessmentEvidence,
  understanding: ProjectUnderstanding | null,
  reference = new Date(),
): Promise<AnalyticsBundle> {
  const provider = usageProviders.active;
  const interactions = await loadInteractions(reference);

  const snapshot = computeAnalytics({ interactions, reference, evidence });
  const { current, previous, currentInteractions } = windowStatsFor(interactions, reference);

  const recommendations = buildRecommendations({
    stats: current,
    previous,
    snapshot,
    understanding,
  });

  const report = buildWeeklyReport({
    interactions,
    reference,
    snapshot,
    stats: current,
    previous,
    evidence,
    understanding,
  });

  return {
    interactions,
    snapshot,
    prompts: analysePrompts(currentInteractions),
    recommendations,
    report,
    stats: current,
    previousStats: previous,
    sourceLabel: provider.label,
    sourceMode: provider.mode,
  };
}
