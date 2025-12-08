import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { 
  Heart, MessageCircle, UserPlus, Play, Sparkles, Trash2, 
  TrendingUp, Award, Gift, DollarSign, Bell, BellOff,
  Share2, Bookmark, AtSign, Users, Trophy,
  AlertCircle, CheckCircle, Flame, Star, Zap, X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "./ui/badge";

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
  count?: number; // For grouped notifications
  milestone?: number; // For milestone notifications
  amount?: number; // For monetization
  image_url?: string; // For broadcast notifications with images
  video_url?: string; // For broadcast notifications with videos
}

interface Notification {
  id: number;
  created_at: string;
  user_id: string;
  payload: NotificationPayload;
}

interface NotificationPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
}

type NotificationCategory = 'all' | 'engagement' | 'followers' | 'milestones' | 'system';

export const NotificationPanel = ({ open, onOpenChange, userId }: NotificationPanelProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NotificationCategory>('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (open && userId) {
      fetchNotifications();
    }
  }, [open, userId]);

  // Real-time subscription for new notifications
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
          
          // Show toast for important notifications
          if (shouldShowToast(newNotification.payload.type)) {
            showNotificationToast(newNotification);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const shouldShowToast = (type: string) => {
    return ['follow', 'comment', 'milestone', 'trending', 'monetization'].includes(type);
  };

  const showNotificationToast = (notification: Notification) => {
    const { payload } = notification;
    const icon = getNotificationIcon(payload.type);
    
    toast(payload.content, {
      description: payload.username || payload.game_title,
      icon: icon,
    });
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

    // If it's a broadcast notification, show dialog instead of navigating
    if (notification.payload.type === 'broadcast') {
      setSelectedNotification(notification);
      setShowBroadcastDialog(true);
      return;
    }

    // Navigate based on notification type
    if (notification.payload.user_id) {
      navigate(`/u/${notification.payload.username}`);
    } else if (notification.payload.game_id) {
      navigate(`/feed?game=${notification.payload.game_id}`);
    } else if (notification.payload.comment_id) {
      navigate(`/feed?game=${notification.payload.game_id}&comment=${notification.payload.comment_id}`);
    }

    onOpenChange(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      // Engagement
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" fill="currentColor" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'reply':
        return <MessageCircle className="w-5 h-5 text-blue-400" />;
      case 'mention':
        return <AtSign className="w-5 h-5 text-purple-500" />;
      case 'share':
        return <Share2 className="w-5 h-5 text-green-500" />;
      case 'save':
        return <Bookmark className="w-5 h-5 text-yellow-500" />;
      
      // Social
      case 'follow':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case 'follow_back':
        return <Users className="w-5 h-5 text-green-600" />;
      
      // Content
      case 'play':
        return <Play className="w-5 h-5 text-purple-500" fill="currentColor" />;
      case 'remix':
        return <Sparkles className="w-5 h-5 text-yellow-500" />;
      
      // Performance
      case 'trending':
        return <TrendingUp className="w-5 h-5 text-orange-500" />;
      case 'viral':
        return <Flame className="w-5 h-5 text-red-600" />;
      case 'milestone':
        return <Trophy className="w-5 h-5 text-yellow-600" />;
      
      // Gamification
      case 'achievement':
        return <Award className="w-5 h-5 text-purple-600" />;
      case 'badge':
        return <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />;
      case 'level_up':
        return <Zap className="w-5 h-5 text-blue-500" />;
      
      // Monetization
      case 'gift':
        return <Gift className="w-5 h-5 text-pink-500" />;
      case 'monetization':
        return <DollarSign className="w-5 h-5 text-green-600" />;
      case 'payout':
        return <DollarSign className="w-5 h-5 text-green-700" />;
      
      // System
      case 'broadcast':
        return <Bell className="w-5 h-5 text-blue-500" fill="currentColor" />;
      case 'system':
        return <Bell className="w-5 h-5 text-gray-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
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

  const groupNotifications = (notifications: Notification[]) => {
    // Group similar notifications (e.g., "5 people liked your game")
    const grouped: { [key: string]: Notification[] } = {};
    
    notifications.forEach(notification => {
      const key = `${notification.payload.type}_${notification.payload.game_id || 'general'}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(notification);
    });

    // Convert back to array, showing grouped count
    const result: Notification[] = [];
    Object.values(grouped).forEach(group => {
      if (group.length > 1 && ['like', 'play', 'save'].includes(group[0].payload.type)) {
        // Create a grouped notification
        const first = group[0];
        result.push({
          ...first,
          payload: {
            ...first.payload,
            count: group.length,
            content: getGroupedContent(first.payload.type, group.length),
          }
        });
      } else {
        result.push(...group);
      }
    });

    return result;
  };

  const getGroupedContent = (type: string, count: number) => {
    switch (type) {
      case 'like':
        return `${count} people liked your game`;
      case 'play':
        return `${count} people played your game`;
      case 'save':
        return `${count} people saved your game`;
      default:
        return `${count} interactions`;
    }
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
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    return date.toLocaleDateString();
  };

  const getNotificationPriority = (type: string): 'high' | 'medium' | 'low' => {
    if (['trending', 'viral', 'milestone', 'monetization', 'warning'].includes(type)) {
      return 'high';
    }
    if (['follow', 'comment', 'mention', 'achievement'].includes(type)) {
      return 'medium';
    }
    return 'low';
  };

  const filteredNotifications = filterNotifications(notifications);
  const groupedNotifications = groupNotifications(filteredNotifications);
  const unreadCount = notifications.filter((n) => !n.payload.read).length;

  const getCategoryCount = (category: NotificationCategory) => {
    if (category === 'all') return notifications.length;
    return notifications.filter(n => getNotificationCategory(n.payload.type) === category).length;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[420px] md:w-[480px] flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between pr-8">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </SheetTitle>
          </div>
          {(unreadCount > 0 || notifications.length > 0) && (
            <div className="flex items-center justify-between mt-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
              <div className="flex-1" />
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllNotifications}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  Clear all
                </Button>
              )}
            </div>
          )}
        </SheetHeader>

        {/* Category Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as NotificationCategory)} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto">
            <TabsTrigger 
              value="all" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-sm"
            >
              All {getCategoryCount('all') > 0 && `(${getCategoryCount('all')})`}
            </TabsTrigger>
            <TabsTrigger 
              value="engagement" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-sm"
            >
              <Heart className="w-4 h-4 mr-1" />
              Engagement
            </TabsTrigger>
            <TabsTrigger 
              value="followers" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-sm"
            >
              <Users className="w-4 h-4 mr-1" />
              Social
            </TabsTrigger>
            <TabsTrigger 
              value="milestones" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-sm"
            >
              <Trophy className="w-4 h-4 mr-1" />
              Rewards
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="flex-1 m-0">
            <ScrollArea className="h-full px-6 py-4">
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3 animate-pulse">
                      <div className="w-12 h-12 rounded-full bg-muted flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 bg-muted rounded" />
                        <div className="h-3 w-1/2 bg-muted rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : groupedNotifications.length === 0 ? (
                <div className="text-center py-16">
                  <BellOff className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <div className="text-muted-foreground text-sm font-medium">No notifications yet</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    You'll see likes, comments, and follows here
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {groupedNotifications.map((notification) => {
                    const priority = getNotificationPriority(notification.payload.type);
                    const isHighPriority = priority === 'high';
                    const isBroadcast = notification.payload.type === 'broadcast';
                    
                    return (
                      <div
                        key={notification.id}
                        className={`group relative flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer hover:bg-accent/50 ${
                          !notification.payload.read ? 'bg-primary/5 border border-primary/10' : ''
                        } ${isHighPriority ? 'ring-2 ring-orange-500/20' : ''} ${
                          isBroadcast ? 'bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/10' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        {/* Avatar or Icon with Game Thumbnail */}
                        <div className="flex-shrink-0 relative">
                          {notification.payload.avatar_url ? (
                            <div className="relative">
                              <Avatar className="w-12 h-12 ring-2 ring-background">
                                <AvatarImage className="object-cover" src={notification.payload.avatar_url} />
                                <AvatarFallback className="gradient-primary text-white text-xs font-semibold">
                                  {notification.payload.username?.[0]?.toUpperCase() || '?'}
                                </AvatarFallback>
                              </Avatar>
                              {/* Icon badge on avatar */}
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

                        {/* Content */}
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
                            {notification.payload.count && notification.payload.count > 1 && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {notification.payload.count}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs text-muted-foreground font-medium">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                            {!notification.payload.read && (
                              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            )}
                            {isHighPriority && (
                              <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
                                Important
                              </Badge>
                            )}
                            {isBroadcast && (
                              <Badge variant="outline" className="text-xs border-blue-500 text-blue-600">
                                Click to view
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Game Thumbnail (if available) */}
                        {notification.payload.game_thumbnail && (
                          <div className="flex-shrink-0">
                            <img 
                              src={notification.payload.game_thumbnail} 
                              alt="Game"
                              className="w-16 h-16 rounded-lg object-cover ring-1 ring-border"
                            />
                          </div>
                        )}

                        {/* Delete button */}
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
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>

      {/* Broadcast Notification Dialog */}
      {selectedNotification && (
        <Dialog open={showBroadcastDialog} onOpenChange={setShowBroadcastDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                {selectedNotification.payload.avatar_url ? (
                  <Avatar className="w-12 h-12 ring-2 ring-primary/20">
                    <AvatarImage className="object-cover" src={selectedNotification.payload.avatar_url} />
                    <AvatarFallback className="gradient-primary text-white font-semibold">
                      {selectedNotification.payload.username?.[0]?.toUpperCase() || 'S'}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                    <Bell className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div className="flex-1">
                  <DialogTitle className="text-xl font-bold">
                    {selectedNotification.payload.username || 'System Notification'}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    {formatTimeAgo(selectedNotification.created_at)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowBroadcastDialog(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>

            <DialogDescription className="sr-only">
              Broadcast notification details
            </DialogDescription>

            <div className="space-y-4 mt-4">
              {/* Message Content */}
              <div className="prose prose-sm max-w-none">
                <p className="text-base leading-relaxed whitespace-pre-wrap">
                  {selectedNotification.payload.content}
                </p>
              </div>

              {/* Content Image - Constrained for vertical images */}
              {selectedNotification.payload.image_url && (
                <div className="flex justify-center rounded-lg overflow-hidden border bg-muted/20">
                  <img 
                    src={selectedNotification.payload.image_url}
                    alt="Notification content"
                    className="max-h-[36vh] w-auto max-w-full object-contain"
                  />
                </div>
              )}

              {/* Content Video - Constrained for vertical videos */}
              {selectedNotification.payload.video_url && (
                <div className="relative flex justify-center rounded-lg overflow-hidden border bg-black group">
                  <video 
                    src={selectedNotification.payload.video_url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="max-h-[36vh] w-auto max-w-full cursor-pointer"
                    style={{ aspectRatio: 'auto' }}
                    onClick={(e) => {
                      const video = e.currentTarget;
                      video.muted = !video.muted;
                      
                      // Show mute/unmute indicator
                      const indicator = e.currentTarget.nextElementSibling;
                      if (indicator) {
                        indicator.classList.remove('opacity-0');
                        setTimeout(() => {
                          indicator.classList.add('opacity-0');
                        }, 1000);
                      }
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 transition-opacity duration-300">
                    <div className="bg-black/70 rounded-full p-3">
                      <Bell className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/50 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs">Tap to unmute</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {getNotificationIcon(selectedNotification.payload.type)}
                    <span className="ml-1">Broadcast</span>
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      deleteNotification(selectedNotification.id);
                      setShowBroadcastDialog(false);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowBroadcastDialog(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Sheet>
  );
};
