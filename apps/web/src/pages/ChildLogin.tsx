import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function ChildLoginPage() {
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
      
      // Query for child with this access code
      const { data: children, error: queryError } = await supabase
        .from('children')
        .select('id, name, access_code')
        .eq('access_code', formattedCode)
        .single();

      if (queryError || !children) {
        setError('Invalid access code. Please try again.');
        return;
      }

      // Store child session in localStorage (for child sessions)
      // In production, you might want to use a more secure method
      localStorage.setItem('child_session', JSON.stringify({
        childId: children.id,
        childName: children.name,
        accessCode: formattedCode,
      }));

      navigate('/child/dashboard');
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-2">MyCEO</h1>
          <p className="text-xl text-gray-600 mb-8">Enter your access code!</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="code" className="block text-lg font-medium text-gray-700 mb-2">
              Access Code
            </label>
            <input
              id="code"
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
              className="w-full px-4 py-4 text-2xl text-center font-mono border-4 border-primary-300 rounded-xl focus:ring-4 focus:ring-primary-500 focus:border-primary-500"
              style={{ letterSpacing: '0.2em' }}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || code.length < 7}
            className="w-full py-4 bg-primary-600 text-white text-lg font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Entering...' : 'Enter'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500">
          Ask your parent for your access code!
        </div>
      </div>
    </div>
  );
}



