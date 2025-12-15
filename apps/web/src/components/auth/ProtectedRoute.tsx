import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRole?: 'parent' | 'admin' | 'child';
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requireRole,
}: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [subscriptionValid, setSubscriptionValid] = useState<boolean | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  useEffect(() => {
    async function fetchUserRole() {
      if (!user) {
        setRoleLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setRoleLoading(false);
          return;
        }

        setUserRole(data?.role || null);
      } catch (err) {
        console.error('Error in fetchUserRole:', err);
      } finally {
        setRoleLoading(false);
      }
    }

    if (user && requireRole) {
      fetchUserRole();
    } else {
      setRoleLoading(false);
    }
  }, [user, requireRole]);

  // Check subscription status for child routes
  useEffect(() => {
    async function checkSubscription() {
      if (requireRole !== 'child') {
        setSubscriptionLoading(false);
        return;
      }

      const childSession = localStorage.getItem('child_session');
      if (!childSession) {
        setSubscriptionLoading(false);
        return;
      }

      try {
        const session = JSON.parse(childSession);
        const childId = session.childId;

        // Check subscription using database function
        const { data: result, error } = await supabase
          .rpc('check_parent_subscription_for_child', {
            p_child_id: childId
          })
          .single();

        if (error || !result) {
          setSubscriptionValid(false);
          setSubscriptionLoading(false);
          return;
        }

        // Type assertion for RPC result
        const subscriptionResult = result as {
          child_id: string;
          child_name: string;
          access_code: string;
          parent_subscription_status: string;
          subscription_valid: boolean;
        };

        // Subscription is valid if active or trialing
        setSubscriptionValid(subscriptionResult.subscription_valid);
      } catch (err) {
        console.error('Error checking subscription:', err);
        setSubscriptionValid(false);
      } finally {
        setSubscriptionLoading(false);
      }
    }

    if (requireRole === 'child') {
      setSubscriptionLoading(true);
      checkSubscription();
    }
  }, [requireRole]);

  // For child routes, check localStorage FIRST before checking auth
  // This allows child sessions (which don't use Supabase Auth) to work
  if (requireRole === 'child') {
    const childSession = localStorage.getItem('child_session');
    if (childSession) {
      try {
        // Validate the session is valid JSON
        JSON.parse(childSession);
        
        // Wait for subscription check to complete
        if (subscriptionLoading) {
          return <LoadingAnimation message="Loading..." variant="fullscreen" />;
        }

        // If subscription is invalid, redirect to login with message
        if (subscriptionValid === false) {
          // Clear invalid session
          localStorage.removeItem('child_session');
          return <Navigate to="/child/login?error=subscription_expired" replace />;
        }

        // Subscription is valid, allow access
        if (subscriptionValid === true) {
          return <>{children}</>;
        }
      } catch {
        // Invalid session, continue to normal auth check
      }
    }
    // No valid child session, redirect to child login (but wait for loading to finish)
    if (!authLoading && !roleLoading && !subscriptionLoading) {
      return <Navigate to="/child/login" replace />;
    }
  }

  if (authLoading || roleLoading || subscriptionLoading) {
    return <LoadingAnimation message="Loading..." variant="fullscreen" />;
  }

  // For child routes, if we get here without a child session, redirect
  if (requireRole === 'child') {
    return <Navigate to="/child/login" replace />;
  }

  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  // Check role if required
  if (requireRole && userRole !== requireRole) {
    // Redirect to appropriate dashboard or login
    if (userRole === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (userRole === 'parent') {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}



