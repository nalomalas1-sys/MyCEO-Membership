import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChildNavBar } from '@/components/navigation/ChildNavBar';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
import { supabase } from '@/lib/supabase';
import { MessageCircle } from 'lucide-react';

interface ChildSession {
  childId: string;
  childName: string;
  accessCode: string;
}

interface RoomInfo {
  id: string;
  name: string;
  topic_slug: string;
  unreadCount: number;
}

const ROOM_ICONS: Record<string, string> = {
  business_ideas: '💡',
  money_tips: '💰',
  challenge_talk: '⚡',
  general: '💬',
};

const ROOM_DESCRIPTIONS: Record<string, string> = {
  business_ideas: 'Share your next big idea!',
  money_tips: 'Tips on saving, earning & spending',
  challenge_talk: 'Discuss scores & strategies',
  general: 'Chat about anything!',
};

const ROOM_COLORS: Record<string, string> = {
  business_ideas: 'border-yellow-300 hover:border-yellow-400',
  money_tips: 'border-green-300 hover:border-green-400',
  challenge_talk: 'border-orange-300 hover:border-orange-400',
  general: 'border-blue-300 hover:border-blue-400',
};

export default function ChatHubPage() {
  const navigate = useNavigate();
  const [childSession, setChildSession] = useState<ChildSession | null>(null);
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineCounts, setOnlineCounts] = useState<Record<string, number>>({});
  const presenceChannelsRef = useRef<ReturnType<typeof supabase.channel>[]>([]);

  useEffect(() => {
    const sessionStr = localStorage.getItem('child_session');
    if (!sessionStr) {
      navigate('/child/login');
      return;
    }
    try {
      const session = JSON.parse(sessionStr);
      setChildSession(session);
    } catch {
      navigate('/child/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (!childSession) return;

    async function fetchRooms() {
      if (!childSession) return;
      try {
        const { data: conversations } = await supabase
          .from('chat_conversations')
          .select('id, name, topic_slug')
          .eq('type', 'topic_room')
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        if (!conversations) return;

        for (const conv of conversations) {
          await supabase
            .from('chat_participants')
            .upsert(
              { conversation_id: conv.id, child_id: childSession.childId },
              { onConflict: 'conversation_id,child_id' }
            );
        }

        const { data: participants } = await supabase
          .from('chat_participants')
          .select('conversation_id, last_read_at')
          .eq('child_id', childSession.childId);

        const participantMap = new Map(
          participants?.map(p => [p.conversation_id, p.last_read_at]) || []
        );

        const roomInfos: RoomInfo[] = [];

        for (const conv of conversations) {
          const lastRead = participantMap.get(conv.id) || new Date(0).toISOString();
          const { count: unreadCount } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .gt('created_at', lastRead)
            .neq('sender_id', childSession.childId);

          roomInfos.push({
            id: conv.id,
            name: conv.name,
            topic_slug: conv.topic_slug,
            unreadCount: unreadCount || 0,
          });
        }

        setRooms(roomInfos);
      } catch (err) {
        console.error('Failed to load chat rooms:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRooms();
  }, [childSession]);

    // Presence: subscribe to each room for live online counts (listen only, don't track)
    useEffect(() => {
        if (rooms.length === 0 || !childSession) return;
    
        const channels: ReturnType<typeof supabase.channel>[] = [];
    
        rooms.forEach((room) => {
          const channel = supabase.channel(`presence:${room.id}`, {
            config: { presence: { key: childSession.childId } },
          });
    
          channel
            .on('presence', { event: 'sync' }, () => {
              const state = channel.presenceState();
              const count = Object.keys(state).length;
              setOnlineCounts((prev) => ({ ...prev, [room.id]: count }));
            })
            .subscribe();  // <-- Subscribe ONLY, no track()
    
          channels.push(channel);
        });
    
        presenceChannelsRef.current = channels;
    
        return () => {
          channels.forEach((ch) => {
            supabase.removeChannel(ch);
          });
          presenceChannelsRef.current = [];
        };
      }, [rooms, childSession]);

  if (loading || !childSession) {
    return <LoadingAnimation message="Loading chat..." variant="fullscreen" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50">
      <ChildNavBar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <MessageCircle className="h-10 w-10 text-blue-500" />
            <h1 className="text-4xl font-bold text-gray-900">Chat Rooms</h1>
          </div>
          <p className="text-lg text-gray-600">Jump in and chat with other young CEOs!</p>
        </div>

        <div className="space-y-4">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => navigate(`/child/chat/${room.id}`)}
              className={`w-full text-left bg-white rounded-2xl shadow-lg p-5 border-3 ${ROOM_COLORS[room.topic_slug] || 'border-gray-300 hover:border-gray-400'} hover:shadow-xl transition-all active:scale-[0.98]`}
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl flex-shrink-0">
                  {ROOM_ICONS[room.topic_slug] || '💬'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-900">{room.name}</h3>
                    {room.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {room.unreadCount > 99 ? '99+' : room.unreadCount} new
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {ROOM_DESCRIPTIONS[room.topic_slug] || 'Chat here!'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  {(onlineCounts[room.id] || 0) > 0 && (
                    <div className="flex items-center gap-1.5 justify-end">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-600 font-semibold">
                        {onlineCounts[room.id]} online
                      </span>
                    </div>
                  )}
                  <div className="text-gray-400 text-xl mt-1">›</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}