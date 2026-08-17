import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChildNavBar } from '@/components/navigation/ChildNavBar';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Send, Smile, Reply, X, ImageIcon, Loader2 } from 'lucide-react';

interface ChildSession {
  childId: string;
  childName: string;
  accessCode: string;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  is_filtered: boolean;
  created_at: string;
  reply_to_id: string | null;
  reply_to_name: string | null;
  reply_to_content: string | null;
  image_url: string | null;
}

interface ConversationInfo {
  id: string;
  name: string;
  topic_slug: string;
}

interface OnlineUser {
  childId: string;
  childName: string;
}

const ROOM_ICONS: Record<string, string> = {
  business_ideas: '💡',
  money_tips: '💰',
  challenge_talk: '⚡',
  general: '💬',
};

const EMOJI_CATEGORIES = [
  { label: '😊', emojis: ['👍', '👏', '🎉', '❤️', '😊', '😂', '🤩', '💪', '🔥', '⭐', '💯', '🙏'] },
  { label: '💰', emojis: ['💰', '📈', '🏪', '💡', '🎯', '📊', '🏆', '💎', '🪙', '📦', '🚀', '💼'] },
  { label: '😄', emojis: ['😄', '😎', '🤔', '😮', '😅', '🥳', '😤', '😢', '🤗', '😴', '🤓', '😇'] },
  { label: '📚', emojis: ['📚', '✏️', '🎮', '🎨', '🍕', '🎁', '⚡', '🌟', '🎵', '🏅', '👑', '🦁'] },
];

const MAX_IMAGE_WIDTH = 800;
const MAX_BASE64_SIZE = 500 * 1024; // 500KB after compression
const JPEG_QUALITY = 0.6;

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > MAX_IMAGE_WIDTH) {
          height = Math.round((height * MAX_IMAGE_WIDTH) / width);
          width = MAX_IMAGE_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context failed'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);

        if (dataUrl.length > MAX_BASE64_SIZE) {
          const smallerDataUrl = canvas.toDataURL('image/jpeg', 0.3);
          if (smallerDataUrl.length > MAX_BASE64_SIZE) {
            reject(new Error('Image is too large even after compression. Please use a smaller photo.'));
            return;
          }
          resolve(smallerDataUrl);
          return;
        }

        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export default function ChatRoomPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const [childSession, setChildSession] = useState<ChildSession | null>(null);
  const [conversation, setConversation] = useState<ConversationInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isFirstLoadRef = useRef(true);

  const scrollToBottom = (instant = false) => {
    const container = messagesContainerRef.current;
    if (!container) return;
    if (instant) {
      container.scrollTop = container.scrollHeight;
    } else {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const sessionStr = localStorage.getItem('child_session');
    if (!sessionStr) {
      navigate('/child/login');
      return;
    }
    try {
      setChildSession(JSON.parse(sessionStr));
    } catch {
      navigate('/child/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (!childSession || !conversationId) return;

    async function loadChat() {
      if (!childSession) return;
      try {
        const { data: conv } = await supabase
          .from('chat_conversations')
          .select('id, name, topic_slug')
          .eq('id', conversationId)
          .single();

        if (!conv) {
          navigate('/child/chat');
          return;
        }
        setConversation(conv);

        const { data: msgs } = await supabase
          .from('chat_messages')
          .select('id, sender_id, sender_name, content, is_filtered, created_at, reply_to_id, reply_to_name, reply_to_content, image_url')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
          .limit(50);

        setMessages(msgs || []);

        await supabase
          .from('chat_participants')
          .update({ last_read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .eq('child_id', childSession.childId);
      } catch (err) {
        console.error('Failed to load chat:', err);
      } finally {
        setLoading(false);
      }
    }

    loadChat();
  }, [childSession, conversationId, navigate]);

  useEffect(() => {
    if (!childSession || !conversationId) return;

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          if (newMsg.sender_id !== childSession.childId) {
            supabase
              .from('chat_participants')
              .update({ last_read_at: new Date().toISOString() })
              .eq('conversation_id', conversationId)
              .eq('child_id', childSession.childId)
              .then(() => {});
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [childSession, conversationId]);

  useEffect(() => {
    if (isFirstLoadRef.current && messages.length > 0) {
      setTimeout(() => scrollToBottom(true), 150);
      isFirstLoadRef.current = false;
    } else if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    if (!childSession || !conversationId) return;

    const channel = supabase.channel(`presence:${conversationId}`, {
      config: { presence: { key: childSession.childId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: OnlineUser[] = [];
        const typing: string[] = [];

        Object.values(state).forEach((presences: any[]) => {
          presences.forEach((p) => {
            if (p.childId !== childSession.childId) {
              users.push({ childId: p.childId, childName: p.childName });
              if (p.typing) {
                typing.push(p.childName);
              }
            }
          });
        });

        setOnlineUsers(users);
        setTypingUsers(typing);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            childId: childSession.childId,
            childName: childSession.childName,
            typing: false,
            location: 'room',
          });
        }
      });

    presenceChannelRef.current = channel;

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
      presenceChannelRef.current = null;
      if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    };
  }, [childSession, conversationId]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Please choose an image under 10MB');
      return;
    }

    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setShowEmojiPicker(false);

    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [imagePreview]);

  const clearSelectedImage = useCallback(() => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setSelectedImage(null);
    setImagePreview(null);
  }, [imagePreview]);

  const handleSend = async () => {
    if (!childSession || !conversationId || sending) return;
    if (!inputText.trim() && !selectedImage) return;

    const text = inputText.trim();
    const imageFile = selectedImage;
    setInputText('');
    setReplyTo(null);
    setShowEmojiPicker(false);
    setSending(true);
    setError(null);

    if (presenceChannelRef.current) {
      presenceChannelRef.current.track({
        childId: childSession.childId,
        childName: childSession.childName,
        typing: false,
        location: 'room',
      });
    }

    try {
      let compressedImage: string | null = null;

      if (imageFile) {
        setCompressing(true);
        try {
          compressedImage = await compressImage(imageFile);
        } catch (compressErr: any) {
          setError(compressErr.message || 'Failed to process image');
          setSending(false);
          setCompressing(false);
          return;
        }
        setCompressing(false);
        clearSelectedImage();
      }

      const { data, error: rpcError } = await supabase.rpc('send_chat_message', {
        p_conversation_id: conversationId,
        p_child_id: childSession.childId,
        p_content: text || '',
        p_reply_to_id: replyTo?.id || null,
        p_image_url: compressedImage,
      });

      if (rpcError) {
        if (rpcError.message.includes('wait a moment')) {
          setError('Slow down! Wait a few seconds.');
        } else {
          setError(rpcError.message);
        }
        if (text) setInputText(text);
        return;
      }

      if (data?.filtered) {
        setError('Your message was filtered. Please avoid sharing personal info or links.');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
      if (text) setInputText(text);
    } finally {
      setSending(false);
      setCompressing(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (presenceChannelRef.current && childSession) {
      presenceChannelRef.current.track({
        childId: childSession.childId,
        childName: childSession.childName,
        typing: true,
        location: 'room',
      });

      if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = window.setTimeout(() => {
        if (presenceChannelRef.current && childSession) {
          presenceChannelRef.current.track({
            childId: childSession.childId,
            childName: childSession.childName,
            typing: false,
            location: 'room',
          });
        }
      }, 2000);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const handleReply = (msg: ChatMessage) => {
    setReplyTo(msg);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatDateSeparator(dateStr: string) {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  function shouldShowDateSeparator(idx: number) {
    if (idx === 0) return true;
    const prev = new Date(messages[idx - 1].created_at).toDateString();
    const curr = new Date(messages[idx].created_at).toDateString();
    return prev !== curr;
  }

  function getAvatarColor(name: string) {
    const colors = [
      'from-purple-400 to-pink-400',
      'from-blue-400 to-cyan-400',
      'from-green-400 to-emerald-400',
      'from-orange-400 to-yellow-400',
      'from-red-400 to-rose-400',
      'from-indigo-400 to-purple-400',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  if (loading || !childSession) {
    return <LoadingAnimation message="Loading chat..." variant="fullscreen" />;
  }

  const canSend = (inputText.trim() || selectedImage) && !sending;

  return (
    <div className="h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50 flex flex-col overflow-hidden">
      <ChildNavBar />

      {/* Header with online users */}
      <div className="bg-white border-b-2 border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-20 z-40">
        <button
          onClick={() => navigate('/child/chat')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <span className="text-2xl">
          {ROOM_ICONS[conversation?.topic_slug || ''] || '💬'}
        </span>
        <h2 className="text-lg font-bold text-gray-900 flex-1">
          {conversation?.name || 'Chat'}
        </h2>

        {onlineUsers.length > 0 && (
          <div className="flex items-center gap-1">
            <div className="flex -space-x-2">
              {onlineUsers.slice(0, 5).map((user) => (
                <div
                  key={user.childId}
                  className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarColor(user.childName)} flex items-center justify-center border-2 border-white`}
                  title={user.childName}
                >
                  <span className="text-[10px] font-bold text-white">
                    {user.childName.charAt(0).toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
            <span className="text-xs text-green-600 font-semibold ml-1">
              {onlineUsers.length > 5
                ? `+${onlineUsers.length - 5} online`
                : `${onlineUsers.length} online`}
            </span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>

      {/* Messages area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1">        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-5xl mb-4">💬</p>
            <p className="text-gray-500 text-lg font-medium">No messages yet</p>
            <p className="text-gray-400 text-sm mt-1">Be the first to say something!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender_id === childSession.childId;
            return (
              <div key={msg.id}>
                {shouldShowDateSeparator(idx) && (
                  <div className="flex items-center justify-center my-4">
                    <span className="bg-gray-200 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
                      {formatDateSeparator(msg.created_at)}
                    </span>
                  </div>
                )}

                <div className={`flex items-end gap-2 mb-3 group ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {!isMe && (
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(msg.sender_name)} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-xs font-bold text-white">
                        {msg.sender_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className={`max-w-[75%] ${isMe ? 'order-1' : ''}`}>
                    {!isMe && (
                      <p className="text-xs font-semibold text-gray-500 mb-1 ml-1">
                        {msg.sender_name}
                      </p>
                    )}

                    {msg.reply_to_name && (
                      <div className={`text-xs px-3 py-1.5 mb-1 rounded-lg border-l-3 ${
                        isMe
                          ? 'bg-blue-400/30 border-blue-300 text-blue-100'
                          : 'bg-gray-100 border-gray-300 text-gray-500'
                      }`}>
                        <p className="font-semibold">{msg.reply_to_name}</p>
                        <p className="truncate">{msg.reply_to_content}</p>
                      </div>
                    )}

                    <div
                      className={`rounded-2xl overflow-hidden ${
                        isMe
                          ? 'bg-blue-500 text-white rounded-br-md'
                          : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                      } ${msg.is_filtered ? 'opacity-60 italic' : ''}`}
                    >
                      {msg.image_url && (
                        <button
                          onClick={() => setFullScreenImage(msg.image_url)}
                          className="block w-full"
                        >
                          <img
                            src={msg.image_url}
                            alt="Shared photo"
                            className="w-full max-h-52 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            loading="lazy"
                          />
                        </button>
                      )}
                      {msg.content && (
                        <p className="text-sm whitespace-pre-wrap break-words px-4 py-2.5">{msg.content}</p>
                      )}
                      {!msg.content && msg.image_url && (
                        <div className="h-1"></div>
                      )}
                    </div>
                    <div className={`flex items-center gap-2 mt-1 ${isMe ? 'justify-end' : ''}`}>
                      <p className={`text-[10px] ${isMe ? 'text-gray-400' : 'text-gray-400 ml-1'}`}>
                        {formatTime(msg.created_at)}
                      </p>
                      <button
                        onClick={() => handleReply(msg)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-500"
                        title="Reply"
                      >
                        <Reply className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Full-screen image modal */}
      {fullScreenImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setFullScreenImage(null)}
        >
          <button
            onClick={() => setFullScreenImage(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          <img
            src={fullScreenImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-2">
          <div className="flex items-center gap-2 text-gray-400">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-xs">
              {typingUsers.length === 1
                ? `${typingUsers[0]} is typing...`
                : typingUsers.length === 2
                  ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
                  : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`}
            </span>
          </div>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="mx-4 mb-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="bg-white border-t border-gray-200 px-4 py-3">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3 mb-2">
              {EMOJI_CATEGORIES.map((cat, i) => (
                <button
                  key={i}
                  className="text-xl hover:scale-125 transition-transform"
                  onClick={() => {
                    const el = document.getElementById(`emoji-cat-${i}`);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="max-h-36 overflow-y-auto">
              {EMOJI_CATEGORIES.map((cat, i) => (
                <div key={i} id={`emoji-cat-${i}`} className="mb-2">
                  <div className="flex flex-wrap gap-1">
                    {cat.emojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiClick(emoji)}
                        className="w-10 h-10 flex items-center justify-center text-xl rounded-lg hover:bg-gray-100 active:scale-90 transition-all"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Image preview */}
      {imagePreview && (
        <div className="bg-green-50 border-t border-green-200 px-4 py-2">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <img
              src={imagePreview}
              alt="Selected"
              className="w-14 h-14 object-cover rounded-lg border-2 border-green-300"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-green-700">Photo ready to send</p>
              <p className="text-xs text-gray-500 truncate">{selectedImage?.name}</p>
            </div>
            <button onClick={clearSelectedImage} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Reply preview */}
      {replyTo && (
        <div className="bg-blue-50 border-t border-blue-200 px-4 py-2">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <Reply className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-blue-600">{replyTo.sender_name}</p>
              <p className="text-xs text-gray-500 truncate">{replyTo.content}</p>
            </div>
            <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />

      {/* Input bar */}
      <div className="bg-white border-t-2 border-gray-200 px-4 py-3 sticky bottom-0">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            title="Send photo"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
              showEmojiPicker
                ? 'bg-blue-100 text-blue-500'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Smile className="h-5 w-5" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              replyTo
                ? `Reply to ${replyTo.sender_name}...`
                : selectedImage
                  ? 'Add a caption (optional)...'
                  : 'Type a message...'
            }
            maxLength={500}
            className="flex-1 bg-gray-100 rounded-full px-5 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 border border-gray-200"
          />
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
              canSend
                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg active:scale-95'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {compressing || sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}