import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Sparkles, CheckCircle2, Loader2, Mail } from 'lucide-react';

export default function SignupSuccessPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [email, setEmail] = useState<string>('');
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      // Get email from sessionStorage
      const storedEmail = sessionStorage.getItem('signup_email');
      
      if (storedEmail) {
        // Normalize email (trim + lowercase) for consistency
        setEmail(storedEmail.trim().toLowerCase());
      }

      if (!sessionId) {
        setStatus('error');
        return;
      }

      // Verify checkout session and get email
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const functionUrl = `${supabaseUrl}/functions/v1/verify-checkout-session`;

        // Wait a moment for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verify the checkout session
        const verifyResponse = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
            'apikey': anonKey,
          },
          body: JSON.stringify({ sessionId }),
        });

        if (!verifyResponse.ok) {
          throw new Error('Failed to verify checkout session');
        }

        const verifyData = await verifyResponse.json();
        
        // Use email from verification if available, fallback to stored email
        const userEmail = verifyData.email || storedEmail;
        
        if (userEmail && typeof userEmail === 'string' && userEmail.trim() !== '') {
          setEmail(userEmail.trim().toLowerCase());
        }

        // Show success message, then redirect to login
        setStatus('success');
        
        // Redirect to login page after 3 seconds with email verification message
        setTimeout(() => {
          // Clear stored credentials (they're no longer needed)
          sessionStorage.removeItem('signup_email');
          sessionStorage.removeItem('signup_password');
          // Redirect to login with a flag to show email verification message
          navigate('/login?from_signup=true&email=' + encodeURIComponent(userEmail || storedEmail || ''));
        }, 3000);
      } catch (err: any) {
        console.error('Error verifying payment:', err);
        // Still redirect to login even if verification fails
        setStatus('success');
        setTimeout(() => {
          sessionStorage.removeItem('signup_email');
          sessionStorage.removeItem('signup_password');
          navigate('/login?from_signup=true');
        }, 3000);
      }
    };

    verifyPayment();
  }, [sessionId, navigate]);

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
              Verifying Payment
            </h1>
            <p className="text-gray-600">
              Please wait while we verify your payment...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600 mb-4">
              Your account is being created. You'll receive an email verification link shortly.
            </p>
            {email && (
              <p className="text-sm text-gray-500 mb-6">
                Check your inbox at <strong>{email}</strong>
              </p>
            )}
            <div className="flex items-center justify-center gap-2 text-primary-600 mb-6">
              <Mail className="h-5 w-5" />
              <span className="text-sm font-medium">Redirecting to login page...</span>
            </div>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all"
            >
              Go to Login Now
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verification Issue
            </h1>
            <p className="text-gray-600 mb-6">
              There was an issue verifying your payment. Please try logging in.
            </p>
            <Link
              to="/login"
              className="block w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all"
            >
              Go to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

