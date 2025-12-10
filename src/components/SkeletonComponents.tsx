import { Card } from './ui/card';
import { Skeleton } from './ui/skeleton';

// Profile Header Skeleton
export const ProfileHeaderSkeleton = () => {
  return (
    <Card className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
        {/* Avatar skeleton */}
        <Skeleton className="w-24 h-24 md:w-32 md:h-32 rounded-full flex-shrink-0" />
        
        <div className="flex-1 w-full space-y-4">
          {/* Username */}
          <Skeleton className="h-8 w-48 mx-auto md:mx-0" />
          
          {/* Stats */}
          <div className="flex gap-6 justify-center md:justify-start">
            <div className="space-y-2">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          
          {/* Bio */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          
          {/* Buttons */}
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    </Card>
  );
};

// Game Grid Skeleton (Enhanced)
export const GameGridSkeleton = ({ count = 6 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="aspect-square">
          <Card className="relative w-full h-full overflow-hidden animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800" />
            <div className="absolute bottom-0 left-0 right-0 p-2 space-y-2">
              <Skeleton className="h-3 w-3/4 bg-gray-400/70 dark:bg-gray-600/70" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-2 w-8 bg-gray-400/60 dark:bg-gray-600/60" />
                <Skeleton className="h-2 w-8 bg-gray-400/60 dark:bg-gray-600/60" />
              </div>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
};

// Search Results Skeleton
export const SearchResultsSkeleton = () => {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-4 flex items-center gap-4 animate-pulse">
          <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </Card>
      ))}
    </div>
  );
};

// Activity Feed Skeleton
export const ActivityFeedSkeleton = () => {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="p-4 animate-pulse">
          <div className="flex items-start gap-3">
            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

// User List Skeleton (for followers/following)
export const UserListSkeleton = () => {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
          <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
      ))}
    </div>
  );
};

// Comments Skeleton
export const CommentsSkeleton = () => {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 animate-pulse">
          <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-3 mt-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Messages List Skeleton
export const MessagesListSkeleton = () => {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 hover:bg-accent/50 rounded-lg animate-pulse">
          <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Message Thread Skeleton
export const MessageThreadSkeleton = () => {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'} animate-pulse`}>
          <div className={`max-w-[70%] space-y-2 ${i % 2 === 0 ? 'items-start' : 'items-end'}`}>
            <Skeleton className={`h-16 ${i % 2 === 0 ? 'w-48' : 'w-56'} rounded-2xl`} />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Achievements Panel Skeleton
export const AchievementsSkeleton = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="p-4 space-y-3 animate-pulse">
          <Skeleton className="w-12 h-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-3/4 mx-auto" />
          <Skeleton className="h-3 w-full" />
        </Card>
      ))}
    </div>
  );
};

// Settings List Skeleton
export const SettingsListSkeleton = () => {
  return (
    <Card className="p-6">
      <div className="space-y-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between animate-pulse">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        ))}
      </div>
    </Card>
  );
};

// Tabs Content Skeleton
export const TabsContentSkeleton = () => {
  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="aspect-square animate-pulse">
            <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 rounded-lg" />
          </Card>
        ))}
      </div>
    </div>
  );
};

// Create Page Skeleton
export const CreatePageSkeleton = () => {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card className="p-6 space-y-4 animate-pulse">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-32 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>
      </Card>
    </div>
  );
};

// Admin Stats Skeleton
export const AdminStatsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-6 space-y-3 animate-pulse">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </Card>
      ))}
    </div>
  );
};

// Public Profile Skeleton
export const PublicProfileSkeleton = () => {
  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <ProfileHeaderSkeleton />
        <Card className="p-4">
          <div className="flex gap-2 mb-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
          <GameGridSkeleton count={6} />
        </Card>
      </div>
    </div>
  );
};

// Mobile Feed Skeleton - Full screen TikTok-style loading
export const MobileFeedSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <div className="snap-feed-container w-full bg-white dark:bg-black no-scrollbar">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i}
          className="w-full h-screen snap-start flex items-center justify-center"
        >
          <div className="relative w-full h-full">
            {/* Full screen shimmer background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-400 via-gray-300 to-gray-400 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent dark:from-black/95 dark:via-black/20" />
            
            {/* Center loading icon */}
            <div className="absolute inset-0 flex items-center justify-center z-10 opacity-30">
              <svg className="w-16 h-16 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            {/* Game info skeleton - bottom left */}
            <div className="absolute left-0 right-[70px] bottom-6 p-3 text-white z-20">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="w-9 h-9 rounded-full bg-gray-400/70" />
                <Skeleton className="h-4 w-24 bg-gray-400/70 rounded" />
              </div>
              <Skeleton className="h-5 w-3/4 bg-gray-400/70 rounded mb-2" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-full bg-gray-400/60 rounded" />
                <Skeleton className="h-3 w-2/3 bg-gray-400/60 rounded" />
              </div>
            </div>

            {/* Right action bar skeleton */}
            <div className="absolute right-3 bottom-20 flex flex-col gap-3 items-center z-20">
              <Skeleton className="h-12 w-12 rounded-full bg-gray-400/70" />
              <div className="flex flex-col items-center gap-0.5">
                <Skeleton className="h-12 w-12 rounded-full bg-gray-400/70" />
                <Skeleton className="h-3 w-6 bg-gray-400/60 rounded mt-1" />
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <Skeleton className="h-12 w-12 rounded-full bg-gray-400/70" />
                <Skeleton className="h-3 w-6 bg-gray-400/60 rounded mt-1" />
              </div>
              <Skeleton className="h-12 w-12 rounded-full bg-gray-400/70" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
