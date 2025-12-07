import { useUserAchievements } from '@/hooks/useUserAchievements';
import { AchievementBadge } from './AchievementBadge';
import { LoadingSpinner } from './LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Trophy, Lock } from 'lucide-react';

interface UserAchievementsPanelProps {
  userId: string;
}

export const UserAchievementsPanel = ({ userId }: UserAchievementsPanelProps) => {
  const { achievements, userAchievements, unlockedCount, totalCount, getProgress } = useUserAchievements(userId);

  const unlockedIds = new Set(userAchievements.map((ua) => ua.achievement_id));

  const unlockedAchievements = achievements.filter((a) => unlockedIds.has(a.id));
  const lockedAchievements = achievements.filter((a) => !unlockedIds.has(a.id));

  if (achievements.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4 px-3 md:px-0">
      {/* Progress header */}
      <div className="flex items-center justify-between p-3 md:p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg">
        <div>
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />
            Achievements
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            {unlockedCount} of {totalCount} unlocked
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl md:text-3xl font-bold text-yellow-500">
            {totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}%
          </div>
          <div className="text-xs text-muted-foreground">Complete</div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="all" className="text-xs md:text-sm">
            All ({totalCount})
          </TabsTrigger>
          <TabsTrigger value="unlocked" className="text-xs md:text-sm">
            <Trophy className="w-3 h-3 md:w-4 md:h-4 mr-1" />
            <span className="hidden sm:inline">Unlocked</span> ({unlockedCount})
          </TabsTrigger>
          <TabsTrigger value="locked" className="text-xs md:text-sm">
            <Lock className="w-3 h-3 md:w-4 md:h-4 mr-1" />
            <span className="hidden sm:inline">Locked</span> ({totalCount - unlockedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {achievements.map((achievement) => {
              const userAchievement = userAchievements.find(
                (ua) => ua.achievement_id === achievement.id
              );
              return (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  unlocked={!!userAchievement}
                  unlockedAt={userAchievement?.unlocked_at}
                  currentProgress={getProgress(achievement)}
                />
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="unlocked" className="mt-4">
          {unlockedAchievements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No achievements unlocked yet</p>
              <p className="text-sm">Keep playing to unlock achievements!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {unlockedAchievements.map((achievement) => {
                const userAchievement = userAchievements.find(
                  (ua) => ua.achievement_id === achievement.id
                );
                return (
                  <AchievementBadge
                    key={achievement.id}
                    achievement={achievement}
                    unlocked={true}
                    unlockedAt={userAchievement?.unlocked_at}
                    currentProgress={getProgress(achievement)}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="locked" className="mt-4">
          {lockedAchievements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
              <p className="text-xl font-bold mb-2">🎉 All Achievements Unlocked!</p>
              <p className="text-sm">Legend status achieved!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {lockedAchievements.map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  unlocked={false}
                  currentProgress={getProgress(achievement)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
