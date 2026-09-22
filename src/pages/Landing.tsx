import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Brain,
  Compass,
  FlaskConical,
  GitBranch,
  LineChart,
  MessageSquareCode,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { Button, LinkButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Wordmark } from '@/components/layout/Logo';
import { useAppState } from '@/hooks/useAppState';
import { useCountUp } from '@/components/ui/Progress';

const SIGNALS = [
  { label: 'AI Usage', value: 69, suffix: '%', tone: 'text-accent', hint: 'requests this week' },
  { label: 'Skill Growth', value: 16, suffix: ' pts', tone: 'text-good', hint: 'week over week' },
  { label: 'Project Understanding', value: 83, suffix: '%', tone: 'text-info', hint: 'verified by questions' },
  { label: 'Independent Thinking', value: 73, suffix: '%', tone: 'text-warn', hint: 'attempt-first behaviour' },
];

function SignalTile({
  label,
  value,
  suffix,
  tone,
  hint,
  delay,
}: (typeof SIGNALS)[number] & { delay: number }) {
  const animated = useCountUp(value, 1400);
  return (
    <div
      className="panel px-4 py-4 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="label-caps">{label}</div>
      <div className={`num mt-2 text-[26px] font-semibold ${tone}`}>
        {Math.round(animated)}
        <span className="text-[15px] font-medium opacity-70">{suffix}</span>
      </div>
      <div className="mt-1 text-[11.5px] text-ink-faint">{hint}</div>
    </div>
  );
}

const PILLARS = [
  {
    icon: LineChart,
    title: 'Dependency analytics',
    body: 'Fourteen days of AI activity turned into five numbers that say how much of your reasoning is still yours.',
  },
  {
    icon: MessageSquareCode,
    title: 'Prompt intelligence',
    body: 'We read how you ask, not how often. "Review my approach" and "write this for me" are not the same request.',
  },
  {
    icon: Target,
    title: 'Understanding tests',
    body: 'Adaptive questions about the code you shipped. Working software is not evidence that you understand it.',
  },
  {
    icon: Compass,
    title: 'A coach, not a limiter',
    body: 'Every recommendation names the behaviour, the evidence, and the smallest change that moves it.',
  },
];

export function Landing() {
  const navigate = useNavigate();
  const { startDemo, onboarded } = useAppState();

  const openDemo = () => {
    startDemo();
    navigate('/app');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas aurora">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[620px] grid-fade" aria-hidden />

      <div className="relative z-10">
        {/* ---------------- top bar ---------------- */}
        <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Wordmark />
          <div className="flex items-center gap-2">
            {onboarded ? (
              <LinkButton to="/app" variant="secondary" size="sm">
                Open app
              </LinkButton>
            ) : null}
            <Button variant="ghost" size="sm" onClick={openDemo}>
              Demo mode
            </Button>
          </div>
        </header>

        {/* ---------------- hero ---------------- */}
        <section className="mx-auto max-w-6xl px-5 pb-6 pt-10 text-center sm:px-8 sm:pt-16">
          <div className="animate-fade-up">
            <Badge tone="accent" icon={<Sparkles size={11} />}>
              Intelligent AI Dependency Regulation
            </Badge>
          </div>

          <h1
            className="mx-auto mt-6 max-w-3xl text-balance text-[36px] font-semibold leading-[1.07] tracking-[-0.035em] text-ink animate-fade-up sm:text-[56px]"
            style={{ animationDelay: '60ms' }}
          >
            Build with AI.
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-accent via-[#9aa5ff] to-info bg-clip-text text-transparent">
              {' '}
              Think for yourself.
            </span>
          </h1>

          <p
            className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-ink-muted animate-fade-up sm:text-[17px]"
            style={{ animationDelay: '110ms' }}
          >
            NiyantraAI helps developers measure AI dependency, understand their learning
            patterns, and build stronger technical skills.
          </p>

          <div
            className="mt-8 flex flex-col items-center justify-center gap-3 animate-fade-up sm:flex-row"
            style={{ animationDelay: '160ms' }}
          >
            <LinkButton
              to="/onboarding"
              size="lg"
              className="w-full sm:w-auto"
              iconAfter={<ArrowRight size={16} />}
            >
              Start Assessment
            </LinkButton>
            <Button
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto"
              icon={<FlaskConical size={16} />}
              onClick={openDemo}
            >
              Explore Dashboard
            </Button>
          </div>

          <p
            className="mt-4 text-[12.5px] text-ink-faint animate-fade-up"
            style={{ animationDelay: '200ms' }}
          >
            Demo mode opens a pre-populated profile. No account, no setup.
          </p>

          {/* signals */}
          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-3 text-left lg:grid-cols-4">
            {SIGNALS.map((signal, i) => (
              <SignalTile key={signal.label} {...signal} delay={260 + i * 70} />
            ))}
          </div>
        </section>

        {/* ---------------- the problem ---------------- */}
        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="panel overflow-hidden">
            <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
              <div>
                <div className="label-caps">The new problem</div>
                <h2 className="mt-3 text-[24px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[30px]">
                  You can now finish a project without ever understanding it.
                </h2>
                <p className="mt-4 text-[14.5px] leading-relaxed text-ink-muted">
                  AI assistants can generate an entire application, debug it, design its
                  architecture and document it. The code works. The demo passes. And then
                  something breaks in production, and nobody on the team has a model of how
                  it fits together.
                </p>
                <p className="mt-4 text-[14.5px] leading-relaxed text-ink-muted">
                  NiyantraAI does not measure how much you use AI. It measures whether that
                  usage is turning into understanding.
                </p>
                <div className="mt-6 rounded-xl border border-accent-line bg-accent-soft px-4 py-3.5">
                  <p className="text-[14px] font-medium leading-relaxed text-ink">
                    "AI usage is not the problem. Unconscious dependence is."
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-hairline bg-raised p-5">
                <div className="flex items-center gap-2 text-[12.5px] text-ink-muted">
                  <Brain size={14} className="text-accent" />
                  Project Understanding Test
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    'What happens between the moment the user submits the login form and the moment authentication succeeds?',
                    'Why did you choose JWT instead of server-side sessions?',
                    'If the database becomes unavailable, which part of your application fails first?',
                  ].map((q, i) => (
                    <div
                      key={q}
                      className="rounded-xl border border-hairline bg-surface px-4 py-3.5"
                    >
                      <div className="text-[11px] font-medium text-ink-faint">
                        Question {i + 1}
                      </div>
                      <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink">{q}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[12.5px] leading-relaxed text-ink-faint">
                  Answers are scored on whether you explain the mechanism, not whether you
                  match a model answer.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- pillars ---------------- */}
        <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div key={pillar.title} className="panel p-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-hairline bg-raised text-accent">
                    <Icon size={16} />
                  </div>
                  <h3 className="mt-4 text-[14.5px] font-medium text-ink">{pillar.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{pillar.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ---------------- honesty ---------------- */}
        <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="panel p-6">
              <div className="flex items-center gap-2 text-good">
                <ShieldCheck size={16} />
                <h3 className="text-[14.5px] font-medium text-ink">What this prototype does</h3>
              </div>
              <ul className="mt-4 space-y-2.5 text-[13px] leading-relaxed text-ink-muted">
                <li>Runs a real analytics engine over fourteen days of AI activity.</li>
                <li>Scores prompts live against a published rubric you can inspect.</li>
                <li>Adapts assessment difficulty from your answers and re-scores your profile.</li>
                <li>Works end to end with no API keys, no accounts and no network.</li>
              </ul>
            </div>
            <div className="panel p-6">
              <div className="flex items-center gap-2 text-warn">
                <GitBranch size={16} />
                <h3 className="text-[14.5px] font-medium text-ink">What is simulated</h3>
              </div>
              <ul className="mt-4 space-y-2.5 text-[13px] leading-relaxed text-ink-muted">
                <li>The AI activity feed is seeded demo data, labelled everywhere it appears.</li>
                <li>Repository analysis is deterministic mock output, not the GitHub API.</li>
                <li>
                  No product can read your private ChatGPT or Claude history. Real
                  integrations would be an editor extension or an export you hand over.
                </li>
                <li>Scores are an explainable prototype heuristic, not a validated instrument.</li>
              </ul>
            </div>
          </div>
        </section>

        <footer className="border-t border-hairline">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-7 sm:flex-row sm:px-8">
            <Wordmark />
            <p className="text-[12.5px] text-ink-faint">
              Build with AI. Understand what you build.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
