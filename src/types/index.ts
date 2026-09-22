/**
 * NiyantraAI - core domain model.
 *
 * Everything the product reasons about is expressed here so that the
 * simulated providers used by the prototype can later be swapped for real
 * integrations (ChatGPT / Claude / Copilot / Cursor / GitHub) without the
 * analytics, assessment or coaching layers changing at all.
 */

/* ------------------------------------------------------------------ */
/* People and projects                                                 */
/* ------------------------------------------------------------------ */

export type DeveloperLevel = 'beginner' | 'intermediate' | 'advanced';

export type DevelopmentArea =
  | 'web'
  | 'ai-ml'
  | 'data-science'
  | 'mobile'
  | 'backend'
  | 'other';

export type AITool =
  | 'chatgpt'
  | 'claude'
  | 'gemini'
  | 'copilot'
  | 'cursor'
  | 'other';

export interface User {
  id: string;
  name: string;
  level: DeveloperLevel;
  area: DevelopmentArea;
  tools: AITool[];
  createdAt: string;
  xp: number;
  streakDays: number;
  /** true when the profile was loaded from the seeded demo dataset */
  isDemo: boolean;
}

export interface Project {
  id: string;
  name: string;
  stack: string[];
  repoUrl?: string;
  /** Populated by the (simulated) repository analyser. */
  analysis?: RepoAnalysis;
}

/* ------------------------------------------------------------------ */
/* AI activity                                                         */
/* ------------------------------------------------------------------ */

export type PromptCategory =
  | 'learning'
  | 'debugging'
  | 'code-generation'
  | 'architecture'
  | 'explanation'
  | 'complete-solution'
  | 'optimization';

/**
 * How much of the thinking was handed over.
 * 1 = developer reasoned and AI reviewed, 5 = AI produced the whole artefact.
 */
export type AssistanceLevel = 1 | 2 | 3 | 4 | 5;

export interface AIInteraction {
  id: string;
  timestamp: string;
  tool: AITool;
  category: PromptCategory;
  promptText?: string;
  promptLength: number;
  assistanceLevel: AssistanceLevel;
  /** Did the developer try the problem before opening the assistant? */
  independentlyAttempted: boolean;
  /** Lines of code the assistant produced. */
  generatedCode: number;
  /** Lines written by hand in the same working session. */
  manualCode: number;
  userAccepted: boolean;
  userModified: boolean;
  /** A follow-up question is evidence the answer was actually read. */
  followUpAsked: boolean;
  sessionMinutes: number;
}

export interface PromptSignal {
  label: string;
  weight: number;
  present: boolean;
  hint: string;
}

export interface PromptAnalysis {
  id: string;
  interactionId: string;
  text: string;
  category: PromptCategory;
  /** 0-100, see lib/promptAnalyzer.ts for the transparent rubric. */
  score: number;
  verdict: 'strong' | 'solid' | 'risky';
  signals: PromptSignal[];
  rationale: string;
}

/* ------------------------------------------------------------------ */
/* Assessment                                                          */
/* ------------------------------------------------------------------ */

export type QuestionKind =
  | 'multiple-choice'
  | 'debugging'
  | 'code-comprehension'
  | 'architecture'
  | 'short-answer';

export type Difficulty = 'foundational' | 'intermediate' | 'advanced';

export type SkillDimension =
  | 'technical-understanding'
  | 'problem-solving'
  | 'code-reading'
  | 'architecture'
  | 'debugging'
  | 'conceptual';

export interface Question {
  id: string;
  kind: QuestionKind;
  difficulty: Difficulty;
  dimension: SkillDimension;
  prompt: string;
  context?: string;
  code?: string;
  language?: string;
  options?: { id: string; label: string }[];
  correctOptionId?: string;
  /** Concepts an acceptable free-text answer should touch. */
  expectedConcepts?: string[];
  /** Phrases that, if present, indicate a misconception. */
  misconceptions?: string[];
  modelAnswer?: string;
  /** Used to pick project-specific questions. */
  tags?: string[];
}

export interface AssessmentResponse {
  questionId: string;
  answer: string;
  selectedOptionId?: string;
  /** 0-100 */
  score: number;
  evaluatedAt: string;
  feedback: string;
  strengths: string[];
  gaps: string[];
  secondsTaken: number;
}

export type AssessmentKind = 'baseline' | 'project-understanding' | 'adaptive';

export interface Assessment {
  id: string;
  kind: AssessmentKind;
  startedAt: string;
  completedAt?: string;
  projectId?: string;
  questionIds: string[];
  responses: AssessmentResponse[];
  dimensionScores: Partial<Record<SkillDimension, number>>;
  overallScore: number;
}

/* ------------------------------------------------------------------ */
/* Analytics output                                                    */
/* ------------------------------------------------------------------ */

export interface SkillMetric {
  key: string;
  label: string;
  value: number;
  /** percentage-point change versus the previous window */
  delta: number;
  /** does a higher number mean a better outcome? */
  higherIsBetter: boolean;
  description: string;
}

export type RiskLevel = 'healthy' | 'moderate' | 'elevated' | 'high';

export interface BalanceScore {
  value: number;
  risk: RiskLevel;
  label: string;
  summary: string;
  contributions: { label: string; value: number; weight: number }[];
}

export interface DailyUsage {
  date: string;
  label: string;
  aiRequests: number;
  independentAttempts: number;
  generatedLines: number;
  manualLines: number;
  completeSolutionRequests: number;
  debuggingRequests: number;
  explanationRequests: number;
  dependency: number;
}

export interface CategoryBreakdown {
  category: PromptCategory;
  label: string;
  count: number;
  share: number;
  tone: 'good' | 'neutral' | 'watch';
}

export interface AnalyticsSnapshot {
  windowDays: number;
  totalInteractions: number;
  metrics: {
    aiDependency: SkillMetric;
    independentThinking: SkillMetric;
    codeUnderstanding: SkillMetric;
    promptQuality: SkillMetric;
    learningMomentum: SkillMetric;
  };
  balance: BalanceScore;
  daily: DailyUsage[];
  categories: CategoryBreakdown[];
  toolUsage: { tool: AITool; label: string; count: number }[];
  codeSplit: { generated: number; manual: number; modified: number };
  /** Plain-language explanation of how the numbers were produced. */
  methodology: string[];
}

/* ------------------------------------------------------------------ */
/* Coaching, reporting, gamification                                   */
/* ------------------------------------------------------------------ */

export type RecommendationPriority = 'primary' | 'supporting' | 'reinforce';

export interface Recommendation {
  id: string;
  priority: RecommendationPriority;
  title: string;
  why: string;
  evidence: string;
  tryThis: string;
  actionLabel: string;
  actionKind: 'challenge' | 'assessment' | 'prompt-lab' | 'review';
  estimatedMinutes: number;
  targetMetric: string;
}

export interface WeeklyReport {
  id: string;
  weekLabel: string;
  generatedAt: string;
  headline: string;
  balance: number;
  balanceDelta: number;
  metrics: SkillMetric[];
  improved: string[];
  needsAttention: string[];
  nextSteps: string[];
  dependencyTrend: { day: string; current: number; previous: number }[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  progress: number;
  target: number;
  earnedAt?: string;
}

/* ------------------------------------------------------------------ */
/* Repository analysis (simulated for the prototype)                   */
/* ------------------------------------------------------------------ */

export interface RepoModule {
  path: string;
  role: string;
  files: number;
  complexity: number;
  aiAuthoredShare: number;
}

export interface RepoAnalysis {
  repoUrl: string;
  owner: string;
  repo: string;
  analysedAt: string;
  languages: { name: string; share: number }[];
  modules: RepoModule[];
  commits: number;
  contributors: number;
  documentationScore: number;
  complexityScore: number;
  testCoverageSignal: number;
  architectureSummary: string;
  detectedConcepts: string[];
  source: 'simulated' | 'github-api';
}

/* ------------------------------------------------------------------ */
/* Understanding profile per project                                   */
/* ------------------------------------------------------------------ */

export interface UnderstandingArea {
  key: string;
  label: string;
  score: number;
  note: string;
}

export interface ProjectUnderstanding {
  projectId: string;
  overall: number;
  areas: UnderstandingArea[];
  lastCheckedAt?: string;
  questionsAnswered: number;
}

/* ------------------------------------------------------------------ */
/* Privacy and integrations                                            */
/* ------------------------------------------------------------------ */

export interface PrivacySettings {
  aiActivityTracking: boolean;
  githubAccess: boolean;
  analyticsCollection: boolean;
  promptTextRetention: boolean;
  shareAnonymisedBenchmarks: boolean;
}

export interface IntegrationStatus {
  id: AITool | 'github' | 'vscode';
  label: string;
  description: string;
  connected: boolean;
  mode: 'simulated' | 'live';
  capability: string;
  availability: 'available' | 'planned' | 'requires-extension';
}
