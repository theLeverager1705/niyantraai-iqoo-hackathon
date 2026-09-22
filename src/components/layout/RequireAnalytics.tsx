import type { ReactNode } from 'react';
import { EyeOff } from 'lucide-react';
import { useAppState } from '@/hooks/useAppState';
import type { AnalyticsBundle } from '@/services/mockAIAnalyticsService';
import { EmptyState, ErrorState, LoadingPanel } from '@/components/ui/Feedback';
import { LinkButton } from '@/components/ui/Button';

/**
 * Every analytics-backed screen goes through here, so loading, paused and
 * error states are identical across the product instead of being reinvented
 * per page.
 */
export function RequireAnalytics({
  children,
  loadingRows = 4,
}: {
  children: (bundle: AnalyticsBundle) => ReactNode;
  loadingRows?: number;
}) {
  const { analytics, analyticsLoading, analyticsError, refreshAnalytics } = useAppState();

  if (analyticsError === 'paused') {
    return (
      <EmptyState
        icon={<EyeOff size={18} />}
        title="Analytics collection is paused"
        description="You turned off analytics collection in privacy settings. Nothing is being measured, and no history was kept while it was off."
        action={
          <LinkButton to="/app/settings" variant="secondary">
            Open privacy settings
          </LinkButton>
        }
      />
    );
  }

  if (analyticsError) {
    return (
      <ErrorState
        title="Could not load AI activity"
        description={analyticsError}
        onRetry={refreshAnalytics}
      />
    );
  }

  if (analyticsLoading || !analytics) {
    return <LoadingPanel rows={loadingRows} title="Loading your AI activity" />;
  }

  return <>{children(analytics)}</>;
}
