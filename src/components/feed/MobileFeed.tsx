import { useRef } from 'react';
import { GameCard } from "./GameCard";
import { FeedProps } from "./types";

export const MobileFeed = ({
  games,
  userId,
  likedGames,
  followedUsers,
  commentsCount,
  onPlay,
  onLike,
  onShare,
  onRemix,
  onComment,
  onFollow,
  onNavigateToProfile
}: FeedProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={containerRef}
      className="snap-feed-container w-full bg-white dark:bg-black no-scrollbar"
    >
      {games.map((game) => (
        <div 
          key={game.id}
          // specific class for the item to ensure it snaps correctly
          className="snap-item w-full flex items-center justify-center relative"
        >
          {/* Pass container ref if needed for game visibility logic (IntersectionObserver),
              but not for forcing scroll. */}
          <div className="w-full h-full relative">
            <GameCard
              game={game}
              userId={userId}
              isLiked={likedGames.has(game.id)}
              isFollowing={followedUsers.has(game.creator_id)}
              commentsCount={commentsCount[game.id] || game.comments_count || 0}
              onPlay={() => onPlay(game)}
              onLike={() => onLike(game.id, likedGames.has(game.id))}
              onShare={() => onShare(game)}
              onRemix={() => onRemix(game)}
              onComment={() => onComment(game)}
              onFollow={() => onFollow(game.creator_id)}
              onNavigateToProfile={() => game.creator?.username && onNavigateToProfile(game.creator.username)}
              isMobile={true}
            />
          </div>
        </div>
      ))}
      
      {games.length === 0 && (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2 text-foreground">No games yet</h3>
            <p className="text-muted-foreground">Be the first to create a game!</p>
          </div>
        </div>
      )}
    </div>
  );
};
