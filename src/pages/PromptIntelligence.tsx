import { useMemo, useState } from 'react';
import { Check, FlaskConical, Minus, ThumbsDown, ThumbsUp, Wand2 } from 'lucide-react';
import type { PromptAnalysis, PromptSignal } from '@/types';
import { RequireAnalytics } from '@/components/layout/RequireAnalytics';
import { Panel, PanelBody, PanelHeader, PageHeader } from '@/components/ui/Card';
import { Badge, type Tone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/Form';
import { Note } from '@/components/ui/Feedback';
import { ProgressBar, useCountUp } from '@/components/ui/Progress';
import { CATEGORY_LABELS } from '@/data/taxonomy';
import { CONTRAST_PROMPTS } from '@/data/promptBank';
import { analysePrompt, scorePrompt } from '@/lib/promptAnalyzer';
import { cn } from '@/lib/utils';

const VERDICT_TONE: Record<PromptAnalysis['verdict'], Tone> = {
  strong: 'good',
  solid: 'accent',
  risky: 'risk',
};

const VERDICT_LABEL: Record<PromptAnalysis['verdict'], string> = {
  strong: 'Strong',
  solid: 'Solid',
  risky: 'Risky',
};

function SignalList({ signals }: { signals: PromptSignal[] }) {
  const present = signals.filter((s) => s.present);
  const positives = present.filter((s) => s.weight > 0);
  const negatives = present.filter((s) => s.weight < 0);
  const missed = signals.filter((s) => !s.present && s.weight > 0).slice(0, 3);

  return (
    <div className="space-y-3">
      {positives.length ? (
        <div>
          <div className="label-caps text-good">What this prompt does well</div>
          <ul className="mt-2 space-y-1.5">
            {positives.map((s) => (
              <li key={s.label} className="flex items-start gap-2 text-[12.5px] text-ink-muted">
                <ThumbsUp size={12} className="mt-[3px] shrink-0 text-good" />
                <span>
                  <span className="text-ink">{s.label}</span> — {s.hint}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {negatives.length ? (
        <div>
          <div className="label-caps text-risk">What costs it points</div>
          <ul className="mt-2 space-y-1.5">
            {negatives.map((s) => (
              <li key={s.label} className="flex items-start gap-2 text-[12.5px] text-ink-muted">
                <ThumbsDown size={12} className="mt-[3px] shrink-0 text-risk" />
                <span>
                  <span className="text-ink">{s.label}</span> — {s.hint}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {missed.length ? (
        <div>
          <div className="label-caps">Available, not used</div>
          <ul className="mt-2 space-y-1.5">
            {missed.map((s) => (
              <li key={s.label} className="flex items-start gap-2 text-[12.5px] text-ink-faint">
                <Minus size={12} className="mt-[3px] shrink-0" />
                <span>
                  {s.label} <span className="opacity-70">(+{s.weight})</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ScoredPrompt({
  analysis,
  defaultOpen,
}: {
  analysis: PromptAnalysis;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const tone = VERDICT_TONE[analysis.verdict];

  return (
    <div
      className={cn(
        'rounded-xl border bg-raised transition-colors',
        analysis.verdict === 'strong'
          ? 'border-[rgba(63,207,142,0.22)]'
          : analysis.verdict === 'risky'
            ? 'border-[rgba(240,97,111,0.22)]'
            : 'border-hairline',
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
      >
        <span
          className={cn(
            'num mt-0.5 flex h-8 w-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold',
            analysis.verdict === 'strong'
              ? 'bg-good-soft text-good'
              : analysis.verdict === 'risky'
                ? 'bg-risk-soft text-risk'
                : 'bg-accent-soft text-accent',
          )}
        >
          {analysis.score}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] leading-relaxed text-ink">
            "{analysis.text}"
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-2">
            <Badge tone={tone}>{VERDICT_LABEL[analysis.verdict]}</Badge>
            <span className="text-[11.5px] text-ink-faint">
              {CATEGORY_LABELS[analysis.category]}
            </span>
          </span>
        </span>
      </button>

      {open ? (
        <div className="border-t border-hairline px-4 py-3.5 animate-fade-in">
          <p className="mb-3 text-[12.5px] leading-relaxed text-ink-muted">
            {analysis.rationale}
          </p>
          <SignalList signals={analysis.signals} />
        </div>
      ) : null}
    </div>
  );
}

/** Live rubric: type a prompt, watch the score move. */
function PromptLab() {
  const [text, setText] = useState('');
  const result = useMemo(() => (text.trim() ? scorePrompt(text) : null), [text]);
  const animated = useCountUp(result?.score ?? 0, 350);

  return (
    <Panel>
      <PanelHeader
        icon={<Wand2 size={15} />}
        title="Prompt lab"
        description="Paste a prompt you were about to send. The same rubric that scores your history runs on it live."
      />
      <PanelBody>
        <TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Here is my approach to..."
          aria-label="Prompt to analyse"
          className="min-h-[104px]"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setText(CONTRAST_PROMPTS.good)}
          >
            Load a strong example
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setText(CONTRAST_PROMPTS.risky)}
          >
            Load a risky example
          </Button>
          {text ? (
            <Button size="sm" variant="ghost" onClick={() => setText('')}>
              Clear
            </Button>
          ) : null}
        </div>

        {result ? (
          <div className="mt-5 rounded-xl border border-hairline bg-raised p-4 animate-fade-in">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-2">
                <span className="num text-[30px] font-semibold leading-none text-ink">
                  {Math.round(animated)}
                </span>
                <span className="text-[13px] text-ink-muted">/ 100</span>
              </div>
              <Badge tone={VERDICT_TONE[result.verdict]}>
                {VERDICT_LABEL[result.verdict]}
              </Badge>
            </div>
            <ProgressBar
              className="mt-3"
              value={result.score}
              tone={
                result.verdict === 'strong'
                  ? 'good'
                  : result.verdict === 'risky'
                    ? 'risk'
                    : 'accent'
              }
            />
            <p className="mt-3 text-[12.5px] leading-relaxed text-ink-muted">
              {result.rationale}
            </p>
            <div className="mt-4 border-t border-hairline pt-3.5">
              <SignalList signals={result.signals} />
            </div>
          </div>
        ) : (
          <p className="mt-4 text-[12.5px] text-ink-faint">
            Start typing to see the rubric apply itself, signal by signal.
          </p>
        )}
      </PanelBody>
    </Panel>
  );
}

export function PromptIntelligence() {
  const good = useMemo(() => analysePrompt('example_good', CONTRAST_PROMPTS.good), []);
  const risky = useMemo(() => analysePrompt('example_risky', CONTRAST_PROMPTS.risky), []);

  return (
    <RequireAnalytics loadingRows={5}>
      {({ snapshot, prompts, sourceMode }) => {
        const quality = snapshot.metrics.promptQuality;
        const strong = prompts.filter((p) => p.verdict === 'strong').length;
        const risk = prompts.filter((p) => p.verdict === 'risky').length;

        return (
          <div className="space-y-5 stack-anim">
            <PageHeader
              eyebrow="Prompt Intelligence"
              title="How you ask, not how often"
              description="NiyantraAI does not count AI requests. It reads the structure of the request, because 'review my approach' and 'write this for me' produce very different developers."
            />

            {/* ---------------- score ---------------- */}
            <Panel>
              <PanelBody className="pt-5">
                <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8">
                  <div>
                    <div className="label-caps">Prompt Quality Score</div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="num text-[42px] font-semibold leading-none text-ink">
                        {Math.round(quality.value)}
                      </span>
                      <span className="text-[14px] text-ink-muted">%</span>
                    </div>
                    <div className="mt-2">
                      <Badge tone={quality.delta > 0 ? 'good' : 'neutral'}>
                        {quality.delta > 0 ? '+' : ''}
                        {Math.round(quality.delta)} pts vs last week
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Analysed', value: prompts.length, tone: 'text-ink' },
                      { label: 'Strong', value: strong, tone: 'text-good' },
                      { label: 'Risky', value: risk, tone: 'text-risk' },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-hairline bg-raised px-3.5 py-3"
                      >
                        <div className="label-caps">{item.label}</div>
                        <div className={`num mt-1 text-[22px] font-semibold ${item.tone}`}>
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {quality.value >= 78 && snapshot.metrics.aiDependency.value >= 60 ? (
                  <div className="mt-5 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3.5">
                    <div className="label-caps text-warn">The pattern worth noticing</div>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink">
                      Your prompt quality is high and your dependency is also high. That is
                      not a contradiction — it means you are very good at asking, and you
                      are asking for finished work. The skill is real; it is pointed one
                      level too high.
                    </p>
                  </div>
                ) : null}
              </PanelBody>
            </Panel>

            {/* ---------------- contrast ---------------- */}
            <Panel>
              <PanelHeader
                title="Two prompts, same problem"
                description="Both are well written. Only one leaves you able to explain the result."
              />
              <PanelBody className="space-y-3">
                <ScoredPrompt analysis={good} defaultOpen />
                <ScoredPrompt analysis={risky} defaultOpen />
              </PanelBody>
            </Panel>

            {/* ---------------- lab ---------------- */}
            <PromptLab />

            {/* ---------------- history ---------------- */}
            <Panel>
              <PanelHeader
                title="Your prompts this week"
                description={`${prompts.length} prompts captured and scored, highest first.`}
                action={
                  sourceMode === 'simulated' ? (
                    <Badge tone="accent" icon={<FlaskConical size={11} />}>
                      Simulated
                    </Badge>
                  ) : null
                }
              />
              <PanelBody className="space-y-2.5">
                {prompts.length ? (
                  prompts.map((p) => <ScoredPrompt key={p.id} analysis={p} />)
                ) : (
                  <p className="py-6 text-center text-[13px] text-ink-muted">
                    No prompt text captured this week.
                  </p>
                )}
              </PanelBody>
            </Panel>

            <Note>
              <strong>Prototype heuristic.</strong> The rubric is a transparent set of
              weighted signals defined in <code className="font-mono text-[11.5px]">lib/promptAnalyzer.ts</code>
              . Swapping it for a model-based judge changes the scoring, not the product —
              the output contract is identical.
            </Note>

            <div className="flex items-center gap-2 pb-2 text-[12px] text-ink-faint">
              <Check size={13} className="text-good" />
              NiyantraAI never recommends using AI less. It recommends changing the verb.
            </div>
          </div>
        );
      }}
    </RequireAnalytics>
  );
}
