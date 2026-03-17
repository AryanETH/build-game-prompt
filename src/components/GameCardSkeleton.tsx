import { Card } from './ui/card';

// Shimmer base class
const S = "animate-pulse bg-white/10 rounded";

export const GameCardSkeleton = () => {
  return (
    <Card className="relative w-full h-full overflow-hidden rounded-[20px] border-0 md:border md:border-gray-200 dark:md:border-gray-700 md:shadow-lg bg-black">
      {/* Shimmer background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 animate-pulse" />

      {/* Remix button - top right (desktop only) */}
      <div className="hidden md:block absolute top-4 right-4 z-10">
        <div className={`${S} w-24 h-9 rounded-full`} />
      </div>

      {/* ── MOBILE BOTTOM OVERLAY ── */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
        <div className="h-24 bg-gradient-to-t from-black/75 to-transparent" />
      </div>

      {/* Stats row */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 z-30">
        <div className="bg-black/55 backdrop-blur-md px-4 py-2 flex items-center gap-4">
          {/* Heart */}
          <div className="flex items-center gap-1.5">
            <div className={`${S} w-[18px] h-[18px] rounded-full`} />
            <div className={`${S} w-6 h-3`} />
          </div>
          {/* Comment */}
          <div className="flex items-center gap-1.5">
            <div className={`${S} w-[18px] h-[18px] rounded-full`} />
            <div className={`${S} w-6 h-3`} />
          </div>
          {/* Bookmark */}
          <div className="flex items-center gap-1.5">
            <div className={`${S} w-[18px] h-[18px] rounded-full`} />
            <div className={`${S} w-6 h-3`} />
          </div>
          <div className="flex-1" />
          {/* Camera */}
          <div className={`${S} w-8 h-8 rounded-full`} />
          {/* Share */}
          <div className={`${S} w-8 h-8 rounded-full`} />
        </div>

        {/* Creator row */}
        <div className="bg-black/65 backdrop-blur-md px-4 py-2.5 flex items-center gap-3">
          {/* Avatar */}
          <div className={`${S} w-10 h-10 rounded-full flex-shrink-0`} />
          {/* Name + subtitle */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className={`${S} w-28 h-3.5`} />
            <div className={`${S} w-40 h-3`} />
          </div>
          {/* Remix badge */}
          <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
            <div className={`${S} w-9 h-9 rounded-full`} />
            <div className={`${S} w-5 h-2.5 mt-0.5`} />
          </div>
        </div>
      </div>

      {/* Mute button placeholder - top left mobile */}
      <div className="md:hidden absolute top-4 left-4 z-30">
        <div className={`${S} w-9 h-9 rounded-full`} />
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

// Mobile Feed Skeleton — full-screen scroll-snap, matches new TikTok-style feed
export const MobileFeedSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <div className="snap-feed-container w-full bg-black no-scrollbar">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="snap-item w-full h-full">
          <GameCardSkeleton />
        </div>
      ))}
    </div>
  );
};
