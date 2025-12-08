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
  AlertCircle, CheckCircle, Flame, Star, Zap, BarChart3, Gamepad2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
  const [activeTab, setActiveTab] = useState<NotificationCategory | 'stats'>('all');
  const [userId, setUserId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      fetchUserStats();
    }
  }, [userId]);

  const fetchUserStats = async () => {
    if (!userId) return;
    
    setLoadingStats(true);
    try {
      // Fetch user's games
      const { data: games } = await supabase
        .from('games')
        .select('id, created_at, plays_count, likes_count, comments_count')
        .eq('creator_id', userId)
        .order('created_at', { ascending: true });

      // Fetch total likes
      const { data: likesData } = await supabase
        .from('game_likes')
        .select('game_id')
        .in('game_id', games?.map(g => g.id) || []);

      // Fetch followers
      const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      // Fetch following
      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      // Calculate stats
      const totalGames = games?.length || 0;
      const totalPlays = games?.reduce((sum, g) => sum + (g.plays_count || 0), 0) || 0;
      const totalLikes = likesData?.length || 0;
      const totalComments = games?.reduce((sum, g) => sum + (g.comments_count || 0), 0) || 0;

      // Group games by date for chart
      const gamesByDate: Record<string, number> = {};
      const playsByDate: Record<string, number> = {};
      const likesByDate: Record<string, number> = {};

      games?.forEach(game => {
        const date = new Date(game.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        gamesByDate[date] = (gamesByDate[date] || 0) + 1;
        playsByDate[date] = (playsByDate[date] || 0) + (game.plays_count || 0);
        likesByDate[date] = (likesByDate[date] || 0) + (game.likes_count || 0);
      });

      // Convert to chart data (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });

      const chartData = last7Days.map(date => ({
        date,
        games: gamesByDate[date] || 0,
        plays: playsByDate[date] || 0,
        likes: likesByDate[date] || 0,
      }));

      setStats({
        totalGames,
        totalPlays,
        totalLikes,
        totalComments,
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
        chartData,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

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
      setNotifications((data || []) as any);
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
    if (activeTab === 'all' || activeTab === 'stats') return notifications;
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
        <Card className="p-6 gradient-card border-primary/20 shadow-soft-lg hover-lift transition-smooth">
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
                <Button variant="outline" size="sm" onClick={markAllAsRead} className="shadow-soft hover-lift transition-smooth active-scale">
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllNotifications} className="text-red-500 hover-lift transition-smooth active-scale">
                  Clear all
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-0 overflow-hidden shadow-soft-lg">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as NotificationCategory | 'stats')}>
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto overflow-x-auto">
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
              <TabsTrigger 
                value="stats" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Stats
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stats" className="m-0">
              <div className="p-6 space-y-6">
                {loadingStats ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : stats ? (
                  <>
                    {/* Overview Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="p-4 shadow-soft hover-lift transition-smooth">
                        <div className="flex items-center gap-2 mb-2">
                          <Gamepad2 className="w-4 h-4 text-purple-500" />
                          <span className="text-sm text-muted-foreground">Games</span>
                        </div>
                        <div className="text-2xl font-bold">{stats.totalGames}</div>
                      </Card>
                      <Card className="p-4 shadow-soft hover-lift transition-smooth">
                        <div className="flex items-center gap-2 mb-2">
                          <Play className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-muted-foreground">Plays</span>
                        </div>
                        <div className="text-2xl font-bold">{stats.totalPlays}</div>
                      </Card>
                      <Card className="p-4 shadow-soft hover-lift transition-smooth">
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-muted-foreground">Likes</span>
                        </div>
                        <div className="text-2xl font-bold">{stats.totalLikes}</div>
                      </Card>
                      <Card className="p-4 shadow-soft hover-lift transition-smooth">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-muted-foreground">Comments</span>
                        </div>
                        <div className="text-2xl font-bold">{stats.totalComments}</div>
                      </Card>
                    </div>

                    {/* Social Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="p-4 shadow-soft hover-lift transition-smooth">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-muted-foreground">Followers</span>
                        </div>
                        <div className="text-2xl font-bold">{stats.followersCount}</div>
                      </Card>
                      <Card className="p-4 shadow-soft hover-lift transition-smooth">
                        <div className="flex items-center gap-2 mb-2">
                          <UserPlus className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-muted-foreground">Following</span>
                        </div>
                        <div className="text-2xl font-bold">{stats.followingCount}</div>
                      </Card>
                    </div>

                    {/* Games Created Chart */}
                    <Card className="p-6 shadow-soft hover-lift transition-smooth">
                      <h3 className="text-lg font-semibold mb-4">Games Created (Last 7 Days)</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={stats.chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="games" fill="#8b5cf6" name="Games" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>

                    {/* Plays & Likes Chart */}
                    <Card className="p-6 shadow-soft hover-lift transition-smooth">
                      <h3 className="text-lg font-semibold mb-4">Engagement (Last 7 Days)</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={stats.chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="plays" stroke="#3b82f6" name="Plays" strokeWidth={2} />
                          <Line type="monotone" dataKey="likes" stroke="#ef4444" name="Likes" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card>
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No stats available yet</p>
                    <p className="text-sm mt-2">Create some games to see your stats!</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {activeTab !== 'stats' && (
            <TabsContent value={activeTab as NotificationCategory} className="m-0">
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
                        className={`group relative flex items-start gap-3 p-4 rounded-xl transition-smooth cursor-pointer hover:bg-accent/50 hover-lift active-scale ${
                          !notification.payload.read ? 'bg-primary/5 border border-primary/10 shadow-soft' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex-shrink-0 relative">
                          {notification.payload.avatar_url ? (
                            <div className="relative">
                              <Avatar className="w-12 h-12 ring-2 ring-background">
                                <AvatarImage src={notification.payload.avatar_url}  className="object-cover"/>
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
            )}
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
