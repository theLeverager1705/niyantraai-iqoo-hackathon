import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Boxes,
  FileCode2,
  GitCommitHorizontal,
  Github,
  Plug,
  Search,
  Users,
} from 'lucide-react';
import type { RepoAnalysis } from '@/types';
import { PageHeader, Panel, PanelBody, PanelHeader } from '@/components/ui/Card';
import { Badge, type Tone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, TextInput } from '@/components/ui/Form';
import { ErrorState, Note } from '@/components/ui/Feedback';
import { ProgressBar } from '@/components/ui/Progress';
import { INTEGRATION_CATALOGUE } from '@/services/providers/aiUsageProvider';
import { analyseRepository, RepoUrlError } from '@/services/mockGitHubService';
import { useAppState } from '@/hooks/useAppState';
import { formatDate } from '@/lib/utils';

const AVAILABILITY_TONE: Record<string, Tone> = {
  available: 'good',
  'requires-extension': 'warn',
  planned: 'neutral',
};

const AVAILABILITY_LABEL: Record<string, string> = {
  available: 'Available',
  'requires-extension': 'Needs extension',
  planned: 'Planned',
};

export function Integrations() {
  const navigate = useNavigate();
  const { project, attachRepoAnalysis } = useAppState();

  const [url, setUrl] = useState(project?.repoUrl ?? '');
  const [status, setStatus] = useState<'idle' | 'analysing' | 'done' | 'error'>(
    project?.analysis ? 'done' : 'idle',
  );
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<RepoAnalysis | null>(project?.analysis ?? null);

  const analyse = async () => {
    setError(null);
    setStatus('analysing');
    try {
      const result = await analyseRepository(url, { stack: project?.stack });
      setAnalysis(result);
      attachRepoAnalysis(result);
      setStatus('done');
    } catch (err) {
      setError(
        err instanceof RepoUrlError
          ? err.message
          : 'Analysis failed. Check the URL and try again.',
      );
      setStatus('error');
    }
  };

  return (
    <div className="space-y-5 stack-anim">
      <PageHeader
        eyebrow="Integrations"
        title="Where AI activity comes from"
        description="NiyantraAI is built around one seam: an AI Usage Provider. Swap the provider and everything downstream keeps working unchanged."
      />

      {/* ---------------- GitHub ---------------- */}
      <Panel>
        <PanelHeader
          icon={<Github size={15} />}
          title="Connect a repository"
          description="Repository analysis drives project-specific questions: structure, languages, commit cadence, documentation and complexity."
          action={<Badge tone="warn">Simulated in this prototype</Badge>}
        />
        <PanelBody>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Field label="GitHub repository URL" htmlFor="repoUrl">
                <TextInput
                  id="repoUrl"
                  value={url}
                  placeholder="https://github.com/owner/repo"
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && url.trim()) analyse();
                  }}
                />
              </Field>
            </div>
            <Button
              onClick={analyse}
              loading={status === 'analysing'}
              disabled={!url.trim()}
              icon={status === 'analysing' ? undefined : <Search size={14} />}
              className="sm:mb-0"
            >
              {status === 'analysing' ? 'Analysing' : 'Analyse repository'}
            </Button>
          </div>

          {error ? (
            <div className="mt-4">
              <ErrorState title="Could not analyse" description={error} onRetry={analyse} />
            </div>
          ) : null}

          {status === 'analysing' ? (
            <div className="mt-5 space-y-2 text-[13px] text-ink-muted">
              {[
                'Reading repository tree',
                'Detecting languages and frameworks',
                'Measuring module complexity',
                'Deriving assessable concepts',
              ].map((line, i) => (
                <div
                  key={line}
                  className="flex items-center gap-2 animate-fade-in"
                  style={{ animationDelay: `${i * 220}ms` }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {line}
                </div>
              ))}
            </div>
          ) : null}

          {analysis && status === 'done' ? (
            <div className="mt-5 space-y-4 animate-fade-up">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-raised px-4 py-3">
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium text-ink">
                    {analysis.owner}/{analysis.repo}
                  </div>
                  <div className="mt-0.5 text-[12px] text-ink-faint">
                    Analysed {formatDate(analysis.analysedAt)} · source: {analysis.source}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  iconAfter={<ArrowRight size={14} />}
                  onClick={() => navigate('/app/project')}
                >
                  Generate questions
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  { icon: GitCommitHorizontal, label: 'Commits', value: analysis.commits },
                  { icon: Users, label: 'Contributors', value: analysis.contributors },
                  { icon: Boxes, label: 'Modules', value: analysis.modules.length },
                  {
                    icon: FileCode2,
                    label: 'Docs score',
                    value: `${analysis.documentationScore}%`,
                  },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-hairline bg-raised px-3.5 py-3"
                    >
                      <div className="flex items-center gap-1.5 text-ink-faint">
                        <Icon size={12} />
                        <span className="text-[11px]">{stat.label}</span>
                      </div>
                      <div className="num mt-1 text-[19px] font-medium text-ink">
                        {stat.value}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-hairline bg-raised p-4">
                  <div className="label-caps mb-3">Languages</div>
                  <div className="space-y-2.5">
                    {analysis.languages.map((lang) => (
                      <div key={lang.name}>
                        <div className="mb-1 flex items-baseline justify-between gap-2">
                          <span className="text-[12.5px] text-ink">{lang.name}</span>
                          <span className="num text-[12px] text-ink-muted">{lang.share}%</span>
                        </div>
                        <ProgressBar value={lang.share} tone="accent" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-hairline bg-raised p-4">
                  <div className="label-caps mb-3">Modules</div>
                  <div className="space-y-2.5">
                    {analysis.modules.map((mod) => (
                      <div key={mod.path} className="text-[12.5px]">
                        <div className="flex items-baseline justify-between gap-2">
                          <code className="font-mono text-[12px] text-ink">{mod.path}</code>
                          <span className="num text-[11.5px] text-ink-faint">
                            {Math.round(mod.aiAuthoredShare * 100)}% AI-authored
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-muted">
                          {mod.role}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-hairline bg-raised p-4">
                <div className="label-caps mb-2">Architecture summary</div>
                <p className="text-[13px] leading-relaxed text-ink-muted">
                  {analysis.architectureSummary}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {analysis.detectedConcepts.map((concept) => (
                    <span
                      key={concept}
                      className="rounded-md border border-hairline bg-surface px-2 py-1 text-[11.5px] text-ink-muted"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </PanelBody>
      </Panel>

      {/* ---------------- catalogue ---------------- */}
      <Panel>
        <PanelHeader
          icon={<Plug size={15} />}
          title="AI usage providers"
          description="What each source can realistically provide, and what it would take to enable it."
        />
        <PanelBody className="space-y-3">
          {INTEGRATION_CATALOGUE.map((entry) => (
            <div
              key={entry.id}
              className="rounded-xl border border-hairline bg-raised px-4 py-3.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[13.5px] font-medium text-ink">{entry.label}</h3>
                <Badge tone={AVAILABILITY_TONE[entry.availability] ?? 'neutral'}>
                  {AVAILABILITY_LABEL[entry.availability] ?? entry.availability}
                </Badge>
              </div>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">
                {entry.description}
              </p>
              <p className="mt-2 text-[11.5px] text-ink-faint">
                Provides: {entry.capability}
              </p>
            </div>
          ))}
        </PanelBody>
      </Panel>

      <Note tone="warn">
        <strong>What NiyantraAI will not claim.</strong> There is no API that grants a third
        party access to your private ChatGPT or Claude history. A real integration is either
        an editor extension running locally with your consent, or an export you choose to
        upload. Everything in this prototype is labelled simulated for exactly that reason.
      </Note>
    </div>
  );
}
