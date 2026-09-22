import type { Question } from '@/types';
import { evaluateAnswer, type EvaluationResult } from '@/lib/answerEvaluator';

/**
 * LLM abstraction layer.
 *
 * The product needs one capability from a model: judge a free-text answer
 * against a question and return a score plus feedback. That capability is
 * expressed as an interface with two implementations:
 *
 *   heuristic  - concept-coverage rubric, runs offline, always available.
 *   remote     - any OpenAI-compatible chat completions endpoint.
 *
 * The heuristic provider is the default so the prototype is fully functional
 * with no keys, no network and no configuration. If a key is present the
 * remote provider is used and silently falls back on any failure, so a demo
 * can never be broken by a network problem.
 */

export interface LLMEvaluator {
  readonly id: string;
  readonly label: string;
  readonly isRemote: boolean;
  evaluate(question: Question, answer: string, selectedOptionId?: string): Promise<EvaluationResult>;
}

/* ------------------------------------------------------------------ */
/* Heuristic (default)                                                 */
/* ------------------------------------------------------------------ */

class HeuristicEvaluator implements LLMEvaluator {
  readonly id = 'heuristic';
  readonly label = 'On-device rubric';
  readonly isRemote = false;

  async evaluate(
    question: Question,
    answer: string,
    selectedOptionId?: string,
  ): Promise<EvaluationResult> {
    // Deliberate latency so the UI exercises its real loading state.
    await new Promise((resolve) => setTimeout(resolve, 520));
    return evaluateAnswer(question, answer, selectedOptionId);
  }
}

/* ------------------------------------------------------------------ */
/* Remote (optional)                                                   */
/* ------------------------------------------------------------------ */

interface RemoteConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

const SYSTEM_PROMPT = `You evaluate a developer's understanding of their own code.
Score 0-100 on whether the answer explains the mechanism, not whether it matches a model answer.
Reward reasoning, correct causality and honest uncertainty. Penalise restating the question.
Respond with JSON only: {"score":number,"feedback":string,"strengths":string[],"gaps":string[]}`;

class RemoteEvaluator implements LLMEvaluator {
  readonly id = 'remote';
  readonly isRemote = true;
  readonly label: string;

  constructor(private config: RemoteConfig) {
    this.label = `${config.model} (remote)`;
  }

  async evaluate(
    question: Question,
    answer: string,
    selectedOptionId?: string,
  ): Promise<EvaluationResult> {
    if (question.kind === 'multiple-choice') {
      return evaluateAnswer(question, answer, selectedOptionId);
    }

    const userPrompt = [
      `Question: ${question.prompt}`,
      question.code ? `Code:\n${question.code}` : '',
      question.expectedConcepts?.length
        ? `Concepts a complete answer covers: ${question.expectedConcepts.join('; ')}`
        : '',
      `Developer's answer: ${answer}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          temperature: 0.2,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (!response.ok) throw new Error(`LLM responded ${response.status}`);
      const payload = await response.json();
      const content = payload?.choices?.[0]?.message?.content;
      if (typeof content !== 'string') throw new Error('Unexpected LLM response shape');

      const parsed = JSON.parse(content.replace(/^```(?:json)?|```$/g, '').trim());
      const heuristic = evaluateAnswer(question, answer, selectedOptionId);

      return {
        score: Math.max(0, Math.min(100, Number(parsed.score) || heuristic.score)),
        feedback: String(parsed.feedback || heuristic.feedback),
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : heuristic.strengths,
        gaps: Array.isArray(parsed.gaps) ? parsed.gaps : heuristic.gaps,
        matchedConcepts: heuristic.matchedConcepts,
        missedConcepts: heuristic.missedConcepts,
      };
    } catch {
      // Never let a demo fail because of a network or parsing problem.
      return evaluateAnswer(question, answer, selectedOptionId);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Selection                                                           */
/* ------------------------------------------------------------------ */

function readRemoteConfig(): RemoteConfig | null {
  const env = import.meta.env as Record<string, string | undefined>;
  const apiKey = env.VITE_LLM_API_KEY;
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: env.VITE_LLM_BASE_URL ?? 'https://api.openai.com/v1',
    model: env.VITE_LLM_MODEL ?? 'gpt-4o-mini',
  };
}

const remoteConfig = readRemoteConfig();

export const llmEvaluator: LLMEvaluator = remoteConfig
  ? new RemoteEvaluator(remoteConfig)
  : new HeuristicEvaluator();

export const heuristicEvaluator = new HeuristicEvaluator();
