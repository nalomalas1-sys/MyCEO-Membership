import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { Child } from '@/types/child';

interface Parent {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  subscription_tier: 'basic' | 'standard' | 'premium' | null;
  subscription_status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  trial_ends_at: string | null;
}

export function useParent() {
  const { user } = useAuth();
  const [parent, setParent] = useState<Parent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchParent() {
      try {
        // First get the user record
        let userData;
        const { data: existingUser, error: userError } = await supabase
          .from('users')
          .select('id, email, full_name, role')
          .eq('id', user.id)
          .single();

        if (userError) {
          // If user doesn't exist, create one (fallback if trigger didn't work)
          if (userError.code === 'PGRST116') {
            const { data: newUser, error: createUserError } = await supabase
              .from('users')
              .insert({
                id: user.id,
                email: user.email || '',
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                role: 'parent',
              })
              .select()
              .single();

            if (createUserError) throw createUserError;
            userData = newUser;
          } else {
            throw userError;
          }
        } else {
          userData = existingUser;
        }

        // Then get the parent record
        const { data: parentData, error: parentError } = await supabase
          .from('parents')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (parentError) {
          // If parent doesn't exist, create one (fallback if trigger didn't work)
          if (parentError.code === 'PGRST116') {
            const { data: newParent, error: createError } = await supabase
              .from('parents')
              .insert({
                user_id: user.id,
                subscription_status: 'trialing',
                trial_ends_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
              })
              .select()
              .single();

            if (createError) throw createError;
            setParent(newParent);
          } else {
            throw parentError;
          }
        } else {
          setParent(parentData);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch parent data');
      } finally {
        setLoading(false);
      }
    }

    fetchParent();
  }, [user]);

  const refetch = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data: parentData, error: parentError } = await supabase
        .from('parents')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (parentError) throw parentError;
      setParent(parentData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch parent data');
    } finally {
      setLoading(false);
    }
  };

  return { parent, loading, error, refetch };
}

export function useChildren() {
  const { parent } = useParent();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!parent) {
      setLoading(false);
      return;
    }

    async function fetchChildren() {
      try {
        const { data, error: fetchError } = await supabase
          .from('children')
          .select('*')
          .eq('parent_id', parent.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setChildren(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch children');
      } finally {
        setLoading(false);
      }
    }

    fetchChildren();
  }, [parent]);

  const refetch = async () => {
    if (!parent) return;
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', parent.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setChildren(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch children');
    } finally {
      setLoading(false);
    }
  };

  return { children, loading, error, refetch };
}