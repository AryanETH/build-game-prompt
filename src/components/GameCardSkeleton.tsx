import { Card } from './ui/card';

export const GameCardSkeleton = () => {
  return (
    <Card className="relative w-full h-full overflow-visible md:overflow-hidden rounded-none md:rounded-3xl border-0 md:border md:border-gray-200 md:shadow-lg bg-black md:bg-gray-300">
      {/* Animated shimmer background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-400 via-gray-300 to-gray-400 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent dark:from-black/95 dark:via-black/20 md:bg-gradient-to-b md:from-gray-200/50 md:via-gray-300/50 md:to-black/80" />
      
      {/* Center Placeholder Icon - Desktop only */}
      <div className="hidden md:flex absolute inset-0 items-center justify-center z-0 opacity-20">
        <svg className="w-24 h-24 text-gray-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
      </div>

      {/* Remix button skeleton - top right */}
      <div className="absolute top-4 right-4 z-10">
        <div className="px-4 py-2 rounded-full bg-gray-400/50 dark:bg-gray-600/50 w-24 h-9 animate-pulse" />
      </div>

      {/* Game info skeleton - bottom left */}
      <div className="absolute left-0 right-[70px] md:right-[80px] bottom-6 md:bottom-16 p-3 md:p-5 text-white z-10">
        <div className="flex items-center gap-2 mb-2">
          {/* Avatar */}
          <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-gray-400/70 dark:bg-gray-600/70 animate-pulse" />
          {/* Username */}
          <div className="h-4 md:h-5 w-24 md:w-32 bg-gray-400/70 dark:bg-gray-600/70 rounded animate-pulse" />
        </div>
        
        {/* Title */}
        <div className="h-5 md:h-6 w-3/4 bg-gray-400/70 dark:bg-gray-600/70 rounded mb-2 animate-pulse" />
        
        {/* Description lines */}
        <div className="space-y-1.5">
          <div className="h-3 md:h-4 w-full bg-gray-400/60 dark:bg-gray-600/60 rounded animate-pulse" />
          <div className="h-3 md:h-4 w-2/3 bg-gray-400/60 dark:bg-gray-600/60 rounded animate-pulse" />
        </div>
      </div>

      {/* Right action bar skeleton - Mobile only */}
      <div className="md:hidden absolute right-3 bottom-20 flex flex-col gap-3 items-center z-30">
        <div className="h-12 w-12 rounded-full bg-gray-400/70 dark:bg-gray-600/70 animate-pulse" />
        <div className="flex flex-col items-center gap-0.5">
          <div className="h-12 w-12 rounded-full bg-gray-400/70 dark:bg-gray-600/70 animate-pulse" />
          <div className="h-3 w-6 bg-gray-400/60 dark:bg-gray-600/60 rounded animate-pulse mt-1" />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <div className="h-12 w-12 rounded-full bg-gray-400/70 dark:bg-gray-600/70 animate-pulse" />
          <div className="h-3 w-6 bg-gray-400/60 dark:bg-gray-600/60 rounded animate-pulse mt-1" />
        </div>
        <div className="h-12 w-12 rounded-full bg-gray-400/70 dark:bg-gray-600/70 animate-pulse" />
      </div>
    </Card>
  );
};

export const GameGridSkeleton = ({ count = 6 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="aspect-square">
          <Card className="w-full h-full animate-pulse">
            <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 rounded-lg" />
          </Card>
        </div>
      ))}
    </div>
  );
};
