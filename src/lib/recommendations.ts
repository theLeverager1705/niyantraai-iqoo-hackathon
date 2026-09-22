import type {
  AnalyticsSnapshot,
  ProjectUnderstanding,
  Recommendation,
} from '@/types';
import type { WindowStats } from './analyticsEngine';
import { INDEPENDENCE_BENCHMARKS } from './analyticsEngine';
import { round } from './utils';

/**
 * The coach.
 *
 * Every card is generated from the user's own numbers - no card exists unless
 * the behaviour that triggers it is present in the data, and every card states
 * the evidence that produced it. The tone is fixed by one product rule:
 * NiyantraAI never tells anyone to use AI less. It tells them where their own
 * reasoning dropped out of the loop.
 */

interface CoachInput {
  stats: WindowStats;
  previous: WindowStats;
  snapshot: AnalyticsSnapshot;
  understanding: ProjectUnderstanding | null;
}

const pctOf = (value: number) => `${Math.round(value * 100)}%`;

export function buildRecommendations(input: CoachInput): Recommendation[] {
  const { stats, previous, snapshot, understanding } = input;
  const out: Recommendation[] = [];

  if (!stats.count) return out;

  const attempts = stats.independentCount;
  const completeSolutions = stats.completeSolutionCount;

  /* ---------------- primary opportunities ---------------- */

  if (stats.attemptShare < INDEPENDENCE_BENCHMARKS.attemptShare) {
    out.push({
      id: 'rec_attempt_first',
      priority: 'primary',
      title: 'Attempt problems independently before requesting implementations',
      why: 'Attempting first is the single behaviour most correlated with being able to explain your own codebase later. It is also the cheapest to change.',
      evidence: `You requested complete solutions ${completeSolutions} times this week, while independent attempts were recorded ${attempts} times across ${stats.count} interactions (${pctOf(
        stats.attemptShare,
      )} attempt-first, healthy target ${pctOf(INDEPENDENCE_BENCHMARKS.attemptShare)}).`,
      tryThis:
        'Spend ten minutes designing the solution yourself. Then ask the assistant to critique your approach rather than generate it.',
      actionLabel: 'Start 15-minute independent challenge',
      actionKind: 'challenge',
      estimatedMinutes: 15,
      targetMetric: 'Independent Thinking',
    });
  }

  if (stats.unexamined > 0.5) {
    out.push({
      id: 'rec_read_before_accept',
      priority: 'primary',
      title: 'Read the diff before you accept it',
      why: 'Code you accept without editing is code you have not formed a model of. It ships fine and becomes unmaintainable the moment it breaks.',
      evidence: `${pctOf(
        stats.unexamined,
      )} of the suggestions you accepted this week went in unmodified. Your edit rate was ${pctOf(
        stats.modificationRate,
      )}.`,
      tryThis:
        'Before accepting, name out loud the one line you would have written differently. If you cannot find one, you have not read it yet.',
      actionLabel: 'Run a comprehension check',
      actionKind: 'assessment',
      estimatedMinutes: 8,
      targetMetric: 'Code Understanding',
    });
  }

  /* ---------------- supporting moves ---------------- */

  if (stats.explanationShare < 0.16) {
    out.push({
      id: 'rec_ask_why',
      priority: 'supporting',
      title: 'Ask for the why, not only the what',
      why: 'Explanation requests are the interactions that transfer. They are what turns a fix into something you can apply to the next problem.',
      evidence: `Only ${pctOf(
        stats.explanationShare,
      )} of your requests this week asked for an explanation or concept, against ${pctOf(
        stats.substitution,
      )} that asked for code.`,
      tryThis:
        'After any fix that works, send one more message: "Why did that work, and what would have broken if I had done it my way?"',
      actionLabel: 'Open the prompt lab',
      actionKind: 'prompt-lab',
      estimatedMinutes: 5,
      targetMetric: 'Code Understanding',
    });
  }

  if (understanding) {
    const weakest = [...understanding.areas].sort((a, b) => a.score - b.score)[0];
    if (weakest && weakest.score < 82) {
      out.push({
        id: 'rec_weak_area',
        priority: 'supporting',
        title: `${weakest.label} is your weakest area on this project`,
        why: 'A single weak area is where an outage becomes unrecoverable, because it is the part you cannot reason about under pressure.',
        evidence: `${weakest.label} scored ${weakest.score}% against a project average of ${understanding.overall}%. ${weakest.note}`,
        tryThis: `Take a short knowledge check focused on ${weakest.label.toLowerCase()} and answer from memory before opening the repository.`,
        actionLabel: 'Take a targeted check',
        actionKind: 'assessment',
        estimatedMinutes: 10,
        targetMetric: 'Project Understanding',
      });
    }
  }

  if (snapshot.metrics.promptQuality.value >= 78 && snapshot.metrics.aiDependency.value >= 60) {
    out.push({
      id: 'rec_altitude',
      priority: 'supporting',
      title: 'Your prompts are strong. The altitude is the problem',
      why: 'High prompt quality with high dependency is a specific pattern: you are very good at asking, and you are asking for finished work. The skill is real; it is pointed one level too high.',
      evidence: `Prompt quality ${round(
        snapshot.metrics.promptQuality.value,
        0,
      )}/100 while ${pctOf(
        stats.substitution,
      )} of requests asked for generation or a complete solution.`,
      tryThis:
        'Keep the same prompt structure, change the verb. "Generate X" becomes "Here is my X - where does it break?"',
      actionLabel: 'Compare your prompts',
      actionKind: 'prompt-lab',
      estimatedMinutes: 6,
      targetMetric: 'AI Dependency',
    });
  }

  /* ---------------- reinforcement ---------------- */

  if (stats.followUpRate >= 0.45) {
    out.push({
      id: 'rec_keep_followups',
      priority: 'reinforce',
      title: 'Keep asking follow-up questions',
      why: 'Follow-ups are evidence you actually read the answer. This is the habit holding your understanding score up while dependency is high.',
      evidence: `You asked a follow-up on ${pctOf(
        stats.followUpRate,
      )} of interactions this week${
        previous.count
          ? `, up from ${pctOf(previous.followUpRate)} last week`
          : ''
      }.`,
      tryThis:
        'Nothing to change. When you are short on time, the follow-up is the part worth keeping.',
      actionLabel: 'View prompt breakdown',
      actionKind: 'review',
      estimatedMinutes: 3,
      targetMetric: 'Code Understanding',
    });
  }

  if (previous.count && stats.substitution < previous.substitution) {
    const drop = round((previous.substitution - stats.substitution) * 100, 1);
    out.push({
      id: 'rec_trend_good',
      priority: 'reinforce',
      title: 'Your request mix is moving in the right direction',
      why: 'Trend matters more than any single week. A falling substitution share is the leading indicator that understanding will follow.',
      evidence: `Generation and complete-solution requests fell ${drop} points week over week (${pctOf(
        previous.substitution,
      )} to ${pctOf(stats.substitution)}), and complete-solution requests went from ${
        previous.completeSolutionCount
      } to ${completeSolutions}.`,
      tryThis: 'Hold the line for one more week before adding anything new.',
      actionLabel: 'Open weekly report',
      actionKind: 'review',
      estimatedMinutes: 4,
      targetMetric: 'AI Dependency',
    });
  }

  if (!out.some((r) => r.priority === 'primary')) {
    out.unshift({
      id: 'rec_maintain',
      priority: 'primary',
      title: 'Your balance is healthy. Raise the difficulty instead',
      why: 'When the habits are in place, the growth lever stops being restraint and becomes exposure to harder problems.',
      evidence: `Attempt-first rate ${pctOf(stats.attemptShare)} and edit rate ${pctOf(
        stats.modificationRate,
      )} are both at or above target across ${stats.count} interactions.`,
      tryThis:
        'Pick the part of your system you understand least and rebuild one piece of it without assistance.',
      actionLabel: 'Start an advanced assessment',
      actionKind: 'assessment',
      estimatedMinutes: 12,
      targetMetric: 'Architecture',
    });
  }

  const order: Record<Recommendation['priority'], number> = {
    primary: 0,
    supporting: 1,
    reinforce: 2,
  };
  return out.sort((a, b) => order[a.priority] - order[b.priority]);
}
