import type { PromptCategory } from '@/types';

export interface SeedPrompt {
  text: string;
  category: PromptCategory;
  /** Which of the two demo weeks this prompt belongs to. */
  week: 'current' | 'previous';
}

/**
 * Prompts attributed to the demo developer (Alex, building "AI Resume
 * Analyzer"). Scores are NOT stored here — they are produced by
 * lib/promptAnalyzer so the Prompt Intelligence screen shows the real rubric
 * running against real text.
 *
 * The narrative these prompts encode: Alex asks *well* but often asks for the
 * wrong altitude of help. High prompt quality and high dependency can coexist,
 * and that is the insight the product exists to surface.
 */
export const SEED_PROMPTS: SeedPrompt[] = [
  /* ---------------- current week ---------------- */
  {
    text: 'Here is my approach to implementing binary search over the ranked resume matches. Identify flaws without giving me the solution.',
    category: 'learning',
    week: 'current',
  },
  {
    text: 'I think the parser returns empty strings for scanned PDFs because the extraction step never runs OCR. Review my reasoning and give me a hint rather than the patch.',
    category: 'debugging',
    week: 'current',
  },
  {
    text: 'I think the empty body comes from my Express handler resolving before the Postgres query settles. Why would this endpoint return 200 instead of 404 for a missing resume id?',
    category: 'explanation',
    week: 'current',
  },
  {
    text: 'My current schema stores skills as a JSONB column. Challenge my choice before I migrate this query path: what are the trade-offs versus a normalised skills table?',
    category: 'architecture',
    week: 'current',
  },
  {
    text: 'Here is my rate limiting middleware for the OpenAI calls. Where does this break under concurrent requests from the same user? Give me a hint, not the fix.',
    category: 'debugging',
    week: 'current',
  },
  {
    text: 'I tried memoising the match score calculation with useMemo but the React component still re-renders on every keystroke. Give me a hint rather than the fix.',
    category: 'debugging',
    week: 'current',
  },
  {
    text: 'Generate the CRUD controller for resumes. I wrote the validation schema already, so review my error handling first and tell me why leaking Postgres details to the client matters.',
    category: 'code-generation',
    week: 'current',
  },
  {
    text: 'I think the control only reaches the resume controller after the auth guard calls next(). Explain how Express actually hands off through this middleware and what happens if I forget next().',
    category: 'explanation',
    week: 'current',
  },
  {
    text: 'My plan is to cache the embedding vectors in Postgres with a pgvector index. Am I missing a reason this would degrade as the table grows? Point me in the right direction.',
    category: 'architecture',
    week: 'current',
  },
  {
    text: 'Here is my React sketch for this component and the props I expect. Generate the virtualised results table, then explain why the virtualisation boundary sits where it does.',
    category: 'code-generation',
    week: 'current',
  },
  {
    text: 'This query does a sequential scan on 40k rows. I believe the issue is that my composite index column order does not match the where clause. Challenge my reasoning before giving me a hint.',
    category: 'optimization',
    week: 'current',
  },
  {
    text: 'I wrote this retry loop for the OpenAI calls. Critique it — I want to understand what exponential backoff actually protects against when the endpoint returns a 429 error.',
    category: 'learning',
    week: 'current',
  },
  {
    text: 'My current understanding is that the server re-computes the HMAC over the header and payload. Am I missing something about how JWT signature verification actually prevents tampering?',
    category: 'learning',
    week: 'current',
  },
  {
    text: 'Add cursor pagination to this endpoint. My current query sorts by created_at — explain why offset pagination would drift once rows are inserted mid-scroll.',
    category: 'code-generation',
    week: 'current',
  },
  {
    text: 'Generate the export service for match reports. I wrote the CSV streaming part already, so review my buffering assumption.',
    category: 'code-generation',
    week: 'current',
  },

  /* ---------------- previous week ---------------- */
  {
    text: 'Write the complete implementation for this problem.',
    category: 'complete-solution',
    week: 'previous',
  },
  {
    text: 'Build me a complete resume analyzer backend with authentication, file upload and the OpenAI scoring pipeline.',
    category: 'complete-solution',
    week: 'previous',
  },
  {
    text: 'Write the full implementation of the scoring service.',
    category: 'complete-solution',
    week: 'previous',
  },
  {
    text: 'Just fix it, the upload keeps failing.',
    category: 'debugging',
    week: 'previous',
  },
  {
    text: 'Write all the database migrations for this schema.',
    category: 'complete-solution',
    week: 'previous',
  },
  {
    text: 'My upload route returns a 500 when the file is larger than 2 MB. Here is the multer config I am using — what is wrong with it?',
    category: 'debugging',
    week: 'previous',
  },
  {
    text: 'Generate a React dashboard component with charts for the match results.',
    category: 'code-generation',
    week: 'previous',
  },
  {
    text: 'Explain what a database index actually does to the lookup cost, and when would an index make writes slower?',
    category: 'learning',
    week: 'previous',
  },
  {
    text: 'Implement the entire authentication flow with refresh tokens.',
    category: 'complete-solution',
    week: 'previous',
  },
  {
    text: 'Here is my draft ER diagram for resumes, jobs and matches. Poke holes in it before I write the migrations.',
    category: 'architecture',
    week: 'previous',
  },
  {
    text: 'Why does this reducer return the previous state when I mutate the array directly? I want to understand the React rendering rule, not just the fix.',
    category: 'explanation',
    week: 'previous',
  },
  {
    text: 'Make it work with the new OpenAI SDK.',
    category: 'code-generation',
    week: 'previous',
  },
  {
    text: 'Optimize this function.',
    category: 'optimization',
    week: 'previous',
  },
];

/**
 * The teaching pair rendered on the Prompt Intelligence page. Both are real
 * entries from the history above and are scored live by the rubric.
 */
export const CONTRAST_PROMPTS = {
  good: 'Here is my approach to implementing binary search over the ranked resume matches. Identify flaws without giving me the solution.',
  risky: 'Write the complete implementation for this problem.',
};
