import type { PromptAnalysis, PromptCategory, PromptSignal } from '@/types';
import { clamp, normalise, wordCount } from './utils';

/**
 * Prompt Intelligence — a transparent rubric (prototype heuristic).
 *
 * NiyantraAI does not count AI requests; it reads *how* the developer asks.
 * Every prompt is scored against signals that correlate with the developer
 * keeping ownership of the reasoning, minus signals that indicate the
 * reasoning was handed over wholesale.
 *
 * Replacing this file with a real LLM call (see services/llm) changes nothing
 * else in the product — the output contract is the same.
 */

const BASE_SCORE = 53;
const POSITIVE_GAIN = 0.62;

interface Rule {
  label: string;
  weight: number;
  hint: string;
  test: (text: string, words: number) => boolean;
}

const has = (text: string, phrases: string[]) =>
  phrases.some((p) => text.includes(p));

export const POSITIVE_RULES: Rule[] = [
  {
    label: 'Shows your own attempt',
    weight: 16,
    hint: 'You gave the assistant something of yours to react to.',
    test: (t) =>
      has(t, [
        'here is my',
        'here s my',
        'this is my',
        'my approach',
        'my solution',
        'my code',
        'i wrote',
        'i tried',
        'i implemented',
        'i think the',
        'my current',
        'i attempted',
        'my plan is',
        'i believe the issue',
      ]),
  },
  {
    label: 'Asks for critique, not code',
    weight: 15,
    hint: 'Review requests keep you as the author of the solution.',
    test: (t) =>
      has(t, [
        'identify flaws',
        'critique',
        'review my',
        'what is wrong with',
        'what s wrong with',
        'poke holes',
        'find the flaw',
        'is my reasoning',
        'am i missing',
        'challenge my',
        'where does this break',
        'stress test my',
      ]),
  },
  {
    label: 'Withholds the solution deliberately',
    weight: 12,
    hint: 'Explicitly asking not to be given the answer protects your recall.',
    test: (t) =>
      has(t, [
        'without giving me the solution',
        'without giving the solution',
        'do not give me the code',
        'don t give me the code',
        'do not write the code',
        'no code',
        'just a hint',
        'give me a hint',
        'point me in the right direction',
        'without writing it for me',
      ]),
  },
  {
    label: 'Concrete context supplied',
    weight: 10,
    hint: 'Named errors, files, versions or data shapes make answers verifiable.',
    test: (t) =>
      has(t, [
        'error',
        'stack trace',
        'traceback',
        'line ',
        'returns',
        'expected',
        'postgres',
        'express',
        'react',
        'node',
        'jwt',
        'middleware',
        'schema',
        'endpoint',
        'binary search',
        'index',
        'typescript',
        'python',
        'docker',
        'query',
      ]),
  },
  {
    label: 'Probes why / trade-offs',
    weight: 9,
    hint: 'Why-questions build transferable models instead of one-off fixes.',
    test: (t) =>
      has(t, [
        'why',
        'trade-off',
        'tradeoff',
        'trade off',
        'compare',
        'versus',
        ' vs ',
        'what happens if',
        'when would',
        'downside',
        'implication',
        'how does',
      ]),
  },
  {
    label: 'Scoped to one problem',
    weight: 7,
    hint: 'A single function or decision is reviewable; a whole app is not.',
    test: (t) =>
      !has(t, ['entire app', 'whole app', 'full project', 'everything', 'all the files']) &&
      has(t, [
        'this function',
        'this method',
        'this component',
        'this query',
        'this test',
        'this loop',
        'this handler',
        'this middleware',
        'this reducer',
        'binary search',
        'this endpoint',
        'this migration',
      ]),
  },
  {
    label: 'Enough detail to be answerable',
    weight: 6,
    hint: 'Short prompts force the assistant to guess your intent.',
    test: (_t, words) => words >= 13,
  },
];

export const NEGATIVE_RULES: Rule[] = [
  {
    label: 'Requests a complete implementation',
    weight: 4,
    hint: 'You receive an artefact instead of building a model of it.',
    test: (t) =>
      has(t, [
        'complete implementation',
        'full implementation',
        'write the complete',
        'write the full',
        'complete code',
        'entire solution',
        'full solution',
        'whole solution',
        'implement the entire',
        'build the whole',
        'write all the',
      ]),
  },
  {
    label: 'Hands the problem over',
    weight: 8,
    hint: 'Phrases like "do it for me" remove your decision-making entirely.',
    test: (t) =>
      has(t, [
        'do it for me',
        'do this for me',
        'just give me the code',
        'just write it',
        'make it work',
        'fix everything',
        'fix all the',
        'handle everything',
        'build me a',
        'just fix it',
      ]),
  },
  {
    label: 'No context provided',
    weight: 5,
    hint: 'Without context the assistant answers a problem you did not ask.',
    test: (t, words) =>
      words < 22 &&
      !has(t, [
        'error',
        'my ',
        'here',
        'this function',
        'this component',
        'because',
        'when i',
        'expected',
        'returns',
      ]),
  },
  {
    label: 'Too short to carry intent',
    weight: 3,
    hint: 'Under ten words rarely encodes a real question.',
    test: (_t, words) => words < 10,
  },
  {
    label: 'Unbounded scope',
    weight: 6,
    hint: 'Whole-app requests produce code no one on the team has reasoned about.',
    test: (t) =>
      has(t, [
        'entire app',
        'whole app',
        'full project',
        'end to end app',
        'all the files',
        'from scratch the whole',
      ]),
  },
];

export function scorePrompt(text: string): {
  score: number;
  signals: PromptSignal[];
  verdict: PromptAnalysis['verdict'];
  rationale: string;
} {
  const t = normalise(text);
  const words = wordCount(text);

  const positives: PromptSignal[] = POSITIVE_RULES.map((rule) => ({
    label: rule.label,
    weight: rule.weight,
    present: rule.test(t, words),
    hint: rule.hint,
  }));

  const negatives: PromptSignal[] = NEGATIVE_RULES.map((rule) => ({
    label: rule.label,
    weight: -rule.weight,
    present: rule.test(t, words),
    hint: rule.hint,
  }));

  const gained = positives
    .filter((s) => s.present)
    .reduce((acc, s) => acc + s.weight, 0);
  const lost = negatives
    .filter((s) => s.present)
    .reduce((acc, s) => acc + Math.abs(s.weight), 0);

  const score = Math.round(clamp(BASE_SCORE + gained * POSITIVE_GAIN - lost));
  const verdict: PromptAnalysis['verdict'] =
    score >= 78 ? 'strong' : score >= 55 ? 'solid' : 'risky';

  const topPositive = positives.filter((s) => s.present).sort((a, b) => b.weight - a.weight)[0];
  const topNegative = negatives.filter((s) => s.present).sort((a, b) => a.weight - b.weight)[0];

  let rationale: string;
  if (verdict === 'strong') {
    rationale = topPositive
      ? `${topPositive.label.toLowerCase()} — ${topPositive.hint}`
      : 'Well-scoped and specific, so the answer is something you can verify.';
  } else if (verdict === 'risky') {
    rationale = topNegative
      ? `${topNegative.label.toLowerCase()} — ${topNegative.hint}`
      : 'Nothing in this prompt keeps you in the reasoning loop.';
  } else {
    rationale = topNegative
      ? `Useful request, but ${topNegative.hint.toLowerCase()}`
      : 'Reasonable prompt. Adding your own attempt would push it higher.';
  }

  return { score, signals: [...positives, ...negatives], verdict, rationale };
}

/** Best-effort category inference used when a provider does not supply one. */
export function inferCategory(text: string): PromptCategory {
  const t = normalise(text);
  if (has(t, ['complete implementation', 'full implementation', 'build me a', 'entire app', 'whole app']))
    return 'complete-solution';
  if (has(t, ['error', 'stack trace', 'traceback', 'not working', 'fails', 'bug', 'why does this crash']))
    return 'debugging';
  if (has(t, ['architecture', 'design the', 'should i use', 'structure the', 'scale', 'microservice']))
    return 'architecture';
  if (has(t, ['explain', 'what does', 'how does', 'in my own words', 'help me understand']))
    return 'explanation';
  if (has(t, ['optimize', 'optimise', 'faster', 'performance', 'reduce the time', 'memory']))
    return 'optimization';
  if (has(t, ['teach me', 'learn', 'concept', 'difference between', 'when would you use']))
    return 'learning';
  return 'code-generation';
}

export function analysePrompt(
  interactionId: string,
  text: string,
  category?: PromptCategory,
): PromptAnalysis {
  const { score, signals, verdict, rationale } = scorePrompt(text);
  return {
    id: `pa_${interactionId}`,
    interactionId,
    text,
    category: category ?? inferCategory(text),
    score,
    verdict,
    signals,
    rationale,
  };
}
