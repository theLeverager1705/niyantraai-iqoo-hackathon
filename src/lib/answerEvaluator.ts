import type { AssessmentResponse, Question } from '@/types';
import { clamp, normalise, round, wordCount } from './utils';

/**
 * Answer evaluation - PROTOTYPE HEURISTIC.
 *
 * Free-text answers are scored on concept coverage rather than string
 * similarity, because the product's claim is "can you explain this?", not
 * "did you reproduce the model answer?".
 *
 * A concept may list alternatives separated by "|", so
 *   'middleware|next()|pipeline'
 * counts as covered if the answer mentions any of them.
 *
 * services/llm/llmService.ts can route this through a real model when an API
 * key is configured; the returned shape is identical either way.
 */

export interface EvaluationResult {
  score: number;
  feedback: string;
  strengths: string[];
  gaps: string[];
  matchedConcepts: string[];
  missedConcepts: string[];
}

function conceptLabel(concept: string): string {
  return concept.split('|')[0];
}

function conceptMatches(concept: string, answer: string): boolean {
  return concept
    .split('|')
    .map((alt) => normalise(alt))
    .filter(Boolean)
    .some((alt) => answer.includes(alt));
}

/** Rewards thinking-out-loud language over one-line assertions. */
function depthSignal(answer: string, words: number): number {
  const t = normalise(answer);
  const connectives = [
    'because',
    'so that',
    'which means',
    'therefore',
    'then',
    'after',
    'before',
    'if ',
    'when ',
    'otherwise',
    'instead',
    'whereas',
  ];
  const hits = connectives.filter((c) => t.includes(c)).length;
  const lengthFactor = Math.min(1, words / 45);
  const reasoningFactor = Math.min(1, hits / 3);
  return 0.55 * lengthFactor + 0.45 * reasoningFactor;
}

export function evaluateFreeText(question: Question, answer: string): EvaluationResult {
  const normalised = normalise(answer);
  const words = wordCount(answer);
  const concepts = question.expectedConcepts ?? [];

  if (words < 3) {
    return {
      score: 0,
      feedback:
        'There is not enough here to assess. Even a rough explanation in your own words is worth more than a blank - write what you believe happens, and the gaps become useful information.',
      strengths: [],
      gaps: concepts.map(conceptLabel),
      matchedConcepts: [],
      missedConcepts: concepts.map(conceptLabel),
    };
  }

  const matched = concepts.filter((c) => conceptMatches(c, normalised));
  const missed = concepts.filter((c) => !conceptMatches(c, normalised));
  const coverage = concepts.length ? matched.length / concepts.length : 0.5;
  const depth = depthSignal(answer, words);

  const misconceptions = (question.misconceptions ?? []).filter((m) =>
    conceptMatches(m, normalised),
  );
  const penalty = misconceptions.length * 12;

  const score = Math.round(
    clamp(coverage * 68 + depth * 24 + (words >= 12 ? 8 : 0) - penalty),
  );

  const strengths = matched.map(conceptLabel);
  const gaps = missed.map(conceptLabel);

  let feedback: string;
  if (score >= 85) {
    feedback = `Strong answer. You connected ${strengths
      .slice(0, 2)
      .join(' and ')} and explained the mechanism rather than restating the behaviour.`;
  } else if (score >= 65) {
    feedback = `Good explanation. You correctly identified ${strengths
      .slice(0, 2)
      .join(' and ')}${gaps.length ? `, but you did not explain ${gaps[0]}` : ''}.`;
  } else if (score >= 40) {
    feedback = `Partly there. ${
      strengths.length
        ? `You have ${strengths[0]} right, `
        : 'The direction is reasonable, '
    }but the answer stays at the level of what happens rather than why${
      gaps.length ? `, and it misses ${gaps.slice(0, 2).join(' and ')}` : ''
    }.`;
  } else {
    feedback = `This one is a gap worth closing.${
      gaps.length ? ` A complete answer would cover ${gaps.slice(0, 3).join(', ')}.` : ''
    } That is useful signal, not a failure - it tells you exactly where to read next.`;
  }

  if (misconceptions.length) {
    feedback += ` One thing to correct: "${conceptLabel(
      misconceptions[0],
    )}" is a common misconception here.`;
  }

  return {
    score,
    feedback,
    strengths,
    gaps,
    matchedConcepts: strengths,
    missedConcepts: gaps,
  };
}

export function evaluateMultipleChoice(
  question: Question,
  selectedOptionId: string,
): EvaluationResult {
  const correct = selectedOptionId === question.correctOptionId;
  const correctLabel =
    question.options?.find((o) => o.id === question.correctOptionId)?.label ?? '';
  return {
    score: correct ? 100 : 0,
    feedback: correct
      ? question.modelAnswer ?? 'Correct.'
      : `Not quite. The answer is "${correctLabel}". ${question.modelAnswer ?? ''}`.trim(),
    strengths: correct ? ['Correct reasoning'] : [],
    gaps: correct ? [] : [question.dimension.replace('-', ' ')],
    matchedConcepts: [],
    missedConcepts: [],
  };
}

export function evaluateAnswer(
  question: Question,
  answer: string,
  selectedOptionId?: string,
): EvaluationResult {
  if (question.kind === 'multiple-choice') {
    return evaluateMultipleChoice(question, selectedOptionId ?? '');
  }
  return evaluateFreeText(question, answer);
}

export function toResponse(
  question: Question,
  answer: string,
  secondsTaken: number,
  selectedOptionId?: string,
): AssessmentResponse {
  const result = evaluateAnswer(question, answer, selectedOptionId);
  return {
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
}
