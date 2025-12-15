import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function ChildLoginForm() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Clear any existing Supabase auth session to ensure we use anon role
      // This is important because child sessions use access codes, not Supabase Auth
      await supabase.auth.signOut();

      // Format code (ensure uppercase, keep dashes as stored in DB)
      const formattedCode = code.toUpperCase().trim();
      
      // Check child and parent subscription status using database function
      const { data: result, error: queryError } = await supabase
        .rpc('check_parent_subscription_by_access_code', {
          p_access_code: formattedCode
        })
        .single();

      if (queryError || !result) {
        setError('Invalid access code. Please try again.');
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

      // Check if subscription is valid (active or trialing)
      if (!subscriptionResult.subscription_valid) {
        setError('Access unavailable. Please ask your parent to renew their subscription.');
        return;
      }

      // Store child session in localStorage (for child sessions)
      localStorage.setItem('child_session', JSON.stringify({
        childId: subscriptionResult.child_id,
        childName: subscriptionResult.child_name,
        accessCode: subscriptionResult.access_code,
      }));

      navigate('/child/dashboard');
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="child-code" className="block text-sm font-semibold text-gray-700 mb-2">
          Access Code
        </label>
        <input
          id="child-code"
          type="text"
          value={code}
          onChange={(e) => {
            // Auto-format as ABC-123
            let value = e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
            if (value.length > 3) {
              value = value.slice(0, 3) + '-' + value.slice(3, 6);
            }
            setCode(value);
          }}
          placeholder="ABC-123"
          maxLength={7}
          className="w-full px-4 py-3 text-xl text-center font-mono border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white shadow-sm hover:border-gray-300"
          style={{ letterSpacing: '0.2em' }}
        />
        {error && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <span className="mr-1">⚠</span>
            {error}
          </p>
        )}
      </div>

      <div className="text-sm text-gray-600 text-center">
        Ask your parent for your access code!
      </div>

      <button
        type="submit"
        disabled={loading || code.length < 7}
        className="w-full px-4 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all shadow-lg shadow-primary-600/20 hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Entering...
          </span>
        ) : (
          'Enter'
        )}
      </button>
    </form>
  );
}

