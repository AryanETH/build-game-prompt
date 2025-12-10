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

  // Enhanced re-snap hook: Maintain scroll snap across all interactions
  useEffect(() => {
    const reEngageScrollSnap = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const currentScrollTop = container.scrollTop;
        
        // Force re-apply scroll snap styles
        container.style.scrollSnapType = 'y mandatory';
        container.style.overflowY = 'auto';
        
        // Jolt the scroll by 1px to wake up the snap engine
        container.scrollTop = currentScrollTop + 1;
        
        // Immediately restore original position
        requestAnimationFrame(() => {
          container.scrollTop = currentScrollTop;
          
          // Double-check snap is still active after a brief delay
          setTimeout(() => {
            if (container.style.scrollSnapType !== 'y mandatory') {
              container.style.scrollSnapType = 'y mandatory';
            }
          }, 50);
        });
      }
    };

    // More aggressive re-engagement for various scenarios
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(reEngageScrollSnap, 100);
      }
    };

    const handleFocus = () => {
      setTimeout(reEngageScrollSnap, 100);
    };

    const handleResize = () => {
      setTimeout(reEngageScrollSnap, 200);
    };

    // Handle interactions that might break snap
    const handleInteraction = () => {
      // Delay to allow interaction to complete
      setTimeout(reEngageScrollSnap, 300);
    };

    // Handle touchpad/wheel scrolling that breaks snap
    const handleWheelEnd = () => {
      setTimeout(reEngageScrollSnap, 100);
    };

    // Handle touch scrolling that breaks snap
    const handleTouchEnd = () => {
      setTimeout(reEngageScrollSnap, 200);
    };

    // Listen for various events that can break scroll snap
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('resize', handleResize);
    
    // Listen for clicks and touches that might break snap
    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchend', handleInteraction);
    
    // Specific handling for touchpad and touch scrolling
    if (containerRef.current) {
      containerRef.current.addEventListener('wheel', handleWheelEnd, { passive: true });
      containerRef.current.addEventListener('touchend', handleTouchEnd, { passive: true });
      containerRef.current.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    }
    
    // Listen for modal/dialog events
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        setTimeout(reEngageScrollSnap, 200);
      }
    });

    // Enhanced scroll handling for momentum scrolling
    let scrollTimeout: NodeJS.Timeout;
    let lastScrollTop = 0;
    let scrollEndCheckCount = 0;
    
    const handleScroll = () => {
      if (containerRef.current) {
        const currentScrollTop = containerRef.current.scrollTop;
        
        clearTimeout(scrollTimeout);
        
        // For momentum scrolling, we need to detect when it truly stops
        scrollTimeout = setTimeout(() => {
          if (containerRef.current) {
            const newScrollTop = containerRef.current.scrollTop;
            
            // If scroll position hasn't changed, momentum has stopped
            if (Math.abs(newScrollTop - currentScrollTop) < 1) {
              reEngageScrollSnap();
              scrollEndCheckCount = 0;
            } else if (scrollEndCheckCount < 5) {
              // Check again if still scrolling (momentum)
              scrollEndCheckCount++;
              handleScroll();
            }
          }
        }, 100);
        
        lastScrollTop = currentScrollTop;
      }
    };

    // Periodic check to ensure snap stays active (every 2 seconds)
    const snapCheckInterval = setInterval(() => {
      if (containerRef.current && !document.hidden) {
        const container = containerRef.current;
        const computedStyle = window.getComputedStyle(container);
        if (computedStyle.scrollSnapType !== 'y mandatory') {
          reEngageScrollSnap();
        }
      }
    }, 2000);

    // Add scroll listener to container
    if (containerRef.current) {
      containerRef.current.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchend', handleInteraction);
      if (containerRef.current) {
        containerRef.current.removeEventListener('scroll', handleScroll);
        containerRef.current.removeEventListener('wheel', handleWheelEnd);
        containerRef.current.removeEventListener('touchend', handleTouchEnd);
        containerRef.current.removeEventListener('touchcancel', handleTouchEnd);
      }
      clearTimeout(scrollTimeout);
      clearInterval(snapCheckInterval);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="force-snap-container w-full bg-white dark:bg-black no-scrollbar pb-16"
    >
      {games.map((game) => (
        <div 
          key={game.id} 
          className="w-full h-[92vh] snap-start flex items-center justify-center"
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
