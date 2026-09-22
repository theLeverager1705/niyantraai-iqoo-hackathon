import {
  Award,
  Brain,
  Bug,
  Compass,
  Flame,
  Layers,
  MessageSquare,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader, Panel, PanelBody, PanelHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Progress';
import { Note } from '@/components/ui/Feedback';
import { useAppState } from '@/hooks/useAppState';
import { cn } from '@/lib/utils';

const ICONS: Record<string, LucideIcon> = {
  brain: Brain,
  compass: Compass,
  bug: Bug,
  layers: Layers,
  sparkles: Sparkles,
  message: MessageSquare,
  shield: Shield,
  flame: Flame,
};

export function Achievements() {
  const { achievements, xp, user } = useAppState();
  const earned = achievements.filter((a) => a.earned);
  const pending = achievements.filter((a) => !a.earned);

  return (
    <div className="space-y-5 stack-anim">
      <PageHeader
        eyebrow="Progress"
        title="Achievements"
        description="Benchmarks, not stickers. Each one is a threshold on measured behaviour, and each one can be lost again if the behaviour stops."
      />

      <Panel>
        <PanelBody className="pt-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <div className="label-caps">Developer XP</div>
              <div className="num mt-2 flex items-baseline gap-1.5 text-[34px] font-semibold text-ink">
                {xp.toLocaleString()}
                <Zap size={18} className="text-warn" />
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-ink-faint">
                Derived from attempts, follow-ups, explanation requests and assessments —
                never from time spent in the app.
              </p>
            </div>
            <div>
              <div className="label-caps">Streak</div>
              <div className="num mt-2 flex items-baseline gap-1.5 text-[34px] font-semibold text-ink">
                {user?.streakDays ?? 0}
                <Flame size={18} className="text-warn" />
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-ink-faint">
                {user?.streakDays
                  ? `${user.streakDays}-day independent thinking streak.`
                  : 'Attempt a problem before asking to start a streak.'}
              </p>
            </div>
            <div>
              <div className="label-caps">Benchmarks met</div>
              <div className="num mt-2 flex items-baseline gap-1.5 text-[34px] font-semibold text-ink">
                {earned.length}
                <span className="text-[16px] text-ink-faint">/ {achievements.length}</span>
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-ink-faint">
                Recomputed from this week's behaviour every time analytics reload.
              </p>
            </div>
          </div>
        </PanelBody>
      </Panel>

      {earned.length ? (
        <Panel>
          <PanelHeader
            icon={<Award size={15} className="text-good" />}
            title="Earned"
            description="Currently met by your behaviour this week."
          />
          <PanelBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {earned.map((a) => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </PanelBody>
        </Panel>
      ) : null}

      {pending.length ? (
        <Panel>
          <PanelHeader
            title="In progress"
            description="Each shows exactly how far you are from the threshold."
          />
          <PanelBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pending.map((a) => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </PanelBody>
        </Panel>
      ) : null}

      <Note>
        Achievements exist to make a benchmark legible, not to reward engagement. Nothing
        here is earned by opening the app, and there is no penalty attached to any of them.
      </Note>
    </div>
  );
}

function AchievementCard({
  achievement,
}: {
  achievement: ReturnType<typeof useAppState>['achievements'][number];
}) {
  const Icon = ICONS[achievement.icon] ?? Award;
  const pct = Math.min(100, (achievement.progress / achievement.target) * 100);

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-colors',
        achievement.earned
          ? 'border-[rgba(63,207,142,0.25)] bg-good-soft'
          : 'border-hairline bg-raised',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl border',
            achievement.earned
              ? 'border-[rgba(63,207,142,0.3)] bg-good/10 text-good'
              : 'border-hairline bg-surface text-ink-faint',
          )}
        >
          <Icon size={16} />
        </span>
        {achievement.earned ? (
          <Badge tone="good">Earned</Badge>
        ) : (
          <span className="num text-[11.5px] text-ink-faint">
            {Math.min(achievement.progress, achievement.target)} / {achievement.target}
          </span>
        )}
      </div>

      <h3 className="mt-3 text-[13.5px] font-medium text-ink">{achievement.name}</h3>
      <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
        {achievement.description}
      </p>

      {!achievement.earned ? (
        <ProgressBar className="mt-3" value={pct} tone="accent" label={achievement.name} />
      ) : null}
    </div>
  );
}
