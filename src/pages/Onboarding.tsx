import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  FolderGit2,
  Layers,
  User as UserIcon,
} from 'lucide-react';
import type { AITool, DevelopmentArea, DeveloperLevel } from '@/types';
import {
  ALL_AREAS,
  ALL_TOOLS,
  AREA_LABELS,
  LEVEL_BLURB,
  LEVEL_LABELS,
  TOOL_LABELS,
} from '@/data/taxonomy';
import { Button } from '@/components/ui/Button';
import { Field, OptionCard, TextInput } from '@/components/ui/Form';
import { Note } from '@/components/ui/Feedback';
import { ProgressBar } from '@/components/ui/Progress';
import { Wordmark } from '@/components/layout/Logo';
import { useAppState } from '@/hooks/useAppState';
import { parseRepoUrl, RepoUrlError } from '@/services/mockGitHubService';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 'you', label: 'About you', icon: UserIcon },
  { id: 'focus', label: 'Focus area', icon: Layers },
  { id: 'tools', label: 'AI tools', icon: Bot },
  { id: 'project', label: 'Current project', icon: FolderGit2 },
] as const;

export function Onboarding() {
  const navigate = useNavigate();
  const { startPersonal } = useAppState();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [level, setLevel] = useState<DeveloperLevel>('intermediate');
  const [area, setArea] = useState<DevelopmentArea>('web');
  const [tools, setTools] = useState<AITool[]>(['chatgpt']);
  const [projectName, setProjectName] = useState('');
  const [stack, setStack] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [repoError, setRepoError] = useState<string | undefined>();

  const canContinue = useMemo(() => {
    if (step === 0) return name.trim().length >= 2;
    if (step === 2) return tools.length > 0;
    return true;
  }, [step, name, tools]);

  const toggleTool = (tool: AITool) => {
    setTools((current) =>
      current.includes(tool) ? current.filter((t) => t !== tool) : [...current, tool],
    );
  };

  const finish = () => {
    if (repoUrl.trim()) {
      try {
        parseRepoUrl(repoUrl);
      } catch (error) {
        setRepoError(
          error instanceof RepoUrlError ? error.message : 'Could not read that URL.',
        );
        return;
      }
    }

    startPersonal({
      user: { name: name.trim(), level, area, tools },
      project: projectName.trim()
        ? {
            name: projectName.trim(),
            stack: stack
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
            repoUrl: repoUrl.trim() || undefined,
          }
        : null,
    });
    navigate('/baseline');
  };

  const next = () => (step === STEPS.length - 1 ? finish() : setStep((s) => s + 1));
  const back = () => (step === 0 ? navigate('/') : setStep((s) => s - 1));

  return (
    <div className="relative min-h-screen bg-canvas aurora">
      <div className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col px-5 py-6 sm:px-6">
        <header className="mb-8 flex items-center justify-between">
          <Wordmark />
          <span className="text-[12.5px] text-ink-faint">
            Step {step + 1} of {STEPS.length}
          </span>
        </header>

        <ProgressBar value={((step + 1) / STEPS.length) * 100} label="Onboarding progress" />

        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <div
                key={s.id}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px]',
                  active
                    ? 'border-accent-line bg-accent-soft text-accent'
                    : done
                      ? 'border-hairline bg-raised text-ink-muted'
                      : 'border-hairline bg-transparent text-ink-faint',
                )}
              >
                {done ? <Check size={11} /> : <Icon size={11} />}
                {s.label}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex-1">
          {step === 0 ? (
            <section className="space-y-6 animate-fade-up">
              <div>
                <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-ink">
                  Let's set your baseline
                </h1>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
                  NiyantraAI needs a picture of where you are now, before heavy AI
                  assistance, so later changes mean something.
                </p>
              </div>

              <Field label="What should we call you?" htmlFor="name">
                <TextInput
                  id="name"
                  value={name}
                  autoFocus
                  placeholder="Alex"
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && canContinue) next();
                  }}
                />
              </Field>

              <Field label="Developer level" hint="This sets your starting question difficulty.">
                <div className="grid gap-2" role="radiogroup" aria-label="Developer level">
                  {(Object.keys(LEVEL_LABELS) as DeveloperLevel[]).map((value) => (
                    <OptionCard
                      key={value}
                      selected={level === value}
                      onSelect={() => setLevel(value)}
                      title={LEVEL_LABELS[value]}
                      description={LEVEL_BLURB[value]}
                    />
                  ))}
                </div>
              </Field>
            </section>
          ) : null}

          {step === 1 ? (
            <section className="space-y-6 animate-fade-up">
              <div>
                <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-ink">
                  Where do you spend most of your time?
                </h1>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
                  Questions and recommendations are weighted toward this area.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Primary area">
                {ALL_AREAS.map((value) => (
                  <OptionCard
                    key={value}
                    compact
                    selected={area === value}
                    onSelect={() => setArea(value)}
                    title={AREA_LABELS[value]}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="space-y-6 animate-fade-up">
              <div>
                <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-ink">
                  Which assistants do you work with?
                </h1>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
                  Select every tool you use. Nothing here is discouraged — this only tells us
                  which activity sources to look for.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="AI tools">
                {ALL_TOOLS.map((tool) => (
                  <OptionCard
                    key={tool}
                    compact
                    selected={tools.includes(tool)}
                    onSelect={() => toggleTool(tool)}
                    title={TOOL_LABELS[tool]}
                  />
                ))}
              </div>
              <Note>
                In this prototype all activity is simulated. Real usage would come from an
                editor extension you install, or a conversation export you choose to upload.
              </Note>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="space-y-6 animate-fade-up">
              <div>
                <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-ink">
                  What are you building right now?
                </h1>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
                  Understanding questions are generated about this project. You can skip this
                  and add it later.
                </p>
              </div>

              <Field label="Project name" htmlFor="project" optional>
                <TextInput
                  id="project"
                  value={projectName}
                  placeholder="AI Resume Analyzer"
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </Field>

              <Field
                label="Technology stack"
                htmlFor="stack"
                optional
                hint="Comma separated. Used to pick project-relevant questions."
              >
                <TextInput
                  id="stack"
                  value={stack}
                  placeholder="React, Node.js, PostgreSQL, OpenAI API"
                  onChange={(e) => setStack(e.target.value)}
                />
              </Field>

              <Field
                label="GitHub repository"
                htmlFor="repo"
                optional
                error={repoError}
                hint="Analysis in this prototype is simulated, deterministic per repository."
              >
                <TextInput
                  id="repo"
                  value={repoUrl}
                  placeholder="https://github.com/owner/repo"
                  onChange={(e) => {
                    setRepoUrl(e.target.value);
                    setRepoError(undefined);
                  }}
                />
              </Field>
            </section>
          ) : null}
        </div>

        <footer className="sticky bottom-0 mt-8 flex items-center justify-between gap-3 border-t border-hairline bg-canvas/90 py-4 backdrop-blur">
          <Button variant="ghost" onClick={back} icon={<ArrowLeft size={15} />}>
            Back
          </Button>
          <Button onClick={next} disabled={!canContinue} iconAfter={<ArrowRight size={15} />}>
            {step === STEPS.length - 1 ? 'Start baseline assessment' : 'Continue'}
          </Button>
        </footer>
      </div>
    </div>
  );
}
