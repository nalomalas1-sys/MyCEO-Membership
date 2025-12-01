import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Module {
  id: string;
  title: string;
  description: string | null;
  track: 'money_basics' | 'entrepreneurship' | 'advanced';
  order_index: number;
  difficulty_level: number;
  xp_reward: number;
  is_published: boolean;
  published_at: string | null;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content: string | null;
  lesson_type: 'video' | 'text' | 'quiz' | 'pdf' | 'presentation';
  content_url: string | null;
  order_index: number;
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface ModuleProgress {
  id: string;
  child_id: string;
  module_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percentage: number;
  started_at: string | null;
  completed_at: string | null;
  xp_earned: number;
}

export function useModules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchModules() {
      try {
        const { data, error: fetchError } = await supabase
          .from('modules')
          .select('*')
          .eq('is_published', true)
          .order('order_index', { ascending: true });

        if (fetchError) throw fetchError;
        setModules(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch modules');
      } finally {
        setLoading(false);
      }
    }

    fetchModules();
  }, []);

  return { modules, loading, error };
}

export function useModule(moduleId: string) {
  const [module, setModule] = useState<Module | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!moduleId) {
      setLoading(false);
      return;
    }

    async function fetchModule() {
      try {
        // Fetch module
        const { data: moduleData, error: moduleError } = await supabase
          .from('modules')
          .select('*')
          .eq('id', moduleId)
          .single();

        if (moduleError) throw moduleError;
        setModule(moduleData);

        // Fetch lessons
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('module_id', moduleId)
          .order('order_index', { ascending: true });

        if (lessonsError) throw lessonsError;
        setLessons(lessonsData || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch module');
      } finally {
        setLoading(false);
      }
    }

    fetchModule();
  }, [moduleId]);

  return { module, lessons, loading, error };
}

export function useChildModuleProgress(childId: string, moduleId: string) {
  const [progress, setProgress] = useState<ModuleProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!childId || !moduleId) {
      setLoading(false);
      return;
    }

    async function fetchProgress() {
      try {
        const { data, error: fetchError } = await supabase
          .from('child_module_progress')
          .select('*')
          .eq('child_id', childId)
          .eq('module_id', moduleId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          // PGRST116 means no rows found, which is fine
          throw fetchError;
        }
        setProgress(data || null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch progress');
      } finally {
        setLoading(false);
      }
    }

    fetchProgress();
  }, [childId, moduleId]);

  return { progress, loading, error };
}

