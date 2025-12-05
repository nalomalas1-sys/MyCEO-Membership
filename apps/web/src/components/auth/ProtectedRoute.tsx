import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

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

  // For child routes, check localStorage FIRST before checking auth
  // This allows child sessions (which don't use Supabase Auth) to work
  if (requireRole === 'child') {
    const childSession = localStorage.getItem('child_session');
    if (childSession) {
      try {
        // Validate the session is valid JSON
        JSON.parse(childSession);
        return <>{children}</>;
      } catch {
        // Invalid session, continue to normal auth check
      }
    }
    // No valid child session, redirect to child login (but wait for loading to finish)
    if (!authLoading && !roleLoading) {
      return <Navigate to="/child/login" replace />;
    }
  }

  if (authLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
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



