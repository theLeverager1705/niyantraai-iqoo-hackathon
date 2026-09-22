import type {
  AIInteraction,
  AITool,
  AnalyticsSnapshot,
  BalanceScore,
  CategoryBreakdown,
  DailyUsage,
  PromptCategory,
  RiskLevel,
  SkillMetric,
} from '@/types';
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  CATEGORY_TONE,
  TOOL_LABELS,
} from '@/data/taxonomy';
import { dayStart, splitByWindow, WINDOW_DAYS } from '@/data/demoDataset';
import { clamp, formatDayLabel, mean, round, sum } from './utils';
import { scorePrompt } from './promptAnalyzer';

/**
 * NiyantraAI analytics engine - PROTOTYPE HEURISTIC.
 *
 * Every score below is a transparent weighted blend of observable behaviour.
 * It is deliberately explainable rather than statistically validated: the
 * product's claim is "here is what your behaviour looks like", not "here is a
 * clinically measured cognitive assessment". The methodology strings returned
 * with each snapshot are rendered in the UI so a user can always see the rule
 * that produced their number.
 */

/* ------------------------------------------------------------------ */
/* Tunable model constants                                             */
/* ------------------------------------------------------------------ */

/** Weights for the AI Dependency composite (must total 1). */
export const DEPENDENCY_WEIGHTS = {
  handover: 0.28,
  substitution: 0.22,
  nonAttempt: 0.26,
  unexamined: 0.1,
  authorship: 0.14,
} as const;

/**
 * Healthy-band model: dependency is not linearly bad. Using AI heavily for
 * leverage is fine; the risk is the band above ~55 where the developer stops
 * reasoning, and (mildly) the band below ~20 where available leverage is
 * left unused.
 */
export const DEPENDENCY_BAND = {
  low: 20,
  high: 55,
  slopeAbove: 3.0,
  slopeBelow: 1.4,
};

/**
 * Benchmarks for the Independent Thinking composite. Each behaviour is scored
 * against a healthy target rather than a theoretical maximum, because
 * "100% of problems attempted alone first" is neither realistic nor desirable.
 */
export const INDEPENDENCE_BENCHMARKS = {
  attemptShare: 0.5,
  modificationRate: 0.58,
  followUpRate: 0.58,
  understandingSeeking: 0.4,
  manualAuthorship: 0.36,
} as const;

export const INDEPENDENCE_WEIGHTS = {
  attemptShare: 0.3,
  modificationRate: 0.18,
  followUpRate: 0.18,
  understandingSeeking: 0.18,
  manualAuthorship: 0.16,
} as const;

export const UNDERSTANDING_BENCHMARKS = {
  modificationRate: 0.58,
  followUpRate: 0.58,
  explanationShare: 0.16,
} as const;

/** Slow-moving anchor weight in the capability index used for momentum. */
export const CAPABILITY_WEIGHTS = {
  independent: 0.3,
  understanding: 0.3,
  promptQuality: 0.15,
  assessment: 0.25,
} as const;

export const BALANCE_WEIGHTS = {
  humanSkill: 0.34,
  dependencyHealth: 0.3,
  promptQuality: 0.2,
  independentThinking: 0.16,
} as const;

/* ------------------------------------------------------------------ */
/* Evidence from assessments                                           */
/* ------------------------------------------------------------------ */

export interface AssessmentEvidence {
  overall: number;
  codeReading: number;
  debugging: number;
  conceptual: number;
  architecture: number;
}

export const NEUTRAL_EVIDENCE: AssessmentEvidence = {
  overall: 55,
  codeReading: 55,
  debugging: 55,
  conceptual: 55,
  architecture: 55,
};

export interface AnalyticsInput {
  interactions: AIInteraction[];
  reference?: Date;
  evidence?: AssessmentEvidence | null;
}

/* ------------------------------------------------------------------ */
/* Window statistics                                                   */
/* ------------------------------------------------------------------ */

export interface WindowStats {
  count: number;
  handover: number;
  substitution: number;
  attemptShare: number;
  unexamined: number;
  authorship: number;
  modificationRate: number;
  followUpRate: number;
  understandingSeeking: number;
  explanationShare: number;
  manualAuthorship: number;
  generatedLines: number;
  manualLines: number;
  modifiedLines: number;
  promptQuality: number;
  analysedPrompts: number;
  completeSolutionCount: number;
  independentCount: number;
}

const ratio = (numerator: number, denominator: number) =>
  denominator > 0 ? numerator / denominator : 0;

const EMPTY_STATS: WindowStats = {
  count: 0,
  handover: 0,
  substitution: 0,
  attemptShare: 0,
  unexamined: 0,
  authorship: 0,
  modificationRate: 0,
  followUpRate: 0,
  understandingSeeking: 0,
  explanationShare: 0,
  manualAuthorship: 0,
  generatedLines: 0,
  manualLines: 0,
  modifiedLines: 0,
  promptQuality: 0,
  analysedPrompts: 0,
  completeSolutionCount: 0,
  independentCount: 0,
};

export function computeWindowStats(interactions: AIInteraction[]): WindowStats {
  const n = interactions.length;
  if (!n) return { ...EMPTY_STATS };

  const accepted = interactions.filter((i) => i.userAccepted);
  const modified = accepted.filter((i) => i.userModified);
  const generatedLines = sum(accepted.map((i) => i.generatedCode));
  const manualLines = sum(interactions.map((i) => i.manualCode));
  const modifiedLines = sum(modified.map((i) => Math.round(i.generatedCode * 0.45)));

  const isSubstitution = (c: PromptCategory) =>
    c === 'complete-solution' || c === 'code-generation';
  const isUnderstandingSeeking = (c: PromptCategory) =>
    c === 'explanation' || c === 'learning' || c === 'debugging';
  const isExplanation = (c: PromptCategory) => c === 'explanation' || c === 'learning';

  const promptScores = interactions
    .map((i) => i.promptText)
    .filter((t): t is string => Boolean(t))
    .map((t) => scorePrompt(t).score);

  return {
    count: n,
    handover: mean(interactions.map((i) => i.assistanceLevel / 5)),
    substitution: ratio(interactions.filter((i) => isSubstitution(i.category)).length, n),
    attemptShare: ratio(interactions.filter((i) => i.independentlyAttempted).length, n),
    unexamined: ratio(accepted.length - modified.length, accepted.length),
    authorship: ratio(generatedLines, generatedLines + manualLines),
    modificationRate: ratio(modified.length, accepted.length),
    followUpRate: ratio(interactions.filter((i) => i.followUpAsked).length, n),
    understandingSeeking: ratio(
      interactions.filter((i) => isUnderstandingSeeking(i.category)).length,
      n,
    ),
    explanationShare: ratio(interactions.filter((i) => isExplanation(i.category)).length, n),
    manualAuthorship: ratio(manualLines, generatedLines + manualLines),
    generatedLines,
    manualLines,
    modifiedLines,
    promptQuality: promptScores.length ? mean(promptScores) : 0,
    analysedPrompts: promptScores.length,
    completeSolutionCount: interactions.filter((i) => i.category === 'complete-solution')
      .length,
    independentCount: interactions.filter((i) => i.independentlyAttempted).length,
  };
}

/* ------------------------------------------------------------------ */
/* Composite scores                                                    */
/* ------------------------------------------------------------------ */

export function aiDependencyScore(s: WindowStats): number {
  if (!s.count) return 0;
  const w = DEPENDENCY_WEIGHTS;
  const raw =
    w.handover * s.handover +
    w.substitution * s.substitution +
    w.nonAttempt * (1 - s.attemptShare) +
    w.unexamined * s.unexamined +
    w.authorship * s.authorship;
  return clamp(round(raw * 100, 1));
}

/** Score a behaviour against a healthy benchmark, capped at 1. */
const vsBenchmark = (actual: number, benchmark: number) =>
  Math.min(1, benchmark > 0 ? actual / benchmark : 0);

export function independentThinkingScore(s: WindowStats): number {
  if (!s.count) return 0;
  const b = INDEPENDENCE_BENCHMARKS;
  const w = INDEPENDENCE_WEIGHTS;
  const raw =
    w.attemptShare * vsBenchmark(s.attemptShare, b.attemptShare) +
    w.modificationRate * vsBenchmark(s.modificationRate, b.modificationRate) +
    w.followUpRate * vsBenchmark(s.followUpRate, b.followUpRate) +
    w.understandingSeeking * vsBenchmark(s.understandingSeeking, b.understandingSeeking) +
    w.manualAuthorship * vsBenchmark(s.manualAuthorship, b.manualAuthorship);
  return clamp(round(raw * 100, 1));
}

export function behaviouralUnderstanding(s: WindowStats): number {
  if (!s.count) return 0;
  const b = UNDERSTANDING_BENCHMARKS;
  const raw =
    0.35 * vsBenchmark(s.modificationRate, b.modificationRate) +
    0.35 * vsBenchmark(s.followUpRate, b.followUpRate) +
    0.3 * vsBenchmark(s.explanationShare, b.explanationShare);
  return clamp(round(raw * 100, 1));
}

/**
 * Code Understanding blends what the developer did with what they can explain.
 * Behaviour alone can be gamed; an assessment alone is only a snapshot.
 */
export function codeUnderstandingScore(
  s: WindowStats,
  evidence: AssessmentEvidence,
): number {
  const assessed = mean([evidence.codeReading, evidence.debugging, evidence.conceptual]);
  return clamp(round(0.55 * assessed + 0.45 * behaviouralUnderstanding(s), 1));
}

export function capabilityIndex(
  independent: number,
  understanding: number,
  promptQuality: number,
  evidence: AssessmentEvidence,
): number {
  const w = CAPABILITY_WEIGHTS;
  return (
    w.independent * independent +
    w.understanding * understanding +
    w.promptQuality * promptQuality +
    w.assessment * evidence.overall
  );
}

export function dependencyHealth(dependency: number): number {
  const { low, high, slopeAbove, slopeBelow } = DEPENDENCY_BAND;
  if (dependency > high) return clamp(100 - (dependency - high) * slopeAbove);
  if (dependency < low) return clamp(100 - (low - dependency) * slopeBelow);
  return 100;
}

export function dependencyRisk(dependency: number): RiskLevel {
  if (dependency < 40) return 'healthy';
  if (dependency < 60) return 'moderate';
  if (dependency < 75) return 'elevated';
  return 'high';
}

export function balanceRisk(balance: number): RiskLevel {
  if (balance >= 70) return 'healthy';
  if (balance >= 55) return 'moderate';
  if (balance >= 42) return 'elevated';
  return 'high';
}

export const RISK_LABELS: Record<RiskLevel, string> = {
  healthy: 'Healthy',
  moderate: 'Moderate',
  elevated: 'Elevated',
  high: 'High',
};

const BALANCE_COPY: Record<RiskLevel, string> = {
  healthy:
    'AI is assisting your workflow without replacing most of your reasoning. Keep the review habits that got you here.',
  moderate:
    'You are getting real leverage from AI, but a growing share of your output arrives without you reasoning through it first.',
  elevated:
    'Most of your recent output originated outside your own reasoning. Your ability to ship is ahead of your ability to explain.',
  high: 'Your workflow currently depends on AI producing the thinking. This is recoverable, and the fastest route back is attempting before asking.',
};

export function humanSkillScore(
  understanding: number,
  independent: number,
  evidence: AssessmentEvidence,
): number {
  return clamp(round(0.45 * understanding + 0.3 * independent + 0.25 * evidence.overall, 1));
}

export function balanceScore(
  dependency: number,
  independent: number,
  understanding: number,
  promptQuality: number,
  evidence: AssessmentEvidence,
): BalanceScore {
  const human = humanSkillScore(understanding, independent, evidence);
  const health = dependencyHealth(dependency);
  const w = BALANCE_WEIGHTS;
  const value = Math.round(
    clamp(
      w.humanSkill * human +
        w.dependencyHealth * health +
        w.promptQuality * promptQuality +
        w.independentThinking * independent,
    ),
  );
  const risk = balanceRisk(value);
  return {
    value,
    risk,
    label: RISK_LABELS[risk],
    summary: BALANCE_COPY[risk],
    contributions: [
      { label: 'Human skill', value: round(human, 1), weight: w.humanSkill },
      { label: 'Dependency health', value: round(health, 1), weight: w.dependencyHealth },
      { label: 'Prompt quality', value: round(promptQuality, 1), weight: w.promptQuality },
      {
        label: 'Independent thinking',
        value: round(independent, 1),
        weight: w.independentThinking,
      },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Series builders                                                     */
/* ------------------------------------------------------------------ */

export function buildDailySeries(
  interactions: AIInteraction[],
  reference: Date,
  days = WINDOW_DAYS,
  offsetDays = 0,
): DailyUsage[] {
  const series: DailyUsage[] = [];
  for (let offset = days - 1 + offsetDays; offset >= offsetDays; offset -= 1) {
    const start = dayStart(reference, offset);
    const end = dayStart(reference, offset - 1);
    const inDay = interactions.filter((i) => {
      const t = new Date(i.timestamp).getTime();
      return t >= start.getTime() && t < end.getTime();
    });
    const stats = computeWindowStats(inDay);
    series.push({
      date: start.toISOString(),
      label: formatDayLabel(start),
      aiRequests: inDay.length,
      independentAttempts: stats.independentCount,
      generatedLines: stats.generatedLines,
      manualLines: stats.manualLines,
      completeSolutionRequests: stats.completeSolutionCount,
      debuggingRequests: inDay.filter((i) => i.category === 'debugging').length,
      explanationRequests: inDay.filter(
        (i) => i.category === 'explanation' || i.category === 'learning',
      ).length,
      dependency: Math.round(aiDependencyScore(stats)),
    });
  }
  return series;
}

export function buildCategoryBreakdown(interactions: AIInteraction[]): CategoryBreakdown[] {
  const total = interactions.length || 1;
  return CATEGORY_ORDER.map((category) => {
    const count = interactions.filter((i) => i.category === category).length;
    return {
      category,
      label: CATEGORY_LABELS[category],
      count,
      share: round((count / total) * 100, 1),
      tone: CATEGORY_TONE[category],
    };
  }).filter((c) => c.count > 0);
}

export function buildToolUsage(interactions: AIInteraction[]) {
  const map = new Map<AITool, number>();
  interactions.forEach((i) => map.set(i.tool, (map.get(i.tool) ?? 0) + 1));
  return [...map.entries()]
    .map(([tool, count]) => ({ tool, label: TOOL_LABELS[tool], count }))
    .sort((a, b) => b.count - a.count);
}

/* ------------------------------------------------------------------ */
/* Top-level snapshot                                                  */
/* ------------------------------------------------------------------ */

function metric(
  key: string,
  label: string,
  value: number,
  previous: number,
  higherIsBetter: boolean,
  description: string,
): SkillMetric {
  return {
    key,
    label,
    value: round(value, 1),
    delta: round(value - previous, 1),
    higherIsBetter,
    description,
  };
}

export const METHODOLOGY: string[] = [
  'AI Dependency = 28% handover intensity + 22% substitution requests + 26% problems not attempted first + 10% unexamined acceptance + 14% AI code authorship.',
  'Independent Thinking scores each behaviour against a healthy target (attempt-first 50%, edit rate 58%, follow-up rate 58%) instead of against perfection.',
  'Code Understanding = 55% assessment evidence + 45% observed behaviour, so a high score cannot be earned by shipping alone.',
  'AI-Human Balance = 34% human skill + 30% dependency health + 20% prompt quality + 16% independent thinking. Dependency health peaks inside a 20-55% band: using AI is not penalised, unconscious dependence is.',
  'Learning Momentum is the week-over-week change in a capability index that is deliberately anchored by your slower-moving assessment baseline, so one good week cannot spike it.',
  'Prototype heuristic. These weights are chosen to be explainable; they are not a validated psychometric instrument.',
];

export function computeAnalytics(input: AnalyticsInput): AnalyticsSnapshot {
  const reference = input.reference ?? new Date();
  const evidence = input.evidence ?? NEUTRAL_EVIDENCE;
  const { current, previous } = splitByWindow(input.interactions, reference);

  const cur = computeWindowStats(current);
  const prev = computeWindowStats(previous);

  const dependency = aiDependencyScore(cur);
  const prevDependency = aiDependencyScore(prev);

  const independent = independentThinkingScore(cur);
  const prevIndependent = independentThinkingScore(prev);

  const understanding = codeUnderstandingScore(cur, evidence);
  const prevUnderstanding = codeUnderstandingScore(prev, evidence);

  const promptQuality = cur.analysedPrompts ? cur.promptQuality : 0;
  const prevPromptQuality = prev.analysedPrompts ? prev.promptQuality : promptQuality;

  const capabilityNow = capabilityIndex(independent, understanding, promptQuality, evidence);
  const capabilityBefore = capabilityIndex(
    prevIndependent,
    prevUnderstanding,
    prevPromptQuality,
    evidence,
  );
  const momentum = prev.count ? round(capabilityNow - capabilityBefore, 1) : 0;

  const balance = balanceScore(
    dependency,
    independent,
    understanding,
    promptQuality,
    evidence,
  );

  return {
    windowDays: WINDOW_DAYS,
    totalInteractions: cur.count,
    metrics: {
      aiDependency: metric(
        'aiDependency',
        'AI Dependency',
        dependency,
        prevDependency,
        false,
        'Share of your problem-solving that was handed to an assistant rather than reasoned through first.',
      ),
      independentThinking: metric(
        'independentThinking',
        'Independent Thinking',
        independent,
        prevIndependent,
        true,
        'How often you attempt, adapt and interrogate, measured against healthy targets rather than perfection.',
      ),
      codeUnderstanding: metric(
        'codeUnderstanding',
        'Code Understanding',
        understanding,
        prevUnderstanding,
        true,
        'Blend of assessment performance and behaviour that shows you read what you shipped.',
      ),
      promptQuality: metric(
        'promptQuality',
        'Prompt Quality',
        promptQuality,
        prevPromptQuality,
        true,
        'How well your prompts keep you in the reasoning loop, scored by the Prompt Intelligence rubric.',
      ),
      learningMomentum: metric(
        'learningMomentum',
        'Learning Momentum',
        momentum,
        0,
        true,
        'Week-over-week change in your capability index, damped by your slower-moving assessment baseline.',
      ),
    },
    balance,
    daily: buildDailySeries(input.interactions, reference),
    categories: buildCategoryBreakdown(current),
    toolUsage: buildToolUsage(current),
    codeSplit: {
      generated: cur.generatedLines,
      manual: cur.manualLines,
      modified: cur.modifiedLines,
    },
    methodology: METHODOLOGY,
  };
}

/** Exposed for the weekly report and coach so they see the same raw signals. */
export function windowStatsFor(interactions: AIInteraction[], reference: Date) {
  const { current, previous } = splitByWindow(interactions, reference);
  return {
    current: computeWindowStats(current),
    previous: computeWindowStats(previous),
    currentInteractions: current,
    previousInteractions: previous,
  };
}
