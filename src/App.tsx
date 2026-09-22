import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AppStateProvider, useAppState } from '@/hooks/useAppState';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { AppShell } from '@/components/layout/AppShell';
import { Landing } from '@/pages/Landing';
import { Onboarding } from '@/pages/Onboarding';
import { BaselineAssessment } from '@/pages/BaselineAssessment';
import { Dashboard } from '@/pages/Dashboard';
import { Analytics } from '@/pages/Analytics';
import { PromptIntelligence } from '@/pages/PromptIntelligence';
import { ProjectUnderstanding } from '@/pages/ProjectUnderstanding';
import { AdaptiveAssessment } from '@/pages/AdaptiveAssessment';
import { Coach } from '@/pages/Coach';
import { WeeklyReportPage } from '@/pages/WeeklyReport';
import { Achievements } from '@/pages/Achievements';
import { Integrations } from '@/pages/Integrations';
import { Settings } from '@/pages/Settings';
import { NotFound } from '@/pages/NotFound';

/** Blocks the app shell until a profile exists (demo or personal). */
function RequireProfile({ children }: { children: ReactNode }) {
  const { ready, onboarded } = useAppState();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-r-transparent" />
        <span className="sr-only">Loading NiyantraAI</span>
      </div>
    );
  }

  if (!onboarded) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

/** Sends an already-onboarded visitor straight into the product. */
function LandingRoute() {
  const { ready } = useAppState();
  if (!ready) {
    return <div className="min-h-screen bg-canvas" />;
  }
  return <Landing />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingRoute />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/baseline" element={<BaselineAssessment />} />

      <Route
        path="/app"
        element={
          <RequireProfile>
            <AppShell />
          </RequireProfile>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="prompts" element={<PromptIntelligence />} />
        <Route path="project" element={<ProjectUnderstanding />} />
        <Route path="assessment" element={<AdaptiveAssessment />} />
        <Route path="coach" element={<Coach />} />
        <Route path="report" element={<WeeklyReportPage />} />
        <Route path="achievements" element={<Achievements />} />
        <Route path="integrations" element={<Integrations />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppStateProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </AppStateProvider>
    </ErrorBoundary>
  );
}
