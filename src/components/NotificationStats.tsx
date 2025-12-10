import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Bell, Users, UserCheck, Smartphone } from 'lucide-react';

export const NotificationStats = () => {
  // Get total users
  const { data: totalUsers = 0 } = useQuery({
    queryKey: ['users', 'count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      return error ? 0 : (count || 0);
    },
  });

  // Get subscribed users
  const { data: subscribedUsers = 0 } = useQuery({
    queryKey: ['push_subscriptions', 'count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('push_subscriptions')
        .select('*', { count: 'exact', head: true });
      
      return error ? 0 : (count || 0);
    },
  });

  // Get unique subscribed users (in case one user has multiple devices)
  const { data: uniqueSubscribedUsers = 0 } = useQuery({
    queryKey: ['push_subscriptions', 'unique_count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('user_id');
      
      if (error) return 0;
      
      const uniqueUsers = new Set(data?.map(sub => sub.user_id) || []);
      return uniqueUsers.size;
    },
  });

  const subscriptionRate = totalUsers > 0 ? Math.round((uniqueSubscribedUsers / totalUsers) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalUsers}</div>
          <p className="text-xs text-muted-foreground">
            Registered users
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Subscribed Users</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{uniqueSubscribedUsers}</div>
          <p className="text-xs text-muted-foreground">
            Users with notifications enabled
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
          <Smartphone className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{subscribedUsers}</div>
          <p className="text-xs text-muted-foreground">
            Devices subscribed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Subscription Rate</CardTitle>
          <Bell className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{subscriptionRate}%</div>
          <div className="flex items-center gap-1 mt-1">
            <Badge 
              variant={subscriptionRate >= 50 ? "default" : subscriptionRate >= 25 ? "secondary" : "destructive"}
              className="text-xs"
            >
              {subscriptionRate >= 50 ? "Good" : subscriptionRate >= 25 ? "Fair" : "Low"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};