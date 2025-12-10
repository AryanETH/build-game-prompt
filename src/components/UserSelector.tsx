import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Search, Users, UserCheck, UserX, Bell, BellOff, RefreshCw } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface User {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  total_plays?: number;
  total_likes?: number;
  isSubscribed?: boolean;
}

interface UserSelectorProps {
  selectedUsers: string[];
  onSelectionChange: (userIds: string[]) => void;
  onSendModeChange: (mode: 'all' | 'selected') => void;
  sendMode: 'all' | 'selected';
}

export const UserSelector = ({ 
  selectedUsers, 
  onSelectionChange, 
  onSendModeChange, 
  sendMode 
}: UserSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlySubscribed, setShowOnlySubscribed] = useState(false);

  // Fetch all users with subscription status
  const { data: users = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: async () => {
      // First get all users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, created_at, total_plays, total_likes')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching users:', profilesError);
        return [];
      }

      // Then get subscription status
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('push_subscriptions')
        .select('user_id');

      if (subscriptionsError) {
        console.error('Error fetching subscriptions:', subscriptionsError);
      }

      const subscribedUserIds = new Set(subscriptions?.map(s => s.user_id) || []);

      return profiles.map(user => ({
        ...user,
        isSubscribed: subscribedUserIds.has(user.id)
      })) as (User & { isSubscribed: boolean })[];
    },
    refetchInterval: 5000, // Refetch every 5 seconds to keep data fresh
  });

  // Subscribe to real-time changes in push subscriptions
  useEffect(() => {
    const subscriptionChannel = supabase
      .channel('push-subscriptions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'push_subscriptions',
        },
        () => {
          // Refetch users data when subscriptions change
          refetch();
        }
      )
      .subscribe();

    return () => {
      subscriptionChannel.unsubscribe();
    };
  }, [refetch]);

  // Filter users based on search term and subscription status
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubscription = showOnlySubscribed ? user.isSubscribed : true;
    return matchesSearch && matchesSubscription;
  });

  const handleUserToggle = (userId: string) => {
    const newSelection = selectedUsers.includes(userId)
      ? selectedUsers.filter(id => id !== userId)
      : [...selectedUsers, userId];
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    onSelectionChange(users.map(user => user.id));
  };

  const handleSelectNone = () => {
    onSelectionChange([]);
  };

  // Calculate subscribed count from users data
  const subscribedCount = users.filter(user => user.isSubscribed).length;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Select Recipients
          {isFetching && (
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant={sendMode === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSendModeChange('all')}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            All Users ({subscribedCount} subscribed)
          </Button>
          <Button
            variant={sendMode === 'selected' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSendModeChange('selected')}
            className="flex items-center gap-2"
          >
            <UserCheck className="h-4 w-4" />
            Selected ({selectedUsers.length})
          </Button>
        </div>
      </CardHeader>

      {sendMode === 'selected' && (
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={showOnlySubscribed ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowOnlySubscribed(!showOnlySubscribed)}
                className="flex items-center gap-2"
              >
                <Bell className="h-4 w-4" />
                {showOnlySubscribed ? 'Showing Subscribed Only' : 'Show Subscribed Only'}
              </Button>
              <div className="text-xs text-muted-foreground">
                {subscribedCount} of {users.length} users subscribed
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={isLoading}
            >
              Select All ({filteredUsers.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectNone}
              disabled={selectedUsers.length === 0}
            >
              <UserX className="h-4 w-4 mr-1" />
              Clear Selection
            </Button>
          </div>

          {/* Selected Users Summary */}
          {selectedUsers.length > 0 && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-2">
                Selected Users ({selectedUsers.length}):
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedUsers.slice(0, 10).map(userId => {
                  const user = users.find(u => u.id === userId);
                  return user ? (
                    <Badge key={userId} variant="secondary" className="text-xs">
                      @{user.username}
                    </Badge>
                  ) : null;
                })}
                {selectedUsers.length > 10 && (
                  <Badge variant="outline" className="text-xs">
                    +{selectedUsers.length - 10} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Users List */}
          <ScrollArea className="h-64">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Loading users...</div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">
                  {searchTerm ? 'No users found matching your search' : 'No users found'}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer ${
                      !user.isSubscribed ? 'opacity-60' : ''
                    }`}
                    onClick={() => handleUserToggle(user.id)}
                  >
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {user.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium truncate">
                          @{user.username}
                        </div>
                        {user.isSubscribed ? (
                          <Bell className="h-3 w-3 text-green-500" title="Subscribed to notifications" />
                        ) : (
                          <BellOff className="h-3 w-3 text-gray-400" title="Not subscribed to notifications" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.total_plays || 0} plays • {user.total_likes || 0} likes
                        {user.isSubscribed ? (
                          <span className="text-green-600 ml-2">• Will receive notifications</span>
                        ) : (
                          <span className="text-gray-500 ml-2">• Won't receive notifications</span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  );
};