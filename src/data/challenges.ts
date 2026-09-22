import type { DevelopmentArea } from '@/types';

export interface Challenge {
  id: string;
  title: string;
  minutes: number;
  brief: string;
  constraints: string[];
  reflection: string[];
  areas: DevelopmentArea[];
}

/**
 * Independent challenges: short, bounded exercises the developer does without
 * an assistant. The point is not the artefact — it is producing a concrete
 * thing to hand the assistant for critique afterwards.
 */
export const CHALLENGES: Challenge[] = [
  {
    id: 'ch_trace',
    title: 'Trace a request end to end',
    minutes: 15,
    brief:
      'Pick one route in your project. On paper or in a comment block, write every hop a request makes from the client to the response, including every place it can fail.',
    constraints: [
      'No assistant, no searching your own codebase for the first ten minutes.',
      'Write it from memory first, then open the code and mark what you got wrong.',
    ],
    reflection: [
      'Which hop did you forget entirely?',
      'Where did you guess instead of knowing?',
      'Which failure mode surprised you?',
    ],
    areas: ['web', 'backend', 'other'],
  },
  {
    id: 'ch_design',
    title: 'Design before you generate',
    minutes: 15,
    brief:
      'Take the next feature on your list. Write the function signatures, the data shape and the error cases before writing a single line of implementation.',
    constraints: [
      'Signatures and types only. No bodies.',
      'When you are done, ask the assistant to critique the design — not to implement it.',
    ],
    reflection: [
      'Which error case did you only find while writing the signature?',
      'Did the assistant find a case you missed, or only restate yours?',
    ],
    areas: ['web', 'backend', 'mobile', 'ai-ml', 'data-science', 'other'],
  },
  {
    id: 'ch_debug',
    title: 'Debug without asking',
    minutes: 15,
    brief:
      'Find the last bug you fixed with AI help. Re-derive the cause yourself: form a hypothesis, decide what evidence would disprove it, then go find that evidence.',
    constraints: [
      'Write the hypothesis down before you look at anything.',
      'If you were wrong, write down what the evidence actually said.',
    ],
    reflection: [
      'Was your first hypothesis right?',
      'What would have told you faster?',
    ],
    areas: ['web', 'backend', 'mobile', 'ai-ml', 'data-science', 'other'],
  },
  {
    id: 'ch_rebuild',
    title: 'Rebuild one generated function',
    minutes: 15,
    brief:
      'Pick a function an assistant wrote for you. Close it. Rewrite it from your understanding of what it should do, then diff the two.',
    constraints: [
      'Do not look at the original while rewriting.',
      'The diff is the result — a clean match and a total miss are both useful.',
    ],
    reflection: [
      'What did the original handle that you forgot?',
      'What did you write more simply than the original?',
    ],
    areas: ['web', 'backend', 'mobile', 'ai-ml', 'data-science', 'other'],
  },
];

export function challengeForArea(area: DevelopmentArea | undefined): Challenge {
  if (!area) return CHALLENGES[0];
  return CHALLENGES.find((c) => c.areas.includes(area)) ?? CHALLENGES[0];
}
