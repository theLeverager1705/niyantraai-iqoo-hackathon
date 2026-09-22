import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Lock, ShieldCheck, Trash2, TriangleAlert, User } from 'lucide-react';
import { PageHeader, Panel, PanelBody, PanelHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Form';
import { Note } from '@/components/ui/Feedback';
import { AREA_LABELS, LEVEL_LABELS, TOOL_LABELS } from '@/data/taxonomy';
import { useAppState } from '@/hooks/useAppState';

export function Settings() {
  const navigate = useNavigate();
  const {
    user,
    project,
    privacy,
    updatePrivacy,
    exportData,
    deleteProjectData,
    resetEverything,
    storageAvailable,
    assessments,
  } = useAppState();

  const [confirming, setConfirming] = useState<'project' | 'all' | null>(null);

  return (
    <div className="space-y-5 stack-anim">
      <PageHeader
        eyebrow="Privacy & Settings"
        title="Your development data belongs to you"
        description="NiyantraAI analyses developer behaviour, which makes privacy a design constraint rather than a policy page. In this prototype nothing leaves your browser."
      />

      {/* ---------------- profile ---------------- */}
      <Panel>
        <PanelHeader icon={<User size={15} />} title="Profile" />
        <PanelBody>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Name', value: user?.name ?? '—' },
              { label: 'Level', value: user ? LEVEL_LABELS[user.level] : '—' },
              { label: 'Primary area', value: user ? AREA_LABELS[user.area] : '—' },
              { label: 'Assessments completed', value: String(assessments.length) },
            ].map((item) => (
              <div key={item.label}>
                <dt className="label-caps">{item.label}</dt>
                <dd className="mt-1.5 text-[14px] text-ink">{item.value}</dd>
              </div>
            ))}
          </dl>

          {user?.tools.length ? (
            <div className="mt-5">
              <div className="label-caps mb-2">AI tools</div>
              <div className="flex flex-wrap gap-1.5">
                {user.tools.map((tool) => (
                  <span
                    key={tool}
                    className="rounded-md border border-hairline bg-raised px-2 py-1 text-[11.5px] text-ink-muted"
                  >
                    {TOOL_LABELS[tool]}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {user?.isDemo ? (
            <Note className="mt-5" tone="info">
              You are in <strong>Demo Mode</strong> with a pre-populated profile. Resetting
              returns you to the landing page where you can run the real onboarding.
            </Note>
          ) : null}
        </PanelBody>
      </Panel>

      {/* ---------------- controls ---------------- */}
      <Panel>
        <PanelHeader
          icon={<Lock size={15} />}
          title="Data controls"
          description="Every switch takes effect immediately. Turning analytics off stops measurement rather than hiding it."
        />
        <PanelBody>
          <div className="divide-y divide-hairline">
            <Toggle
              id="tracking"
              checked={privacy.aiActivityTracking}
              onChange={(v) => updatePrivacy({ aiActivityTracking: v })}
              label="AI activity tracking"
              description="Record interactions with assistants: category, assistance level, acceptance and edits."
            />
            <Toggle
              id="github"
              checked={privacy.githubAccess}
              onChange={(v) => updatePrivacy({ githubAccess: v })}
              label="GitHub access"
              description="Allow repository structure and commit metadata to be read for project questions."
            />
            <Toggle
              id="analytics"
              checked={privacy.analyticsCollection}
              onChange={(v) => updatePrivacy({ analyticsCollection: v })}
              label="Analytics collection"
              description="Compute dependency, understanding and balance scores. Turning this off empties your dashboard."
            />
            <Toggle
              id="promptText"
              checked={privacy.promptTextRetention}
              onChange={(v) => updatePrivacy({ promptTextRetention: v })}
              label="Prompt text retention"
              description="Keep the text of prompts so Prompt Intelligence can show examples. Scores can still be computed without it."
            />
            <Toggle
              id="benchmarks"
              checked={privacy.shareAnonymisedBenchmarks}
              onChange={(v) => updatePrivacy({ shareAnonymisedBenchmarks: v })}
              label="Share anonymised benchmarks"
              description="Contribute aggregate scores to cohort comparisons. Off by default, and never includes prompt text."
            />
          </div>

          {!privacy.analyticsCollection ? (
            <Note className="mt-4" tone="warn" icon={<TriangleAlert size={14} />}>
              Analytics collection is off, so your dashboard, coach and reports have no data
              to work from. No history was kept while it was disabled.
            </Note>
          ) : null}
        </PanelBody>
      </Panel>

      {/* ---------------- data ---------------- */}
      <Panel>
        <PanelHeader
          icon={<ShieldCheck size={15} />}
          title="Your data"
          description={
            storageAvailable
              ? 'Stored in this browser only. No server, no account, no third party.'
              : 'Browser storage is unavailable, so this session is held in memory and will be lost on reload.'
          }
          action={
            storageAvailable ? (
              <Badge tone="good">Local only</Badge>
            ) : (
              <Badge tone="warn">In-memory session</Badge>
            )
          }
        />
        <PanelBody className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-raised px-4 py-3.5">
            <div className="min-w-0">
              <div className="text-[13.5px] font-medium text-ink">Export everything</div>
              <p className="mt-0.5 text-[12.5px] text-ink-muted">
                Download your profile, assessments and computed metrics as JSON.
              </p>
            </div>
            <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={exportData}>
              Export
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-raised px-4 py-3.5">
            <div className="min-w-0">
              <div className="text-[13.5px] font-medium text-ink">Delete project data</div>
              <p className="mt-0.5 text-[12.5px] text-ink-muted">
                Removes {project?.name ?? 'the connected project'}, its repository analysis
                and its understanding profile. Your baseline is kept.
              </p>
            </div>
            {confirming === 'project' ? (
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    deleteProjectData();
                    setConfirming(null);
                  }}
                >
                  Confirm delete
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirming(null)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                icon={<Trash2 size={14} />}
                disabled={!project}
                onClick={() => setConfirming('project')}
              >
                Delete
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[rgba(240,97,111,0.22)] bg-risk-soft px-4 py-3.5">
            <div className="min-w-0">
              <div className="text-[13.5px] font-medium text-ink">Reset everything</div>
              <p className="mt-0.5 text-[12.5px] text-ink-muted">
                Erases the profile, all assessments and stored settings, then returns to the
                landing page. This cannot be undone.
              </p>
            </div>
            {confirming === 'all' ? (
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    resetEverything();
                    setConfirming(null);
                    navigate('/');
                  }}
                >
                  Erase everything
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirming(null)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 size={14} />}
                onClick={() => setConfirming('all')}
              >
                Reset
              </Button>
            )}
          </div>
        </PanelBody>
      </Panel>

      <Note>
        <strong>Prototype disclosure.</strong> AI activity shown throughout this app is
        simulated demo data generated locally from a fixed seed. No assistant account is
        connected, no network request carries your data, and all scoring is an explainable
        heuristic rather than a validated instrument.
      </Note>
    </div>
  );
}
