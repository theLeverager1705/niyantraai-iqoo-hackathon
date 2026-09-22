import type {
  Assessment,
  Project,
  ProjectUnderstanding,
  PrivacySettings,
  SkillDimension,
  User,
} from '@/types';
import type { AssessmentEvidence } from '@/lib/analyticsEngine';
import { mean, round } from '@/lib/utils';

/**
 * The seeded "Demo Mode" profile. Judges open this and land in a product that
 * already has fourteen days of history behind it.
 */

export const DEMO_USER: User = {
  id: 'usr_demo_alex',
  name: 'Alex',
  level: 'intermediate',
  area: 'web',
  tools: ['chatgpt', 'claude', 'copilot'],
  createdAt: '2026-08-11T09:00:00.000Z',
  xp: 2840,
  streakDays: 7,
  isDemo: true,
};

export const DEMO_PROJECT: Project = {
  id: 'prj_resume_analyzer',
  name: 'AI Resume Analyzer',
  stack: ['React', 'TypeScript', 'Node.js', 'Express', 'PostgreSQL', 'OpenAI API'],
  repoUrl: 'https://github.com/alexdev/ai-resume-analyzer',
};

/** Baseline result captured before the heavy AI-assisted build phase. */
export const DEMO_BASELINE_DIMENSIONS: Record<SkillDimension, number> = {
  'technical-understanding': 62,
  'problem-solving': 58,
  'code-reading': 71,
  architecture: 49,
  debugging: 66,
  conceptual: 64,
};

export const DEMO_BASELINE: Assessment = {
  id: 'asm_demo_baseline',
  kind: 'baseline',
  startedAt: '2026-08-11T09:12:00.000Z',
  completedAt: '2026-08-11T09:31:00.000Z',
  questionIds: [],
  responses: [],
  dimensionScores: DEMO_BASELINE_DIMENSIONS,
  overallScore: round(mean(Object.values(DEMO_BASELINE_DIMENSIONS)), 1),
};

export const DEMO_UNDERSTANDING: ProjectUnderstanding = {
  projectId: DEMO_PROJECT.id,
  overall: 83,
  questionsAnswered: 6,
  lastCheckedAt: '2026-09-19T18:40:00.000Z',
  areas: [
    {
      key: 'architecture',
      label: 'Architecture',
      score: 88,
      note: 'You can trace a request end to end and justify the service boundaries.',
    },
    {
      key: 'backend',
      label: 'Backend',
      score: 79,
      note: 'Middleware order is clear to you; error propagation is still fuzzy.',
    },
    {
      key: 'database',
      label: 'Database',
      score: 91,
      note: 'Strong on indexing and why your composite index column order matters.',
    },
    {
      key: 'ai-integration',
      label: 'AI Integration',
      score: 76,
      note: 'You know what the embedding call does, less so what happens when it fails.',
    },
    {
      key: 'frontend',
      label: 'Frontend',
      score: 84,
      note: 'Comfortable with render triggers and where memoisation actually helps.',
    },
  ],
};

/**
 * Evidence fed into the analytics engine.
 *
 * Project-specific understanding is weighted above the older baseline because
 * it is both more recent and about the code actually being shipped.
 */
export function deriveEvidence(
  baselineDimensions: Partial<Record<SkillDimension, number>>,
  baselineOverall: number,
  understanding: ProjectUnderstanding | null,
): AssessmentEvidence {
  const area = (key: string, fallback: number) =>
    understanding?.areas.find((a) => a.key === key)?.score ?? fallback;

  const bl = (key: SkillDimension, fallback = 55) => baselineDimensions[key] ?? fallback;

  if (!understanding) {
    return {
      overall: baselineOverall,
      codeReading: bl('code-reading'),
      debugging: bl('debugging'),
      conceptual: bl('conceptual'),
      architecture: bl('architecture'),
    };
  }

  const blend = (baselineValue: number, projectValue: number) =>
    round(0.3 * baselineValue + 0.7 * projectValue, 1);

  return {
    overall: round(0.4 * baselineOverall + 0.6 * understanding.overall, 1),
    codeReading: blend(
      bl('code-reading'),
      mean([area('backend', 70), area('frontend', 70)]),
    ),
    debugging: blend(bl('debugging'), area('backend', 70)),
    conceptual: blend(
      bl('conceptual'),
      mean([area('ai-integration', 70), area('architecture', 70)]),
    ),
    architecture: blend(bl('architecture'), area('architecture', 70)),
  };
}

export const DEMO_EVIDENCE: AssessmentEvidence = deriveEvidence(
  DEMO_BASELINE_DIMENSIONS,
  DEMO_BASELINE.overallScore,
  DEMO_UNDERSTANDING,
);

export const DEFAULT_PRIVACY: PrivacySettings = {
  aiActivityTracking: true,
  githubAccess: true,
  analyticsCollection: true,
  promptTextRetention: true,
  shareAnonymisedBenchmarks: false,
};
