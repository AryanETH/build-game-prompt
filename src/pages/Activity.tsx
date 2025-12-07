import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { 
  Heart, MessageCircle, UserPlus, Play, Sparkles, Trash2, 
  TrendingUp, Award, Gift, DollarSign, Bell,
  Share2, Bookmark, AtSign, Users, Trophy,
  AlertCircle, CheckCircle, Flame, Star, Zap
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface NotificationPayload {
  type: string;
  content: string;
  read?: boolean;
  username?: string;
  user_id?: string;
  avatar_url?: string;
  game_id?: string;
  game_title?: string;
  game_thumbnail?: string;
  comment_id?: string;
  count?: number;
  milestone?: number;
  amount?: number;
  image_url?: string; // For admin broadcast notifications
}

interface Notification {
  id: number;
  created_at: string;
  user_id: string;
  payload: NotificationPayload;
}

type NotificationCategory = 'all' | 'engagement' | 'followers' | 'milestones' | 'system';

export default function Activity() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NotificationCategory>('all');
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId]);

  // Real-time subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          toast.success('New notification!', {
            description: newNotification.payload.content,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchUserId = async () => {
    const { data } = await supabase.auth.getUser();
    setUserId(data.user?.id || null);
  };

  const fetchNotifications = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setNotifications((data || []) as Notification[]);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) return;

      const updatedPayload = { ...notification.payload, read: true };
      
      await supabase
        .from('notifications')
        .update({ payload: updatedPayload })
        .eq('id', notificationId);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, payload: updatedPayload } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;

    try {
      const unreadNotifications = notifications.filter(n => !n.payload.read);
      
      for (const notification of unreadNotifications) {
        const updatedPayload = { ...notification.payload, read: true };
        await supabase
          .from('notifications')
          .update({ payload: updatedPayload })
          .eq('id', notification.id);
      }

      setNotifications((prev) => 
        prev.map((n) => ({ ...n, payload: { ...n.payload, read: true } }))
      );
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    if (!userId) return;

    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      setNotifications([]);
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);

    if (notification.payload.user_id) {
      navigate(`/u/${notification.payload.username}`);
    } else if (notification.payload.game_id) {
      navigate(`/feed?game=${notification.payload.game_id}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconMap: { [key: string]: JSX.Element } = {
      like: <Heart className="w-5 h-5 text-red-500" fill="currentColor" />,
      comment: <MessageCircle className="w-5 h-5 text-blue-500" />,
      reply: <MessageCircle className="w-5 h-5 text-blue-400" />,
      mention: <AtSign className="w-5 h-5 text-purple-500" />,
      share: <Share2 className="w-5 h-5 text-green-500" />,
      save: <Bookmark className="w-5 h-5 text-yellow-500" />,
      follow: <UserPlus className="w-5 h-5 text-green-500" />,
      follow_back: <Users className="w-5 h-5 text-green-600" />,
      play: <Play className="w-5 h-5 text-purple-500" fill="currentColor" />,
      remix: <Sparkles className="w-5 h-5 text-yellow-500" />,
      trending: <TrendingUp className="w-5 h-5 text-orange-500" />,
      viral: <Flame className="w-5 h-5 text-red-600" />,
      milestone: <Trophy className="w-5 h-5 text-yellow-600" />,
      achievement: <Award className="w-5 h-5 text-purple-600" />,
      badge: <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />,
      level_up: <Zap className="w-5 h-5 text-blue-500" />,
      gift: <Gift className="w-5 h-5 text-pink-500" />,
      monetization: <DollarSign className="w-5 h-5 text-green-600" />,
      payout: <DollarSign className="w-5 h-5 text-green-700" />,
      system: <Bell className="w-5 h-5 text-gray-500" />,
      warning: <AlertCircle className="w-5 h-5 text-orange-600" />,
      success: <CheckCircle className="w-5 h-5 text-green-500" />,
      broadcast: <Bell className="w-5 h-5 text-blue-500" />,
    };
    return iconMap[type] || <Bell className="w-5 h-5 text-gray-500" />;
  };

  const getNotificationCategory = (type: string): NotificationCategory => {
    if (['like', 'comment', 'reply', 'mention', 'share', 'save', 'play', 'remix'].includes(type)) {
      return 'engagement';
    }
    if (['follow', 'follow_back'].includes(type)) {
      return 'followers';
    }
    if (['trending', 'viral', 'milestone', 'achievement', 'badge', 'level_up'].includes(type)) {
      return 'milestones';
    }
    if (['system', 'warning', 'success', 'gift', 'monetization', 'payout', 'broadcast'].includes(type)) {
      return 'system';
    }
    return 'all';
  };

  const filterNotifications = (notifications: Notification[]) => {
    if (activeTab === 'all') return notifications;
    return notifications.filter(n => getNotificationCategory(n.payload.type) === activeTab);
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 30) return 'just now';
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = filterNotifications(notifications);
  const unreadCount = notifications.filter((n) => !n.payload.read).length;

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Card className="p-6 gradient-card border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <div className="relative">
                  <Bell className={`w-8 h-8 ${unreadCount > 0 ? 'text-red-500' : ''}`} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                  )}
                </div>
                Activity
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </h1>
              <p className="text-muted-foreground">All your notifications in one place</p>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllNotifications} className="text-red-500">
                  Clear all
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as NotificationCategory)}>
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto">
              <TabsTrigger 
                value="all" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4"
              >
                All
              </TabsTrigger>
              <TabsTrigger 
                value="engagement" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4"
              >
                <Heart className="w-4 h-4 mr-2" />
                Engagement
              </TabsTrigger>
              <TabsTrigger 
                value="followers" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4"
              >
                <Users className="w-4 h-4 mr-2" />
                Social
              </TabsTrigger>
              <TabsTrigger 
                value="milestones" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Rewards
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="m-0">
              <ScrollArea className="h-[calc(100vh-300px)]">
                {isLoading ? (
                  <div className="p-6 space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-start gap-3 animate-pulse">
                        <div className="w-12 h-12 rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 bg-muted rounded" />
                          <div className="h-3 w-1/2 bg-muted rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="text-center py-16 px-6">
                    <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <div className="text-muted-foreground text-sm font-medium">No notifications yet</div>
                    <p className="text-xs text-muted-foreground mt-2">
                      You'll see likes, comments, and follows here
                    </p>
                  </div>
                ) : (
                  <div className="p-6 space-y-2">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`group relative flex items-start gap-3 p-4 rounded-xl transition-all cursor-pointer hover:bg-accent/50 ${
                          !notification.payload.read ? 'bg-primary/5 border border-primary/10' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex-shrink-0 relative">
                          {notification.payload.avatar_url ? (
                            <div className="relative">
                              <Avatar className="w-12 h-12 ring-2 ring-background">
                                <AvatarImage src={notification.payload.avatar_url} />
                                <AvatarFallback className="gradient-primary text-white text-xs font-semibold">
                                  {notification.payload.username?.[0]?.toUpperCase() || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background flex items-center justify-center ring-2 ring-background">
                                {getNotificationIcon(notification.payload.type)}
                              </div>
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-background">
                              {getNotificationIcon(notification.payload.type)}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-sm leading-relaxed">
                            {notification.payload.username && (
                              <span className="font-bold text-foreground">
                                {notification.payload.username}
                              </span>
                            )}{' '}
                            <span className="text-foreground/90">{notification.payload.content}</span>
                            {notification.payload.game_title && (
                              <span className="text-muted-foreground font-medium">
                                {' '}"{notification.payload.game_title}"
                              </span>
                            )}
                          </div>
                          
                          {notification.payload.image_url && (
                            <img 
                              src={notification.payload.image_url} 
                              alt="Notification"
                              className="mt-2 rounded-lg max-w-full h-auto max-h-48 object-cover"
                            />
                          )}
                          
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs text-muted-foreground font-medium">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                            {!notification.payload.read && (
                              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            )}
                          </div>
                        </div>

                        {notification.payload.game_thumbnail && (
                          <div className="flex-shrink-0">
                            <img 
                              src={notification.payload.game_thumbnail} 
                              alt="Game"
                              className="w-16 h-16 rounded-lg object-cover ring-1 ring-border"
                            />
                          </div>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 absolute top-2 right-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
