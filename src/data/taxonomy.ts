import type {
  AITool,
  DevelopmentArea,
  DeveloperLevel,
  PromptCategory,
  SkillDimension,
} from '@/types';

export const TOOL_LABELS: Record<AITool, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  copilot: 'GitHub Copilot',
  cursor: 'Cursor',
  other: 'Other assistant',
};

export const ALL_TOOLS: AITool[] = [
  'chatgpt',
  'claude',
  'gemini',
  'copilot',
  'cursor',
  'other',
];

export const AREA_LABELS: Record<DevelopmentArea, string> = {
  web: 'Web Development',
  'ai-ml': 'AI / ML',
  'data-science': 'Data Science',
  mobile: 'Mobile Development',
  backend: 'Backend',
  other: 'Other',
};

export const ALL_AREAS: DevelopmentArea[] = [
  'web',
  'ai-ml',
  'data-science',
  'mobile',
  'backend',
  'other',
];

export const LEVEL_LABELS: Record<DeveloperLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const LEVEL_BLURB: Record<DeveloperLevel, string> = {
  beginner: 'Learning the fundamentals, building first real projects.',
  intermediate: 'Ships features independently, still growing on architecture.',
  advanced: 'Designs systems, reviews others, optimises for scale.',
};

export const CATEGORY_LABELS: Record<PromptCategory, string> = {
  learning: 'Learning',
  debugging: 'Debugging',
  'code-generation': 'Code Generation',
  architecture: 'Architecture',
  explanation: 'Explanation',
  'complete-solution': 'Complete Solution',
  optimization: 'Optimization',
};

/**
 * How each prompt category tends to affect understanding.
 * `good`  - usually builds the developer's own model of the system
 * `neutral` - depends entirely on what the developer does next
 * `watch` - routinely substitutes for the developer's reasoning
 */
export const CATEGORY_TONE: Record<PromptCategory, 'good' | 'neutral' | 'watch'> = {
  learning: 'good',
  explanation: 'good',
  debugging: 'neutral',
  architecture: 'neutral',
  optimization: 'neutral',
  'code-generation': 'watch',
  'complete-solution': 'watch',
};

export const CATEGORY_ORDER: PromptCategory[] = [
  'learning',
  'explanation',
  'debugging',
  'architecture',
  'optimization',
  'code-generation',
  'complete-solution',
];

export const DIMENSION_LABELS: Record<SkillDimension, string> = {
  'technical-understanding': 'Technical Understanding',
  'problem-solving': 'Problem Solving',
  'code-reading': 'Code Reading',
  architecture: 'Architecture',
  debugging: 'Debugging',
  conceptual: 'Conceptual Depth',
};

export const DIMENSION_ORDER: SkillDimension[] = [
  'technical-understanding',
  'problem-solving',
  'code-reading',
  'architecture',
  'debugging',
  'conceptual',
];

export const DIFFICULTY_LABELS = {
  foundational: 'Foundational',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
} as const;

/** Colour token per tone, shared by charts and badges. */
export const TONE_COLOR = {
  good: '#3fcf8e',
  neutral: '#7c8cff',
  watch: '#f0b429',
} as const;

export const CHART_COLORS = {
  ai: '#7c8cff',
  human: '#3fcf8e',
  warn: '#f0b429',
  risk: '#f0616f',
  info: '#4cc9f0',
  grid: 'rgba(255,255,255,0.06)',
  axis: '#6a7182',
} as const;
