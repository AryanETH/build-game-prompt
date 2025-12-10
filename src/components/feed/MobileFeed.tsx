import { useEffect, useRef } from "react";
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

  // Scroll snap maintenance - especially after game interactions
  useEffect(() => {
    const reEngageScrollSnap = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        
        // Force re-apply scroll snap styles
        container.style.scrollSnapType = 'y mandatory';
        container.style.overflowY = 'auto';
        
        // Find the closest snap point and snap to it
        const containerHeight = container.clientHeight;
        const currentScrollTop = container.scrollTop;
        const snapIndex = Math.round(currentScrollTop / containerHeight);
        const targetScrollTop = snapIndex * containerHeight;
        
        // Smooth scroll to the nearest snap point
        container.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
      }
    };

    // Handle game interactions that break snap alignment
    const handleGameInteraction = () => {
      // Delay to allow game modal/interaction to complete
      setTimeout(reEngageScrollSnap, 300);
    };

    // Handle tab visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(reEngageScrollSnap, 100);
      }
    };

    // Handle window focus
    const handleFocus = () => {
      setTimeout(reEngageScrollSnap, 100);
    };

    // Handle resize events
    const handleResize = () => {
      setTimeout(reEngageScrollSnap, 200);
    };

    // Listen for events that can break scroll snap
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('resize', handleResize);
    
    // Listen for clicks that might break snap (especially game interactions)
    document.addEventListener('click', handleGameInteraction);
    
    // Periodic check to ensure snap stays active
    const snapCheckInterval = setInterval(() => {
      if (containerRef.current && !document.hidden) {
        const container = containerRef.current;
        const computedStyle = window.getComputedStyle(container);
        if (computedStyle.scrollSnapType !== 'y mandatory') {
          reEngageScrollSnap();
        }
      }
    }, 2000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('click', handleGameInteraction);
      clearInterval(snapCheckInterval);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="snap-feed-container w-full bg-white dark:bg-black no-scrollbar"
    >
      {games.map((game) => (
        <div 
          key={game.id}
          className="w-full h-screen snap-start flex items-center justify-center"
        >
          <div className="relative w-full h-full">
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
