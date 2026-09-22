import type { Achievement, AnalyticsSnapshot, User } from '@/types';
import type { WindowStats } from './analyticsEngine';

/**
 * Professional achievements - earned from measured behaviour, never awarded
 * for using the product. Each one has a visible progress bar against a
 * concrete threshold so it reads as a benchmark rather than a sticker.
 */

interface AchievementInput {
  user: User;
  stats: WindowStats;
  snapshot: AnalyticsSnapshot;
  assessmentsCompleted: number;
  projectUnderstanding: number | null;
}

export function buildAchievements(input: AchievementInput): Achievement[] {
  const { user, stats, snapshot, assessmentsCompleted, projectUnderstanding } = input;

  const attemptPct = Math.round(stats.attemptShare * 100);
  const editPct = Math.round(stats.modificationRate * 100);
  const explainPct = Math.round(stats.explanationShare * 100);

  const defs: Achievement[] = [
    {
      id: 'ach_independent',
      name: 'Independent Thinker',
      description: 'Attempt at least 40% of problems before opening an assistant.',
      icon: 'brain',
      progress: attemptPct,
      target: 40,
      earned: attemptPct >= 40,
    },
    {
      id: 'ach_strategist',
      name: 'AI Strategist',
      description: 'Hold an AI-Human Balance of 70 or above for a full week.',
      icon: 'compass',
      progress: snapshot.balance.value,
      target: 70,
      earned: snapshot.balance.value >= 70,
    },
    {
      id: 'ach_debug',
      name: 'Debugging Pro',
      description: 'Edit 60% of accepted suggestions instead of taking them as-is.',
      icon: 'bug',
      progress: editPct,
      target: 60,
      earned: editPct >= 60,
    },
    {
      id: 'ach_architecture',
      name: 'Architecture Explorer',
      description: 'Complete three assessments that include architecture questions.',
      icon: 'layers',
      progress: assessmentsCompleted,
      target: 3,
      earned: assessmentsCompleted >= 3,
    },
    {
      id: 'ach_prompt',
      name: 'Prompt Engineer',
      description: 'Reach an average prompt quality of 85 across a week.',
      icon: 'sparkles',
      progress: Math.round(snapshot.metrics.promptQuality.value),
      target: 85,
      earned: snapshot.metrics.promptQuality.value >= 85,
    },
    {
      id: 'ach_explainer',
      name: 'The Explainer',
      description: 'Send explanation or learning requests on 20% of interactions.',
      icon: 'message',
      progress: explainPct,
      target: 20,
      earned: explainPct >= 20,
    },
    {
      id: 'ach_understanding',
      name: 'Knows What They Shipped',
      description: 'Score 80% or higher on a project understanding check.',
      icon: 'shield',
      progress: Math.round(projectUnderstanding ?? 0),
      target: 80,
      earned: (projectUnderstanding ?? 0) >= 80,
    },
    {
      id: 'ach_streak',
      name: 'Consistency',
      description: 'Maintain a 7-day independent thinking streak.',
      icon: 'flame',
      progress: user.streakDays,
      target: 7,
      earned: user.streakDays >= 7,
    },
  ];

  return defs.map((a) => ({
    ...a,
    progress: Math.max(0, a.progress),
    earnedAt: a.earned ? new Date().toISOString() : undefined,
  }));
}

/**
 * XP is derived, not stored as a running total, so it can never drift out of
 * sync with the behaviour that earned it.
 */
export function computeXp(stats: WindowStats, assessmentsCompleted: number): number {
  const base = 200;
  const attempts = stats.independentCount * 36;
  const followUps = Math.round(stats.followUpRate * stats.count) * 16;
  const explanations = Math.round(stats.explanationShare * stats.count) * 22;
  const assessments = assessmentsCompleted * 180;
  const edits = Math.round(stats.modificationRate * stats.count) * 10;
  return base + attempts + followUps + explanations + assessments + edits;
}
