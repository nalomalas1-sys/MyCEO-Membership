import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Sparkles, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export default function SignupSuccessPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'login' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loggingIn, setLoggingIn] = useState(false);
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Get email from sessionStorage
    const storedEmail = sessionStorage.getItem('signup_email');
    if (storedEmail) {
      setEmail(storedEmail);
      sessionStorage.removeItem('signup_email');
    }

    if (!sessionId) {
      setError('No session ID provided');
      setStatus('error');
      return;
    }

    // Wait a moment for webhook to process, then show login form
    const timer = setTimeout(() => {
      setStatus('login');
    }, 3000); // Give webhook 3 seconds to create account

    return () => clearTimeout(timer);
  }, [sessionId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setError(null);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);
        setLoggingIn(false);
        return;
      }

      if (data.user) {
        setStatus('success');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to log in. Please try again.');
      setLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-green-50 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <Link to="/" className="flex items-center justify-center space-x-2 mb-8">
          <Sparkles className="h-8 w-8 text-primary-600" />
          <span className="text-2xl font-bold text-gray-900">MyCEO</span>
        </Link>

        {status === 'loading' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Creating Your Account
            </h1>
            <p className="text-gray-600">
              Please wait while we set up your account. This should only take a moment...
            </p>
          </div>
        )}

        {status === 'login' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600 mb-6">
              Your account has been created. Please log in with your password to continue.
            </p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                  placeholder="Enter your password"
                />
              </div>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loggingIn}
                className="w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loggingIn ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Log In & Continue'
                )}
              </button>
            </form>
            <p className="text-xs text-gray-500 text-center mt-4">
              <Link to="/login" className="text-primary-600 hover:text-primary-700">
                Having trouble? Try the login page
              </Link>
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to MyCEO!
            </h1>
            <p className="text-gray-600 mb-6">
              Redirecting you to your dashboard...
            </p>
            <Link
              to="/dashboard"
              className="inline-block px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Account Setup Issue
            </h1>
            <p className="text-gray-600 mb-6">
              {error || 'There was an issue setting up your account. Please try logging in with your email and password.'}
            </p>
            <div className="space-y-3">
              <Link
                to="/login"
                className="block w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all"
              >
                Try Logging In
              </Link>
              <Link
                to="/signup"
                className="block w-full px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
              >
                Start Over
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

