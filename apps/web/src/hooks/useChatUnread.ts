import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useChatUnread(childId: string | null) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!childId) return;

    async function fetchUnread() {
      const { data: participants } = await supabase
        .from('chat_participants')
        .select('conversation_id, last_read_at')
        .eq('child_id', childId);

      if (!participants || participants.length === 0) {
        setUnreadCount(0);
        return;
      }

      let total = 0;
      for (const p of participants) {
        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', p.conversation_id)
          .gt('created_at', p.last_read_at)
          .neq('sender_id', childId);
        total += count || 0;
      }
      setUnreadCount(total);
    }

    fetchUnread();

    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [childId]);

  return { unreadCount };
}