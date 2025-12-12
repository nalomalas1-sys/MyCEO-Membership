import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export interface FeatureFlag {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isInitialLoadRef = useRef(true);
  const isUpdatingRef = useRef(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const subscriptionEventCountRef = useRef(0);

  const fetchFlags = useCallback(async (isInitial = false) => {
    // Prevent concurrent fetches
    if (isUpdatingRef.current && !isInitial) {
      return;
    }

    try {
      // Only set loading state on initial load to prevent UI flicker
      if (isInitial) {
        setLoading(true);
        isUpdatingRef.current = true;
      } else {
        isUpdatingRef.current = true;
      }
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('feature_flags')
        .select('name, enabled')
        .order('name');

      if (fetchError) throw fetchError;

      // Convert array to object for easy lookup
      const flagsMap: Record<string, boolean> = {};
      if (data && Array.isArray(data)) {
        data.forEach(flag => {
          if (flag.name && typeof flag.enabled === 'boolean') {
            flagsMap[flag.name] = flag.enabled;
          }
        });
      }

      // Only update flags if we have valid data
      // Use functional update to ensure atomic state updates
      setFlags(prevFlags => {
        // On initial load, always set the flags
        if (isInitial) {
          return flagsMap;
        }

        // Check if flags have actually changed
        const hasChanged = Object.keys(flagsMap).some(
          key => flagsMap[key] !== prevFlags[key]
        ) || Object.keys(prevFlags).some(
          key => flagsMap[key] !== prevFlags[key]
        );

        // If no change, return previous flags to prevent re-render
        if (!hasChanged) {
          return prevFlags;
        }

        // Only update if we have valid flags data
        if (Object.keys(flagsMap).length > 0 || isInitial) {
          return flagsMap;
        }

        // Preserve previous flags if new data is invalid
        return prevFlags;
      });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Failed to fetch feature flags:', error);
      setError(error.message || 'Failed to load feature flags');
      // Only clear flags on initial load error, preserve on update errors
      if (isInitial) {
        setFlags({});
      }
    } finally {
      if (isInitial) {
        setLoading(false);
        isInitialLoadRef.current = false;
      }
      isUpdatingRef.current = false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let subscriptionTimeout: NodeJS.Timeout | null = null;

    // Initial load
    fetchFlags(true).then(() => {
      // Only set up subscription after initial load completes
      if (!mounted) return;

      // Wait a bit more to ensure initial load is fully complete
      setTimeout(() => {
        if (!mounted) return;

        // Set up real-time subscription for feature flag changes
        // Use a unique channel name to avoid conflicts
        const channelName = `feature-flags-changes-${Date.now()}`;
        const channel = supabase
          .channel(channelName)
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'feature_flags' },
            () => {
              // Ignore the first subscription event (Supabase sometimes fires on initial subscription)
              subscriptionEventCountRef.current += 1;
              if (subscriptionEventCountRef.current === 1) {
                return;
              }

              // Clear any pending subscription update
              if (subscriptionTimeout) {
                clearTimeout(subscriptionTimeout);
              }

              // Only refresh if we're not updating and initial load is done
              subscriptionTimeout = setTimeout(() => {
                if (mounted && !isInitialLoadRef.current && !isUpdatingRef.current) {
                  // Refresh flags when changes occur (without setting loading state)
                  fetchFlags(false);
                }
              }, 500);
            }
          )
          .subscribe();

        // Store channel for cleanup
        channelRef.current = channel;
      }, 200);
    });

    return () => {
      mounted = false;
      if (subscriptionTimeout) {
        clearTimeout(subscriptionTimeout);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetchFlags]);

  // Helper function to check if a feature is enabled
  const isEnabled = useCallback((featureName: string): boolean => {
    // If flags haven't loaded yet, default to false (safer)
    if (loading) return false;
    // If flag doesn't exist, default to false
    // Use strict equality to ensure we only return true when explicitly enabled
    return flags[featureName] === true;
  }, [flags, loading]);

  return { flags, loading, error, isEnabled, refetch: fetchFlags };
}

