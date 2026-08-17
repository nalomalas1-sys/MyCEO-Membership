import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface LearningTrack {
  id: string;
  slug: string;
  name: string;
  icon: string;
  theme_key: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export function useLearningTracks() {
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: e } = await supabase
        .from('learning_tracks')
        .select('*')
        .order('order_index', { ascending: true });
      if (e) throw e;
      setTracks(data ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load tracks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { tracks, loading, error, refetch };
}
