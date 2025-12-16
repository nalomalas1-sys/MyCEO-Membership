import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminNavBar } from '@/components/navigation/AdminNavBar';
import { supabase } from '@/lib/supabase';
import { Power, AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';

interface FeatureFlag {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  updated_at: string;
}

function AdminFeatureFlagsContent() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchFlags();
    
    // Set up real-time subscription for feature flag changes
    const channel = supabase
      .channel('feature-flags-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'feature_flags' },
        () => {
          // Refresh flags when changes occur
          fetchFlags();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFlags = async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('feature_flags')
        .select('*')
        .order('name');

      if (fetchError) throw fetchError;
      setFlags(data || []);
    } catch (err: any) {
      console.error('Error fetching feature flags:', err);
      setError(err.message || 'Failed to load feature flags');
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (flagId: string, currentValue: boolean) => {
    setSaving(flagId);
    setError(null);
    setSuccess(null);

    try {
      const { error: updateError } = await supabase
        .from('feature_flags')
        .update({ enabled: !currentValue })
        .eq('id', flagId);

      if (updateError) throw updateError;

      // Update local state optimistically
      setFlags(prevFlags =>
        prevFlags.map(flag =>
          flag.id === flagId ? { ...flag, enabled: !currentValue } : flag
        )
      );

      const flag = flags.find(f => f.id === flagId);
      setSuccess(`${flag?.name || 'Feature'} ${!currentValue ? 'enabled' : 'disabled'} successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error updating feature flag:', err);
      setError(err.message || 'Failed to update feature flag');
      // Revert optimistic update on error
      fetchFlags();
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <LoadingAnimation message="Loading feature flags..." variant="fullscreen" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
      <AdminNavBar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Feature Flags</h1>
            <p className="text-gray-600">Enable or disable features across the application</p>
          </div>
          <button
            onClick={fetchFlags}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {flags.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 border border-gray-200 text-center">
            <Power className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Feature Flags</h3>
            <p className="text-gray-600">Feature flags will appear here once they are created in the database.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {flags.map((flag) => (
              <div
                key={flag.id}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`p-2 rounded-lg ${flag.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <Power className={`h-5 w-5 ${flag.enabled ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 capitalize">
                          {flag.name.replace(/_/g, ' ')}
                        </h3>
                        {flag.description && (
                          <p className="text-sm text-gray-600 mt-1">{flag.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="ml-12 mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      <span>Last updated: {new Date(flag.updated_at).toLocaleString()}</span>
                      <span className={`px-2 py-1 rounded-full font-medium ${
                        flag.enabled
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {flag.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-6">
                    <button
                      onClick={() => toggleFlag(flag.id, flag.enabled)}
                      disabled={saving === flag.id}
                      className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        flag.enabled
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 focus:ring-green-500'
                          : 'bg-gray-300 focus:ring-gray-400'
                      } ${saving === flag.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`inline-block h-10 w-10 transform rounded-full bg-white shadow-lg transition-transform ${
                          flag.enabled ? 'translate-x-12' : 'translate-x-1'
                        }`}
                      />
                      {saving === flag.id && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-white" />
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Card */}
        <div className="mt-8 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl shadow-lg p-6 border border-blue-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">About Feature Flags</h3>
              <p className="text-sm text-gray-600">
                Feature flags allow you to control which features are available to users without deploying new code.
                Changes take effect immediately across the application. Use this to gradually roll out features or
                quickly disable features if issues arise.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminFeatureFlagsPage() {
  return (
    <ProtectedRoute requireRole="admin">
      <AdminFeatureFlagsContent />
    </ProtectedRoute>
  );
}

