import { GameCard } from "./GameCard";
import { FeedProps } from "./types";
import { Play, Heart, MessageCircle, Share2 } from "lucide-react";

export const DesktopFeed = ({
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
  return (
    <div className="w-full min-h-screen bg-[#F8F9FA]">
      <div className="overflow-y-auto h-screen no-scrollbar flex flex-col items-center gap-8 py-10 px-20">
        {games.map((game, index) => (
          <div key={game.id} className="relative flex items-center justify-center gap-4">
            {/* Card */}
            <div className="relative w-[374px] min-h-[660px] h-auto">
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
                isMobile={false}
                hideButtons={true}
              />
              
              {/* Next card peek */}
              {index < games.length - 1 && (
                <div className="absolute bottom-[-24px] left-0 right-0 h-24 rounded-t-3xl bg-gray-300 border border-gray-200 border-b-0 shadow-sm pointer-events-none z-[-1]">
                  <div className="absolute inset-0 rounded-t-3xl overflow-hidden">
                    <img 
                      src={games[index + 1].cover_url || games[index + 1].thumbnail_url || '/placeholder.svg'}
                      alt=""
                      className="w-full h-full object-cover opacity-40"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons - Right Side */}
            <div className="flex flex-col gap-5 items-center z-50">
              {/* Play button */}
              <button
                aria-label="Play game"
                className="h-12 w-12 rounded-full flex items-center justify-center bg-[#5B4AF4] text-white hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg"
                onClick={() => onPlay(game)}
              >
                <Play className="h-5 w-5 fill-current ml-1" strokeWidth={2} />
              </button>
              
              {/* Like button */}
              <div className="flex flex-col items-center gap-1">
                <button
                  aria-label={likedGames.has(game.id) ? 'Unlike game' : 'Like game'}
                  className={`h-12 w-12 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg ${
                    likedGames.has(game.id) 
                      ? 'bg-red-500 text-white' 
                      : 'bg-[#FF4D4D] text-white'
                  }`}
                  onClick={() => onLike(game.id, likedGames.has(game.id))}
                >
                  <Heart className="h-6 w-6 fill-current" strokeWidth={2} />
                </button>
                <span className="text-xs font-bold text-gray-500 mt-1">{game.likes_count ?? 0}</span>
              </div>
              
              {/* Comments button */}
              <div className="flex flex-col items-center gap-1">
                <button
                  aria-label="View comments"
                  className="h-12 w-12 rounded-full flex items-center justify-center bg-gray-400/50 backdrop-blur-sm text-white hover:bg-gray-400 hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg"
                  onClick={() => onComment(game)}
                >
                  <MessageCircle className="h-6 w-6 fill-white transform -scale-x-100" strokeWidth={2} />
                </button>
                <span className="text-xs font-bold text-gray-500 mt-1">
                  {commentsCount[game.id] || game.comments_count || 0}
                </span>
              </div>
              
              {/* Share button */}
              <div className="flex flex-col items-center">
                <button
                  aria-label="Share game"
                  className="h-12 w-12 rounded-full flex items-center justify-center bg-gray-400/50 backdrop-blur-sm text-white hover:bg-gray-400 hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg"
                  onClick={() => onShare(game)}
                >
                  <Share2 className="h-6 w-6 ml-[-2px]" strokeWidth={2} />
                </button>
              </div>
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
    </div>
  );
};
