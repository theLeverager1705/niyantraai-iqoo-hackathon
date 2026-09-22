import type {
  AssessmentResponse,
  DeveloperLevel,
  Project,
  ProjectUnderstanding,
  Question,
  SkillDimension,
} from '@/types';
import {
  createSession,
  difficultyForLevel,
  finaliseSession,
  recordResponse,
  selectNextQuestion,
  type AdaptiveSession,
} from '@/lib/assessmentEngine';
import { llmEvaluator } from './llm/llmService';
import { round } from '@/lib/utils';
import { DIMENSION_LABELS } from '@/data/taxonomy';

/**
 * Assessment service. Wraps the pure engine with the async evaluation call so
 * the UI has one place to talk to and a real loading state to render.
 */

export function startBaseline(level: DeveloperLevel): AdaptiveSession {
  return createSession({
    kind: 'baseline',
    length: 8,
    startingDifficulty: difficultyForLevel(level),
  });
}

export function startProjectCheck(project: Project | null, level: DeveloperLevel): AdaptiveSession {
  const tags = (project?.stack ?? []).map((s) => s.toLowerCase());
  return createSession({
    kind: 'project-understanding',
    length: 5,
    startingDifficulty: difficultyForLevel(level),
    preferredTags: tags,
    projectId: project?.id,
  });
}

export function startAdaptive(
  project: Project | null,
  level: DeveloperLevel,
  length = 6,
): AdaptiveSession {
  const tags = (project?.stack ?? []).map((s) => s.toLowerCase());
  return createSession({
    kind: 'adaptive',
    length,
    startingDifficulty: difficultyForLevel(level),
    preferredTags: tags,
    projectId: project?.id,
  });
}

export function nextQuestion(session: AdaptiveSession): Question | null {
  return selectNextQuestion(session);
}

export async function submitAnswer(
  session: AdaptiveSession,
  question: Question,
  answer: string,
  secondsTaken: number,
  selectedOptionId?: string,
): Promise<{ session: AdaptiveSession; response: AssessmentResponse }> {
  const result = await llmEvaluator.evaluate(question, answer, selectedOptionId);
  const response: AssessmentResponse = {
    questionId: question.id,
    answer,
    selectedOptionId,
    score: round(result.score, 1),
    evaluatedAt: new Date().toISOString(),
    feedback: result.feedback,
    strengths: result.strengths,
    gaps: result.gaps,
    secondsTaken,
  };
  return { session: recordResponse(session, question, response), response };
}

export { finaliseSession };

/* ------------------------------------------------------------------ */
/* Turning assessment results into a project understanding profile     */
/* ------------------------------------------------------------------ */

const AREA_FROM_TAG: Record<string, string> = {
  react: 'frontend',
  typescript: 'frontend',
  frontend: 'frontend',
  express: 'backend',
  node: 'backend',
  backend: 'backend',
  database: 'database',
  postgres: 'database',
  'ai-ml': 'ai-integration',
  architecture: 'architecture',
  auth: 'backend',
  security: 'backend',
  performance: 'database',
};

const AREA_LABELS: Record<string, string> = {
  architecture: 'Architecture',
  backend: 'Backend',
  database: 'Database',
  'ai-integration': 'AI Integration',
  frontend: 'Frontend',
};

/**
 * Fold a completed session into the existing understanding profile. Existing
 * scores move toward the new evidence rather than being replaced, so a single
 * assessment nudges the profile instead of rewriting it.
 */
export function applyToUnderstanding(
  existing: ProjectUnderstanding | null,
  session: AdaptiveSession,
  projectId: string,
  questions: Question[],
): ProjectUnderstanding {
  const base: ProjectUnderstanding = existing ?? {
    projectId,
    overall: 0,
    questionsAnswered: 0,
    areas: Object.entries(AREA_LABELS).map(([key, label]) => ({
      key,
      label,
      score: 0,
      note: 'Not yet assessed.',
    })),
  };

  const byArea = new Map<string, number[]>();
  session.responses.forEach((r) => {
    const q = questions.find((item) => item.id === r.questionId);
    if (!q) return;
    const areaKey =
      q.tags?.map((t) => AREA_FROM_TAG[t]).find(Boolean) ??
      (q.dimension === 'architecture' ? 'architecture' : 'backend');
    const list = byArea.get(areaKey) ?? [];
    list.push(r.score);
    byArea.set(areaKey, list);
  });

  const areas = base.areas.map((area) => {
    const scores = byArea.get(area.key);
    if (!scores?.length) return area;
    const fresh = scores.reduce((a, b) => a + b, 0) / scores.length;
    const blended = area.score > 0 ? 0.6 * area.score + 0.4 * fresh : fresh;
    return {
      ...area,
      score: Math.round(blended),
      note:
        fresh >= 80
          ? 'Recent answers showed you can explain this part without the code in front of you.'
          : fresh >= 55
            ? 'You can describe what happens here; the why is still partly borrowed.'
            : 'Recent answers suggest this area is understood by pattern, not by mechanism.',
    };
  });

  const overall = Math.round(
    areas.reduce((acc, a) => acc + a.score, 0) / Math.max(1, areas.filter((a) => a.score > 0).length),
  );

  return {
    projectId,
    overall,
    areas,
    lastCheckedAt: new Date().toISOString(),
    questionsAnswered: base.questionsAnswered + session.responses.length,
  };
}

export function dimensionLabel(dimension: SkillDimension): string {
  return DIMENSION_LABELS[dimension];
}
