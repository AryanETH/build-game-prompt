import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Image as ImageIcon, Smile, Eye, EyeOff, ArrowLeft, Search, MoreVertical, Trash2, Copy, Reply, Clock, X } from "lucide-react";
import { toast } from "sonner";
import { OnlineIndicator } from "@/components/OnlineIndicator";
import { GifPicker } from "@/components/GifPicker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useNavigate, useLocation } from "react-router-dom";
import { MessagesListSkeleton, MessageThreadSkeleton } from "@/components/SkeletonComponents";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_one_time: boolean;
  viewed_at: string | null;
  created_at: string;
  reply_to_id?: string | null;
  reply_to_content?: string | null;
  sender?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

interface Conversation {
  user_id: string;
  username: string;
  avatar_url: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isOneTime, setIsOneTime] = useState(false);
  const [gifPickerOpen, setGifPickerOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileList, setShowMobileList] = useState(true);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id || null;
      setUserId(uid);
      if (uid) {
        loadConversations(uid);
        
        // Set up real-time subscription for new messages
        const channel = supabase
          .channel('direct_messages_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'direct_messages',
              filter: `recipient_id=eq.${uid}`,
            },
            () => {
              // Reload conversations when new message arrives
              loadConversations(uid);
              // If viewing a conversation, reload messages
              if (selectedUser) {
                loadMessages(selectedUser.user_id);
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'direct_messages',
              filter: `sender_id=eq.${uid}`,
            },
            () => {
              // Reload conversations when user sends a message
              loadConversations(uid);
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    })();
  }, [selectedUser]);

  // Handle pre-selected user from navigation
  useEffect(() => {
    const state = location.state as { selectedUserId?: string; selectedUsername?: string };
    if (state?.selectedUserId && state?.selectedUsername && userId) {
      // Create or select conversation with this user
      const preSelectedConversation: Conversation = {
        user_id: state.selectedUserId,
        username: state.selectedUsername,
        avatar_url: null,
        last_message: '',
        last_message_time: new Date().toISOString(),
        unread_count: 0,
      };
      setSelectedUser(preSelectedConversation);
      setShowMobileList(false);
      loadMessages(state.selectedUserId);
      // Clear the state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, userId]);

  const loadConversations = async (uid: string) => {
    setIsLoadingConversations(true);
    try {
      console.log('Loading conversations for user:', uid);
      
      // Get all messages where user is sender or recipient (without foreign keys)
      const { data: messagesData, error: messagesError } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${uid},recipient_id.eq.${uid}`)
        .order('created_at', { ascending: false });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        throw messagesError;
      }

      console.log('Messages fetched:', messagesData?.length || 0);

      if (!messagesData || messagesData.length === 0) {
        setConversations([]);
        return;
      }

      // Get unique user IDs we need to fetch profiles for
      const userIds = new Set<string>();
      messagesData.forEach((msg: any) => {
        if (msg.sender_id !== uid) userIds.add(msg.sender_id);
        if (msg.recipient_id !== uid) userIds.add(msg.recipient_id);
      });

      console.log('Fetching profiles for:', Array.from(userIds));

      // Fetch all profiles at once
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', Array.from(userIds));

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      console.log('Profiles fetched:', profilesData?.length || 0);

      // Create a map of profiles
      const profilesMap = new Map();
      profilesData?.forEach((profile: any) => {
        profilesMap.set(profile.id, profile);
      });

      // Group messages by conversation partner
      const conversationsMap = new Map<string, Conversation>();

      messagesData.forEach((msg: any) => {
        const isFromMe = msg.sender_id === uid;
        const partnerId = isFromMe ? msg.recipient_id : msg.sender_id;
        const partner = profilesMap.get(partnerId);

        if (!partner) {
          console.warn('Partner profile not found for:', partnerId);
          return;
        }

        const existing = conversationsMap.get(partnerId);
        if (!existing || new Date(msg.created_at) > new Date(existing.last_message_time)) {
          const unreadCount = !isFromMe && !msg.viewed_at ? 
            (existing?.unread_count || 0) + 1 : 
            (existing?.unread_count || 0);

          conversationsMap.set(partnerId, {
            user_id: partnerId,
            username: partner.username,
            avatar_url: partner.avatar_url,
            last_message: msg.content.startsWith('[GIF]') ? '🎬 GIF' : 
                         msg.content.startsWith('[IMAGE]') ? '📷 Image' : 
                         msg.content,
            last_message_time: msg.created_at,
            unread_count: unreadCount,
          });
        }
      });

      const conversationsList = Array.from(conversationsMap.values());
      console.log('Conversations created:', conversationsList.length);
      setConversations(conversationsList);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !userId) return;

    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: userId,
          recipient_id: selectedUser.user_id,
          content: newMessage.trim(),
          is_one_time: isOneTime,
          reply_to_id: replyingTo?.id || null,
        });

      if (error) throw error;

      setNewMessage("");
      setIsOneTime(false);
      setReplyingTo(null); // Clear reply after sending
      toast.success('Message sent!');
      loadMessages(selectedUser.user_id);
      if (userId) {
        loadConversations(userId);
      }
    } catch (err) {
      console.error('Send message error:', err);
      toast.error('Failed to send message');
    }
  };

  const handleGifSelect = async (gifUrl: string) => {
    if (!selectedUser || !userId) return;

    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: userId,
          recipient_id: selectedUser.user_id,
          content: `[GIF]${gifUrl}`,
          is_one_time: isOneTime,
        });

      if (error) throw error;

      setGifPickerOpen(false);
      setIsOneTime(false);
      toast.success('GIF sent!');
      loadMessages(selectedUser.user_id);
      if (userId) {
        loadConversations(userId);
      }
    } catch (err) {
      console.error('Send GIF error:', err);
      toast.error('Failed to send GIF');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUser || !userId) return;

    try {
      // Convert to base64 for simple storage
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        const { error } = await supabase
          .from('direct_messages')
          .insert({
            sender_id: userId,
            recipient_id: selectedUser.user_id,
            content: `[IMAGE]${base64}`,
            is_one_time: isOneTime,
          });

        if (error) throw error;

        setIsOneTime(false);
        toast.success('Image sent!');
        loadMessages(selectedUser.user_id);
        if (userId) {
          loadConversations(userId);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Send image error:', err);
      toast.error('Failed to send image');
    }
  };

  const loadMessages = async (otherUserId: string) => {
    if (!userId) return;
    
    setIsLoadingMessages(true);
    try {
      console.log('Loading messages between:', userId, 'and', otherUserId);

      const { data: messagesData, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      console.log('Messages loaded:', messagesData?.length || 0);

      // Get sender profiles
      const senderIds = new Set<string>();
      messagesData?.forEach((msg: any) => {
        senderIds.add(msg.sender_id);
      });

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', Array.from(senderIds));

      const profilesMap = new Map();
      profilesData?.forEach((profile: any) => {
        profilesMap.set(profile.id, profile);
      });

      // Get reply content for messages that have reply_to_id
      const replyIds = messagesData
        ?.filter((m: any) => m.reply_to_id)
        .map((m: any) => m.reply_to_id)
        .filter(Boolean);

      let replyMap = new Map();
      if (replyIds && replyIds.length > 0) {
        const { data: repliedMessages } = await supabase
          .from('direct_messages')
          .select('id, content')
          .in('id', replyIds);
        
        repliedMessages?.forEach((r: any) => replyMap.set(r.id, r.content));
      }

      // Attach sender info and reply content to messages
      const messagesWithSender = messagesData?.map((msg: any) => ({
        ...msg,
        sender: profilesMap.get(msg.sender_id),
        reply_to_content: msg.reply_to_id ? replyMap.get(msg.reply_to_id) : null
      }));

      setMessages(messagesWithSender as unknown as Message[]);
      
      // Mark messages as viewed
      await supabase
        .from('direct_messages')
        .update({ viewed_at: new Date().toISOString() })
        .eq('recipient_id', userId)
        .eq('sender_id', otherUserId)
        .is('viewed_at', null);
      
      // Reload conversations to update unread count
      if (userId) {
        loadConversations(userId);
      }
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (selectedUser && userId) {
      loadMessages(selectedUser.user_id);
      setShowMobileList(false);
    }
  }, [selectedUser, userId]);

  // Reload conversations when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && userId) {
        loadConversations(userId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId]);

  const filteredConversations = conversations.filter(conv =>
    conv.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row bg-background h-screen pb-16 md:pb-0 w-full" style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
      {/* Conversations list - responsive */}
      <div className={`${showMobileList ? 'flex' : 'hidden'} md:flex w-full md:w-96 border-r border-border flex-col bg-background h-full`}>
        {/* Header */}
        <div className="p-4 border-b space-y-3">
          <h2 className="text-2xl font-bold">Messages</h2>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Conversations */}
        <ScrollArea className="flex-1">
          {isLoadingConversations ? (
            <MessagesListSkeleton />
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-muted-foreground text-sm">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Visit a user's profile to start messaging
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.user_id}
                  onClick={() => setSelectedUser(conv)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors ${
                    selectedUser?.user_id === conv.user_id ? 'bg-muted' : ''
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-12 w-12 ring-2 ring-background">
                      <AvatarImage src={conv.avatar_url || undefined}  className="object-cover"/>
                      <AvatarFallback className="gradient-primary text-white text-sm font-semibold">
                        {conv.username?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <OnlineIndicator userId={conv.user_id} className="absolute bottom-0 right-0 w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-semibold truncate">{conv.username}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground truncate">{conv.last_message}</div>
                  </div>
                  {conv.unread_count > 0 && (
                    <div className="w-6 h-6 rounded-full gradient-primary text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                      {conv.unread_count > 9 ? '9+' : conv.unread_count}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Messages area - responsive */}
      {selectedUser ? (
        <div className={`${showMobileList ? 'hidden' : 'flex'} md:flex flex-1 flex-col bg-background fixed md:relative inset-0 md:inset-auto`}>
          {/* Header with profile photo - Instagram style - FIXED */}
          <div className="p-4 border-b flex items-center gap-3 bg-background/95 backdrop-blur-sm flex-shrink-0 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => {
                setShowMobileList(true);
                setSelectedUser(null);
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <button 
              onClick={() => selectedUser.username && navigate(`/u/${selectedUser.username}`)}
              className="flex items-center gap-3 flex-1 min-w-0"
            >
              <div className="relative flex-shrink-0">
                <Avatar className="h-10 w-10 ring-2 ring-background">
                  <AvatarImage src={selectedUser.avatar_url || undefined}  className="object-cover"/>
                  <AvatarFallback className="gradient-primary text-white text-sm font-semibold">
                    {selectedUser.username?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <OnlineIndicator userId={selectedUser.user_id} className="absolute bottom-0 right-0 w-3 h-3" />
              </div>
              <div className="text-left min-w-0">
                <div className="font-semibold truncate">{selectedUser.username}</div>
                <div className="text-xs text-muted-foreground">Tap to view profile</div>
              </div>
            </button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages - SCROLLABLE ONLY */}
          <ScrollArea className="flex-1 p-4 bg-muted/20 overflow-y-auto">
            <div className="space-y-3 max-w-4xl mx-auto">
              {messages.map((msg) => {
                const isMine = msg.sender_id === userId;
                const isGif = msg.content.startsWith('[GIF]');
                const isImage = msg.content.startsWith('[IMAGE]');
                const isOneTimeViewed = msg.is_one_time && msg.viewed_at;

                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300 group`}>
                    <div className="flex items-start gap-2 max-w-[80%] md:max-w-[65%]">
                      {/* Message bubble */}
                      <div className={`flex-1 ${
                        isMine 
                          ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground' 
                          : 'bg-background border border-border'
                      } rounded-2xl ${isMine ? 'rounded-br-sm' : 'rounded-bl-sm'} shadow-sm`}>
                        
                        {/* Reply Indicator - WhatsApp/Instagram Style */}
                        {msg.reply_to_id && msg.reply_to_content && (
                          <div className={`mx-3 mt-3 mb-2 px-3 py-2 rounded-lg border-l-2 ${
                            isMine 
                              ? 'bg-white/10 border-white/30' 
                              : 'bg-muted/50 border-primary/50'
                          }`}>
                            <div className={`text-xs font-semibold mb-1 ${isMine ? 'text-white/70' : 'text-primary'}`}>
                              Replied to message
                            </div>
                            {msg.reply_to_content.startsWith('[GIF]') ? (
                              <div className="flex items-center gap-2 text-xs opacity-70">
                                <ImageIcon className="h-3 w-3" />
                                <span>GIF</span>
                              </div>
                            ) : msg.reply_to_content.startsWith('[IMAGE]') ? (
                              <div className="flex items-center gap-2">
                                <img 
                                  src={msg.reply_to_content.substring(7)} 
                                  alt="Reply" 
                                  className="h-10 w-10 rounded object-cover"
                                />
                                <span className="text-xs opacity-70">Photo</span>
                              </div>
                            ) : (
                              <div className={`text-xs truncate ${isMine ? 'text-white/70' : 'text-muted-foreground'}`}>
                                {msg.reply_to_content}
                              </div>
                            )}
                          </div>
                        )}

                        {isOneTimeViewed ? (
                          <div className="flex items-center gap-2 text-sm opacity-60 p-3">
                            <EyeOff className="h-4 w-4" />
                            <span>One-time message viewed</span>
                          </div>
                        ) : isGif ? (
                          <div className="p-1">
                            <img src={msg.content.substring(5)} alt="GIF" className="rounded-xl max-w-[250px] w-full" />
                          </div>
                        ) : isImage ? (
                          <div className="p-1">
                            <img src={msg.content.substring(7)} alt="Image" className="rounded-xl max-w-[250px] w-full" />
                          </div>
                        ) : (
                          <div className="px-4 py-2.5 whitespace-pre-wrap break-words">{msg.content}</div>
                        )}
                        {msg.is_one_time && !isOneTimeViewed && (
                          <div className={`flex items-center gap-1 text-xs px-4 pb-2 ${isMine ? 'opacity-80' : 'text-muted-foreground'}`}>
                            <Eye className="h-3 w-3" />
                            <span>View once</span>
                          </div>
                        )}
                      </div>

                      {/* 3-dot menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isMine ? "end" : "start"}>
                          <DropdownMenuItem
                            onClick={async (e) => {
                              e.preventDefault();
                              try {
                                const textToCopy = isGif ? msg.content.substring(5) :
                                                  isImage ? msg.content.substring(7) :
                                                  msg.content;
                                await navigator.clipboard.writeText(textToCopy);
                                toast.success('Copied to clipboard');
                              } catch (error) {
                                console.error('Copy failed:', error);
                                toast.error('Failed to copy');
                              }
                            }}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => {
                              setReplyingTo(msg);
                              toast.success('Replying to message');
                            }}
                          >
                            <Reply className="h-4 w-4 mr-2" />
                            Reply
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem
                            onClick={() => {
                              const date = new Date(msg.created_at);
                              const formatted = date.toLocaleString();
                              toast.info(formatted);
                            }}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            {new Date(msg.created_at).toLocaleString()}
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          {isMine && (
                            <>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={async () => {
                                  try {
                                    await supabase
                                      .from('direct_messages')
                                      .delete()
                                      .eq('id', msg.id);
                                    toast.success('Message deleted for everyone');
                                    if (selectedUser) loadMessages(selectedUser.user_id);
                                  } catch (error) {
                                    toast.error('Failed to delete message');
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete for everyone
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={async () => {
                              // For "delete for me", we could add a deleted_for field
                              // For now, just delete if it's your message
                              if (isMine) {
                                try {
                                  await supabase
                                    .from('direct_messages')
                                    .delete()
                                    .eq('id', msg.id);
                                  toast.success('Message deleted');
                                  if (selectedUser) loadMessages(selectedUser.user_id);
                                } catch (error) {
                                  toast.error('Failed to delete message');
                                }
                              } else {
                                toast.info('Delete for me feature coming soon');
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete for me
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input - FIXED AT BOTTOM */}
          <div className="p-4 pb-20 md:pb-4 border-t bg-background/95 backdrop-blur-sm flex-shrink-0 z-10">
            {/* Reply Preview - WhatsApp/Instagram Style */}
            {replyingTo && (
              <div className="max-w-4xl mx-auto mb-3 px-3 py-2 bg-muted/50 border-l-4 border-primary rounded-r-lg flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-primary mb-1">
                    Replying to {replyingTo.sender_id === userId ? 'yourself' : selectedUser?.username}
                  </div>
                  {replyingTo.content.startsWith('[GIF]') ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ImageIcon className="h-4 w-4" />
                      <span>GIF</span>
                    </div>
                  ) : replyingTo.content.startsWith('[IMAGE]') ? (
                    <div className="flex items-center gap-2">
                      <img 
                        src={replyingTo.content.substring(7)} 
                        alt="Reply" 
                        className="h-12 w-12 rounded object-cover"
                      />
                      <span className="text-sm text-muted-foreground">Photo</span>
                    </div>
                  ) : (
                    <div className="text-sm text-foreground truncate">{replyingTo.content}</div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={() => setReplyingTo(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="flex gap-2 items-end max-w-4xl mx-auto">
              <Popover open={gifPickerOpen} onOpenChange={setGifPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="flex-shrink-0">
                    <Smile className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0" align="start" side="top">
                  <GifPicker onSelect={handleGifSelect} />
                </PopoverContent>
              </Popover>

              <Button variant="outline" size="icon" className="flex-shrink-0" asChild>
                <label className="cursor-pointer">
                  <ImageIcon className="h-5 w-5" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </Button>

              <Button
                variant={isOneTime ? "default" : "outline"}
                size="icon"
                onClick={() => setIsOneTime(!isOneTime)}
                title="One-time message"
                className={`flex-shrink-0 ${isOneTime ? 'gradient-primary' : ''}`}
              >
                {isOneTime ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </Button>

              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && newMessage.trim()) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1 h-11"
              />

              <Button 
                onClick={handleSendMessage} 
                disabled={!newMessage.trim()} 
                className="gradient-primary flex-shrink-0 h-11 w-11"
                size="icon"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-muted/20">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 rounded-full gradient-primary mx-auto flex items-center justify-center">
              <Send className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold">Your Messages</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              Select a conversation from the list to start messaging
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
