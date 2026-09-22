import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  Achievement,
  Assessment,
  PrivacySettings,
  Project,
  ProjectUnderstanding,
  RepoAnalysis,
  User,
} from '@/types';
import {
  DEFAULT_PRIVACY,
  DEMO_BASELINE,
  DEMO_PROJECT,
  DEMO_UNDERSTANDING,
  DEMO_USER,
  deriveEvidence,
} from '@/data/demoProfile';
import { NEUTRAL_EVIDENCE, type AssessmentEvidence } from '@/lib/analyticsEngine';
import { buildAchievements, computeXp } from '@/lib/achievements';
import { windowStatsFor } from '@/lib/analyticsEngine';
import { loadAnalytics, type AnalyticsBundle } from '@/services/mockAIAnalyticsService';
import {
  clearState,
  exportState,
  isStorageAvailable,
  loadState,
  saveState,
} from '@/services/storage';
import { uid } from '@/lib/utils';

export type AppMode = 'demo' | 'personal';

interface AppState {
  ready: boolean;
  mode: AppMode | null;
  user: User | null;
  project: Project | null;
  baseline: Assessment | null;
  assessments: Assessment[];
  understanding: ProjectUnderstanding | null;
  privacy: PrivacySettings;
  analytics: AnalyticsBundle | null;
  analyticsError: string | null;
  analyticsLoading: boolean;
  storageAvailable: boolean;
}

interface AppActions {
  startDemo: () => void;
  startPersonal: (input: {
    user: Omit<User, 'id' | 'createdAt' | 'xp' | 'streakDays' | 'isDemo'>;
    project: Omit<Project, 'id'> | null;
  }) => void;
  completeBaseline: (assessment: Assessment) => void;
  recordAssessment: (assessment: Assessment, understanding?: ProjectUnderstanding) => void;
  attachRepoAnalysis: (analysis: RepoAnalysis) => void;
  updatePrivacy: (patch: Partial<PrivacySettings>) => void;
  exportData: () => void;
  deleteProjectData: () => void;
  resetEverything: () => void;
  refreshAnalytics: () => void;
}

interface AppDerived {
  evidence: AssessmentEvidence;
  achievements: Achievement[];
  xp: number;
  onboarded: boolean;
  hasBaseline: boolean;
}

type AppContextValue = AppState & AppActions & AppDerived;

const AppContext = createContext<AppContextValue | null>(null);

const emptyState: AppState = {
  ready: false,
  mode: null,
  user: null,
  project: null,
  baseline: null,
  assessments: [],
  understanding: null,
  privacy: DEFAULT_PRIVACY,
  analytics: null,
  analyticsError: null,
  analyticsLoading: false,
  storageAvailable: true,
};

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(emptyState);
  const [reloadToken, setReloadToken] = useState(0);

  /* ---------------- hydrate ---------------- */

  useEffect(() => {
    const persisted = loadState();
    if (persisted) {
      setState((s) => ({
        ...s,
        ready: true,
        mode: persisted.mode,
        user: persisted.user,
        project: persisted.project,
        baseline: persisted.baseline,
        assessments: persisted.assessments ?? [],
        understanding: persisted.understanding,
        privacy: persisted.privacy ?? DEFAULT_PRIVACY,
        storageAvailable: isStorageAvailable(),
      }));
    } else {
      setState((s) => ({ ...s, ready: true, storageAvailable: isStorageAvailable() }));
    }
  }, []);

  /* ---------------- persist ---------------- */

  useEffect(() => {
    if (!state.ready || !state.mode || !state.user) return;
    saveState({
      mode: state.mode,
      user: state.user,
      project: state.project,
      baseline: state.baseline,
      assessments: state.assessments,
      understanding: state.understanding,
      privacy: state.privacy,
    });
  }, [
    state.ready,
    state.mode,
    state.user,
    state.project,
    state.baseline,
    state.assessments,
    state.understanding,
    state.privacy,
  ]);

  /* ---------------- derived evidence ---------------- */

  const evidence = useMemo<AssessmentEvidence>(() => {
    if (!state.baseline) {
      return state.understanding
        ? deriveEvidence({}, NEUTRAL_EVIDENCE.overall, state.understanding)
        : NEUTRAL_EVIDENCE;
    }
    return deriveEvidence(
      state.baseline.dimensionScores,
      state.baseline.overallScore,
      state.understanding,
    );
  }, [state.baseline, state.understanding]);

  /* ---------------- analytics ---------------- */

  useEffect(() => {
    if (!state.ready || !state.mode) return;

    let cancelled = false;
    setState((s) => ({ ...s, analyticsLoading: true, analyticsError: null }));

    if (!state.privacy.analyticsCollection) {
      setState((s) => ({
        ...s,
        analyticsLoading: false,
        analytics: null,
        analyticsError: 'paused',
      }));
      return;
    }

    loadAnalytics(evidence, state.understanding)
      .then((bundle) => {
        if (cancelled) return;
        setState((s) => ({ ...s, analytics: bundle, analyticsLoading: false }));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState((s) => ({
          ...s,
          analyticsLoading: false,
          analyticsError:
            error instanceof Error ? error.message : 'Could not load AI activity.',
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [
    state.ready,
    state.mode,
    state.privacy.analyticsCollection,
    evidence,
    state.understanding,
    reloadToken,
  ]);

  /* ---------------- actions ---------------- */

  const startDemo = useCallback(() => {
    setState((s) => ({
      ...s,
      mode: 'demo',
      user: DEMO_USER,
      project: DEMO_PROJECT,
      baseline: DEMO_BASELINE,
      assessments: [DEMO_BASELINE],
      understanding: DEMO_UNDERSTANDING,
      privacy: DEFAULT_PRIVACY,
      analyticsError: null,
    }));
  }, []);

  const startPersonal = useCallback<AppActions['startPersonal']>((input) => {
    const user: User = {
      ...input.user,
      id: uid('usr'),
      createdAt: new Date().toISOString(),
      xp: 0,
      streakDays: 0,
      isDemo: false,
    };
    const project: Project | null = input.project
      ? { ...input.project, id: uid('prj') }
      : null;
    setState((s) => ({
      ...s,
      mode: 'personal',
      user,
      project,
      baseline: null,
      assessments: [],
      understanding: null,
      privacy: DEFAULT_PRIVACY,
      analyticsError: null,
    }));
  }, []);

  const completeBaseline = useCallback((assessment: Assessment) => {
    setState((s) => ({
      ...s,
      baseline: assessment,
      assessments: [...s.assessments.filter((a) => a.kind !== 'baseline'), assessment],
    }));
  }, []);

  const recordAssessment = useCallback(
    (assessment: Assessment, understanding?: ProjectUnderstanding) => {
      setState((s) => ({
        ...s,
        assessments: [...s.assessments, assessment],
        understanding: understanding ?? s.understanding,
      }));
    },
    [],
  );

  const attachRepoAnalysis = useCallback((analysis: RepoAnalysis) => {
    setState((s) => ({
      ...s,
      project: s.project
        ? { ...s.project, repoUrl: analysis.repoUrl, analysis }
        : {
            id: uid('prj'),
            name: analysis.repo,
            stack: analysis.languages.slice(0, 4).map((l) => l.name),
            repoUrl: analysis.repoUrl,
            analysis,
          },
    }));
  }, []);

  const updatePrivacy = useCallback((patch: Partial<PrivacySettings>) => {
    setState((s) => ({ ...s, privacy: { ...s.privacy, ...patch } }));
  }, []);

  const exportData = useCallback(() => {
    exportState({
      exportedAt: new Date().toISOString(),
      note: 'NiyantraAI prototype export. AI activity in this file is simulated demo data.',
      user: state.user,
      project: state.project,
      baseline: state.baseline,
      assessments: state.assessments,
      understanding: state.understanding,
      privacy: state.privacy,
      analytics: state.analytics?.snapshot ?? null,
    });
  }, [state]);

  const deleteProjectData = useCallback(() => {
    setState((s) => ({ ...s, project: null, understanding: null }));
  }, []);

  const resetEverything = useCallback(() => {
    clearState();
    setState({ ...emptyState, ready: true, storageAvailable: isStorageAvailable() });
  }, []);

  const refreshAnalytics = useCallback(() => setReloadToken((t) => t + 1), []);

  /* ---------------- derived gamification ---------------- */

  const { achievements, xp } = useMemo(() => {
    if (!state.analytics || !state.user) {
      return { achievements: [] as Achievement[], xp: state.user?.xp ?? 0 };
    }
    const { current } = windowStatsFor(state.analytics.interactions, new Date());
    const completed = state.assessments.filter((a) => a.completedAt).length;
    return {
      achievements: buildAchievements({
        user: state.user,
        stats: current,
        snapshot: state.analytics.snapshot,
        assessmentsCompleted: completed,
        projectUnderstanding: state.understanding?.overall ?? null,
      }),
      xp: computeXp(current, completed),
    };
  }, [state.analytics, state.user, state.assessments, state.understanding]);

  const value: AppContextValue = {
    ...state,
    evidence,
    achievements,
    xp,
    onboarded: Boolean(state.mode && state.user),
    hasBaseline: Boolean(state.baseline),
    startDemo,
    startPersonal,
    completeBaseline,
    recordAssessment,
    attachRepoAnalysis,
    updatePrivacy,
    exportData,
    deleteProjectData,
    resetEverything,
    refreshAnalytics,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
}
