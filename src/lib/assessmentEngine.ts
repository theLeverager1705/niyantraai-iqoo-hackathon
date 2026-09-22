import type {
  Assessment,
  AssessmentKind,
  AssessmentResponse,
  DeveloperLevel,
  Difficulty,
  Question,
  SkillDimension,
} from '@/types';
import { ADVANCED_QUESTIONS, BASELINE_QUESTIONS, PROJECT_QUESTIONS } from '@/data/questionBank';
import { mean, round, uid } from './utils';

/**
 * Adaptive assessment engine.
 *
 * The engine is deliberately legible: difficulty moves one step at a time on
 * clear thresholds, and the UI shows the transition. A developer should always
 * be able to see why the next question got harder or easier.
 */

const LADDER: Difficulty[] = ['foundational', 'intermediate', 'advanced'];

export const STEP_UP_THRESHOLD = 75;
export const STEP_DOWN_THRESHOLD = 45;

export interface SessionConfig {
  kind: AssessmentKind;
  length: number;
  startingDifficulty: Difficulty;
  /** Bias selection toward questions tagged with the project's stack. */
  preferredTags?: string[];
  projectId?: string;
}

export interface AdaptiveSession {
  id: string;
  kind: AssessmentKind;
  config: SessionConfig;
  startedAt: string;
  askedIds: string[];
  responses: AssessmentResponse[];
  difficulty: Difficulty;
  /** Difficulty before the most recent adjustment, for the UI transition. */
  previousDifficulty: Difficulty | null;
  pool: Question[];
}

export function difficultyForLevel(level: DeveloperLevel): Difficulty {
  if (level === 'beginner') return 'foundational';
  if (level === 'advanced') return 'advanced';
  return 'intermediate';
}

export function poolFor(kind: AssessmentKind): Question[] {
  if (kind === 'baseline') return [...BASELINE_QUESTIONS];
  if (kind === 'project-understanding') return [...PROJECT_QUESTIONS];
  return [...PROJECT_QUESTIONS, ...ADVANCED_QUESTIONS, ...BASELINE_QUESTIONS];
}

export function createSession(config: SessionConfig): AdaptiveSession {
  return {
    id: uid('asm'),
    kind: config.kind,
    config,
    startedAt: new Date().toISOString(),
    askedIds: [],
    responses: [],
    difficulty: config.startingDifficulty,
    previousDifficulty: null,
    pool: poolFor(config.kind),
  };
}

/** Dimensions already covered, so the engine can widen coverage. */
function coveredDimensions(session: AdaptiveSession): Set<SkillDimension> {
  const set = new Set<SkillDimension>();
  session.responses.forEach((r) => {
    const q = session.pool.find((p) => p.id === r.questionId);
    if (q) set.add(q.dimension);
  });
  return set;
}

/**
 * Rank the remaining questions. The baseline assessment walks the bank in a
 * fixed order so every developer gets the same yardstick; adaptive and
 * project assessments select on difficulty, coverage and stack relevance.
 */
export function selectNextQuestion(session: AdaptiveSession): Question | null {
  const remaining = session.pool.filter((q) => !session.askedIds.includes(q.id));
  if (!remaining.length || session.askedIds.length >= session.config.length) return null;

  if (session.kind === 'baseline') return remaining[0];

  const covered = coveredDimensions(session);
  const tags = session.config.preferredTags ?? [];
  const targetIndex = LADDER.indexOf(session.difficulty);

  const scored = remaining.map((q) => {
    const distance = Math.abs(LADDER.indexOf(q.difficulty) - targetIndex);
    let score = 100 - distance * 40;
    if (!covered.has(q.dimension)) score += 18;
    if (tags.length && q.tags?.some((t) => tags.includes(t))) score += 14;
    // Keep the format varied so the assessment does not feel like a quiz.
    const lastKind = session.responses.length
      ? session.pool.find((p) => p.id === session.responses[session.responses.length - 1].questionId)
          ?.kind
      : undefined;
    if (lastKind && q.kind === lastKind) score -= 10;
    return { q, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].q;
}

/** Adjust difficulty after an answer and report whether it moved. */
export function adjustDifficulty(
  session: AdaptiveSession,
  score: number,
): { difficulty: Difficulty; moved: 'up' | 'down' | null } {
  const index = LADDER.indexOf(session.difficulty);
  if (score >= STEP_UP_THRESHOLD && index < LADDER.length - 1) {
    return { difficulty: LADDER[index + 1], moved: 'up' };
  }
  if (score < STEP_DOWN_THRESHOLD && index > 0) {
    return { difficulty: LADDER[index - 1], moved: 'down' };
  }
  return { difficulty: session.difficulty, moved: null };
}

export function recordResponse(
  session: AdaptiveSession,
  question: Question,
  response: AssessmentResponse,
): AdaptiveSession {
  const { difficulty } = adjustDifficulty(session, response.score);
  return {
    ...session,
    askedIds: [...session.askedIds, question.id],
    responses: [...session.responses, response],
    previousDifficulty: difficulty === session.difficulty ? null : session.difficulty,
    difficulty,
  };
}

export function dimensionScores(
  session: AdaptiveSession,
): Partial<Record<SkillDimension, number>> {
  const buckets = new Map<SkillDimension, number[]>();
  session.responses.forEach((r) => {
    const q = session.pool.find((p) => p.id === r.questionId);
    if (!q) return;
    const list = buckets.get(q.dimension) ?? [];
    list.push(r.score);
    buckets.set(q.dimension, list);
  });
  const out: Partial<Record<SkillDimension, number>> = {};
  buckets.forEach((scores, dimension) => {
    out[dimension] = round(mean(scores), 1);
  });
  return out;
}

export function finaliseSession(session: AdaptiveSession): Assessment {
  return {
    id: session.id,
    kind: session.kind,
    startedAt: session.startedAt,
    completedAt: new Date().toISOString(),
    projectId: session.config.projectId,
    questionIds: session.askedIds,
    responses: session.responses,
    dimensionScores: dimensionScores(session),
    overallScore: round(mean(session.responses.map((r) => r.score)), 1),
  };
}

export function progressLabel(session: AdaptiveSession): string {
  return `Question ${Math.min(session.askedIds.length + 1, session.config.length)} / ${
    session.config.length
  }`;
}
