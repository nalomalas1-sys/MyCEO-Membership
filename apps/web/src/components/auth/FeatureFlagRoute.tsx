import { Navigate } from 'react-router-dom';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';

interface FeatureFlagRouteProps {
  children: React.ReactNode;
  featureName: string;
  fallbackPath?: string;
}

export function FeatureFlagRoute({
  children,
  featureName,
  fallbackPath = '/child/dashboard',
}: FeatureFlagRouteProps) {
  const { isEnabled, loading } = useFeatureFlags();

  if (loading) {
    return <LoadingAnimation message="Loading..." variant="fullscreen" />;
  }

  if (!isEnabled(featureName)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}




