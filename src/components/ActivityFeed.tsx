import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "./ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Loader2, Sparkles, Heart, UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  user_id: string;
  activity_type: 'game_published' | 'game_creating' | 'game_liked' | 'user_followed';
  game_id: string | null;
  target_user_id: string | null;
  metadata: any;
  created_at: string;
  user?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  game?: {
    id: string;
    title: string;
  };
}

export const ActivityFeed = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
    getCurrentUser();
    
    // Listen for realtime updates
    const channel = supabase
      .channel('activities-feed')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_activities'
      }, () => {
        fetchActivities();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getCurrentUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUserId(data.user?.id || null);
  };

  const fetchActivities = async () => {
    try {
      // Fetch activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('user_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (activitiesError) throw activitiesError;

      // Fetch related profiles and games
      const userIds = [...new Set(activitiesData?.map(a => a.user_id) || [])];
      const gameIds = [...new Set(activitiesData?.filter(a => a.game_id).map(a => a.game_id) || [])];

      const [{ data: profiles }, { data: games }] = await Promise.all([
        supabase.from('profiles').select('id, username, avatar_url').in('id', userIds),
        supabase.from('games').select('id, title').in('id', gameIds)
      ]);

      // Merge data
      const enriched = activitiesData?.map(activity => ({
        ...activity,
        user: profiles?.find(p => p.id === activity.user_id),
        game: games?.find(g => g.id === activity.game_id)
      })) || [];

      setActivities(enriched as Activity[]);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'game_published':
        return <Sparkles className="w-4 h-4 text-primary" />;
      case 'game_creating':
        return <Sparkles className="w-4 h-4 text-accent" />;
      case 'game_liked':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'user_followed':
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getActivityText = (activity: Activity) => {
    const username = activity.user?.username || 'User';
    
    switch (activity.activity_type) {
      case 'game_published':
        return (
          <>
            <span className="font-semibold">{username}</span> published a new game:{' '}
            <span className="font-medium text-primary">{activity.game?.title || 'Untitled'}</span>
          </>
        );
      case 'game_creating':
        return (
          <>
            <span className="font-semibold">{username}</span> is currently creating a new game
          </>
        );
      case 'game_liked':
        return (
          <>
            <span className="font-semibold">{username}</span> liked{' '}
            <span className="font-medium">{activity.game?.title || 'a game'}</span>
          </>
        );
      case 'user_followed':
        return (
          <>
            <span className="font-semibold">{username}</span> followed a user
          </>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No activities yet. Follow users to see their activities!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <Card key={activity.id} className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarImage src={activity.user?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {activity.user?.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.activity_type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed">
                    {getActivityText(activity)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};