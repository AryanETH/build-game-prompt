import { Achievement } from '@/types';
import { Card } from './ui/card';
import { Lock, Trophy } from 'lucide-react';
import { Progress } from './ui/progress';

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked: boolean;
  unlockedAt?: string;
  currentProgress?: number; // Current value (e.g., 3 games created)
}

export const AchievementBadge = ({ achievement, unlocked, unlockedAt, currentProgress = 0 }: AchievementBadgeProps) => {
  const rarityColors = {
    common: 'from-gray-400 to-gray-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-orange-600',
  };

  const rarityBorder = {
    common: 'border-gray-400',
    rare: 'border-blue-400',
    epic: 'border-purple-400',
    legendary: 'border-yellow-400',
  };

  // Calculate progress percentage
  const progressPercentage = unlocked 
    ? 100 
    : Math.min((currentProgress / achievement.requirement_value) * 100, 100);

  return (
    <Card 
      className={`relative p-3 md:p-4 transition-all hover:scale-105 ${
        unlocked ? `border-2 ${rarityBorder[achievement.rarity]}` : 'opacity-50 grayscale'
      }`}
    >
      {/* Rarity indicator */}
      <div className={`absolute top-1.5 right-1.5 md:top-2 md:right-2 px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold text-white bg-gradient-to-r ${rarityColors[achievement.rarity]}`}>
        {achievement.rarity.toUpperCase()}
      </div>

      {/* Icon */}
      <div className="flex justify-center mb-2 md:mb-3">
        {unlocked ? (
          <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br ${rarityColors[achievement.rarity]} flex items-center justify-center`}>
            <Trophy className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
        ) : (
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
            <Lock className="w-6 h-6 md:w-8 md:h-8 text-gray-500" />
          </div>
        )}
      </div>

      {/* Name */}
      <h3 className="font-bold text-sm md:text-base text-center mb-1">{achievement.name}</h3>

      {/* Description */}
      <p className="text-[11px] md:text-xs text-muted-foreground text-center mb-2 line-clamp-2">
        {achievement.description}
      </p>

      {/* Reward */}
      <div className="text-center">
        <span className="text-sm font-semibold text-yellow-500">
          +{achievement.coins_reward} coins
        </span>
      </div>

      {/* Progress bar and status */}
      {!unlocked && (
        <div className="mt-3 space-y-1">
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs text-center text-muted-foreground">
            {currentProgress} / {achievement.requirement_value}
          </p>
        </div>
      )}

      {/* Unlocked date */}
      {unlocked && unlockedAt && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          Unlocked {new Date(unlockedAt).toLocaleDateString()}
        </p>
      )}
    </Card>
  );
};
