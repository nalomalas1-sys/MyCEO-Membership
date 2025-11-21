import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { Link, useNavigate } from 'react-router-dom';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        // Wait for the session to be confirmed
        // This ensures the auth state is updated before navigation
        let session = null;
        let retries = 0;
        const maxRetries = 5;
        
        while (!session && retries < maxRetries) {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession) {
            session = currentSession;
            break;
          }
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 200));
          retries++;
        }
        
        if (!session) {
          setError('Session not established. Please try again.');
          setLoading(false);
          return;
        }

        // Wait a moment for RLS policies to recognize the session
        await new Promise(resolve => setTimeout(resolve, 300));

        // Check user role to determine redirect with retry logic
        let userData = null;
        let userError = null;
        retries = 0;
        
        while (!userData && retries < maxRetries) {
          const { data, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', authData.user.id)
            .single();
          
          if (error) {
            userError = error;
            console.error(`Error fetching user role (attempt ${retries + 1}):`, error);
            // If it's a permission error, wait and retry
            if (error.code === 'PGRST116' || error.message.includes('permission') || error.message.includes('policy')) {
              await new Promise(resolve => setTimeout(resolve, 300));
              retries++;
              continue;
            } else {
              // For other errors, break immediately
              break;
            }
          } else {
            userData = data;
            break;
          }
        }

        if (userError && !userData) {
          console.error('Failed to fetch user role after retries:', userError);
          // Show error but still try to redirect to dashboard
          // The ProtectedRoute will handle the redirect if needed
          setError(`Unable to determine user role: ${userError.message}. Redirecting to dashboard...`);
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 2000);
          return;
        }

        // Redirect based on role
        if (userData?.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else if (userData?.role === 'parent') {
          navigate('/dashboard', { replace: true });
        } else {
          // Default to dashboard for other roles
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
    }
    // Note: Don't set loading to false here if we're redirecting
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          {...register('email')}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white shadow-sm hover:border-gray-300"
          placeholder="you@example.com"
        />
        {errors.email && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <span className="mr-1">⚠</span>
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register('password')}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white shadow-sm hover:border-gray-300"
          placeholder="Enter your password"
        />
        {errors.password && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <span className="mr-1">⚠</span>
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
            Remember me
          </label>
        </div>
        <div className="text-sm">
          <Link to="/forgot-password" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
            Forgot password?
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm flex items-start">
          <span className="mr-2 mt-0.5">⚠</span>
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all shadow-lg shadow-primary-600/20 hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing in...
          </span>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
}



