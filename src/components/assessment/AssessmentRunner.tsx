import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  ChevronsDown,
  ChevronsUp,
  CircleHelp,
  Lightbulb,
  Loader2,
  Send,
} from 'lucide-react';
import type { Assessment, AssessmentResponse, Question } from '@/types';
import type { AdaptiveSession } from '@/lib/assessmentEngine';
import { finaliseSession, nextQuestion, submitAnswer } from '@/services/mockAssessmentService';
import { DIFFICULTY_LABELS } from '@/data/taxonomy';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/Progress';
import { TextArea } from '@/components/ui/Form';
import { Note } from '@/components/ui/Feedback';
import { cn } from '@/lib/utils';
import { CodeBlock } from './CodeBlock';

const KIND_LABEL: Record<Question['kind'], string> = {
  'multiple-choice': 'Multiple choice',
  debugging: 'Debugging',
  'code-comprehension': 'Code comprehension',
  architecture: 'Architecture',
  'short-answer': 'Short answer',
};

function scoreTone(score: number) {
  if (score >= 80) return 'good' as const;
  if (score >= 55) return 'accent' as const;
  if (score >= 35) return 'warn' as const;
  return 'risk' as const;
}

export function AssessmentRunner({
  initialSession,
  onComplete,
  onExit,
  title,
  intro,
}: {
  initialSession: AdaptiveSession;
  onComplete: (assessment: Assessment, session: AdaptiveSession) => void;
  onExit?: () => void;
  title: string;
  intro?: string;
}) {
  const [session, setSession] = useState<AdaptiveSession>(initialSession);
  const [question, setQuestion] = useState<Question | null>(() =>
    nextQuestion(initialSession),
  );
  const [answer, setAnswer] = useState('');
  const [selected, setSelected] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<AssessmentResponse | null>(null);
  const [difficultyMove, setDifficultyMove] = useState<'up' | 'down' | null>(null);
  const startedAt = useRef(Date.now());
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, [question?.id]);

  useEffect(() => {
    if (feedback) feedbackRef.current?.focus();
  }, [feedback]);

  const canSubmit = useMemo(() => {
    if (!question || submitting) return false;
    if (question.kind === 'multiple-choice') return Boolean(selected);
    return answer.trim().length > 0;
  }, [question, submitting, selected, answer]);

  const handleSubmit = useCallback(async () => {
    if (!question || !canSubmit) return;
    setSubmitting(true);
    const seconds = Math.round((Date.now() - startedAt.current) / 1000);
    const answerText =
      question.kind === 'multiple-choice'
        ? (question.options?.find((o) => o.id === selected)?.label ?? '')
        : answer;

    const result = await submitAnswer(session, question, answerText, seconds, selected);
    const previousIndex = ['foundational', 'intermediate', 'advanced'].indexOf(
      session.difficulty,
    );
    const nextIndex = ['foundational', 'intermediate', 'advanced'].indexOf(
      result.session.difficulty,
    );

    setDifficultyMove(
      nextIndex > previousIndex ? 'up' : nextIndex < previousIndex ? 'down' : null,
    );
    setSession(result.session);
    setFeedback(result.response);
    setSubmitting(false);
  }, [question, canSubmit, session, selected, answer]);

  const handleNext = useCallback(() => {
    const upcoming = nextQuestion(session);
    setFeedback(null);
    setAnswer('');
    setSelected(undefined);
    setDifficultyMove(null);
    if (!upcoming) {
      onComplete(finaliseSession(session), session);
      return;
    }
    setQuestion(upcoming);
  }, [session, onComplete]);

  if (!question) {
    return (
      <Note tone="info">
        No questions are available for this assessment yet. Add a project with a technology
        stack and the engine will have something to ask about.
      </Note>
    );
  }

  const answered = session.responses.length;
  const total = session.config.length;
  const progress = (answered / total) * 100;
  // While feedback is on screen the question being discussed is the one just
  // answered, so the counter must not jump ahead of it.
  const displayIndex = Math.min(feedback ? answered : answered + 1, total);
  const isLast = feedback ? answered >= total : answered + 1 >= total;

  return (
    <div className="space-y-5">
      {/* ---------------- progress header ---------------- */}
      <div className="panel px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="label-caps">{title}</div>
            <div className="mt-1 text-[15px] font-semibold tabular-nums text-ink">
              Question {displayIndex} / {total}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {difficultyMove && session.previousDifficulty ? (
              <Badge
                tone={difficultyMove === 'up' ? 'good' : 'warn'}
                icon={
                  difficultyMove === 'up' ? (
                    <ChevronsUp size={11} />
                  ) : (
                    <ChevronsDown size={11} />
                  )
                }
              >
                {DIFFICULTY_LABELS[session.previousDifficulty]} →{' '}
                {DIFFICULTY_LABELS[session.difficulty]}
              </Badge>
            ) : (
              <Badge tone="neutral">
                Difficulty: {DIFFICULTY_LABELS[session.difficulty]}
              </Badge>
            )}
            {onExit ? (
              <Button variant="ghost" size="sm" onClick={onExit}>
                Exit
              </Button>
            ) : null}
          </div>
        </div>
        <ProgressBar className="mt-3.5" value={progress} label="Assessment progress" />
        {intro && answered === 0 ? (
          <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">{intro}</p>
        ) : null}
      </div>

      {/* ---------------- question ---------------- */}
      <div className="panel p-5 sm:p-6 animate-fade-up" key={question.id}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">{KIND_LABEL[question.kind]}</Badge>
          <Badge tone="neutral">{DIFFICULTY_LABELS[question.difficulty]}</Badge>
          {question.context ? (
            <span className="text-[12px] text-ink-faint">{question.context}</span>
          ) : null}
        </div>

        <h2 className="mt-4 text-[17px] font-medium leading-[1.45] tracking-[-0.01em] text-ink">
          {question.prompt}
        </h2>

        {question.code ? (
          <CodeBlock code={question.code} language={question.language} className="mt-4" />
        ) : null}

        {/* answer input */}
        <div className="mt-5">
          {question.kind === 'multiple-choice' ? (
            <div className="space-y-2" role="radiogroup" aria-label="Answer options">
              {question.options?.map((option) => {
                const isSelected = selected === option.id;
                const isCorrect = feedback && option.id === question.correctOptionId;
                const isWrongPick =
                  feedback && isSelected && option.id !== question.correctOptionId;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={Boolean(feedback)}
                    onClick={() => setSelected(option.id)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-[13.5px] leading-relaxed transition-colors',
                      isCorrect
                        ? 'border-[rgba(63,207,142,0.4)] bg-good-soft text-ink'
                        : isWrongPick
                          ? 'border-[rgba(240,97,111,0.4)] bg-risk-soft text-ink'
                          : isSelected
                            ? 'border-accent-line bg-accent-soft text-ink'
                            : 'border-hairline bg-raised text-ink-muted hover:border-edge hover:text-ink',
                      feedback && 'cursor-default',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-medium',
                        isSelected || isCorrect ? 'border-transparent bg-white/[0.12]' : 'border-edge',
                      )}
                    >
                      {option.id.toUpperCase()}
                    </span>
                    <span className="min-w-0">{option.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <TextArea
              value={answer}
              disabled={Boolean(feedback)}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Explain it the way you would to a teammate. Rough and honest beats polished and borrowed."
              aria-label="Your answer"
            />
          )}
        </div>

        {!feedback ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12px] text-ink-faint">
              {question.kind === 'multiple-choice'
                ? 'Pick the option you would defend in review.'
                : 'Answer from memory. Guessing out loud is more useful than a blank.'}
            </p>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              loading={submitting}
              icon={submitting ? undefined : <Send size={14} />}
            >
              {submitting ? 'Evaluating' : 'Submit answer'}
            </Button>
          </div>
        ) : null}
      </div>

      {/* ---------------- feedback ---------------- */}
      {feedback ? (
        <div
          ref={feedbackRef}
          tabIndex={-1}
          className="panel p-5 outline-none sm:p-6 animate-fade-up"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BadgeCheck size={16} className="text-accent" />
              <h3 className="text-[14.5px] font-medium text-ink">Evaluation</h3>
            </div>
            <Badge tone={scoreTone(feedback.score)} className="tabular-nums">
              {Math.round(feedback.score)} / 100
            </Badge>
          </div>

          <p className="mt-3 text-[14px] leading-relaxed text-ink">{feedback.feedback}</p>

          {feedback.strengths.length || feedback.gaps.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {feedback.strengths.length ? (
                <div className="rounded-xl border border-hairline bg-raised p-3.5">
                  <div className="label-caps text-good">Covered</div>
                  <ul className="mt-2 space-y-1.5 text-[12.5px] leading-relaxed text-ink-muted">
                    {feedback.strengths.slice(0, 4).map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {feedback.gaps.length ? (
                <div className="rounded-xl border border-hairline bg-raised p-3.5">
                  <div className="label-caps text-warn">Not mentioned</div>
                  <ul className="mt-2 space-y-1.5 text-[12.5px] leading-relaxed text-ink-muted">
                    {feedback.gaps.slice(0, 4).map((g) => (
                      <li key={g}>{g}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          {question.modelAnswer && question.kind !== 'multiple-choice' ? (
            <details className="group mt-4">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-[13px] text-ink-muted hover:text-ink">
                <Lightbulb size={14} className="text-warn" />
                Show a complete answer
              </summary>
              <p className="mt-2.5 rounded-xl border border-hairline bg-raised p-3.5 text-[13px] leading-relaxed text-ink-muted">
                {question.modelAnswer}
              </p>
            </details>
          ) : null}

          <div className="mt-5 flex items-center justify-end">
            <Button onClick={handleNext} iconAfter={<ArrowRight size={15} />}>
              {isLast ? 'See results' : 'Next question'}
            </Button>
          </div>
        </div>
      ) : null}

      <p className="flex items-start gap-2 text-[12px] leading-relaxed text-ink-faint">
        <CircleHelp size={13} className="mt-0.5 shrink-0" />
        Scored on concept coverage and reasoning, not on matching a model answer. Difficulty
        moves up above {75} and down below {45}.
      </p>
    </div>
  );
}

export function AssessmentLoading() {
  return (
    <div className="flex items-center gap-2 text-[13px] text-ink-muted">
      <Loader2 size={14} className="animate-spin" />
      Preparing your assessment
    </div>
  );
}
