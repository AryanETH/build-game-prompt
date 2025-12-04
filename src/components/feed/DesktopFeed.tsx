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
     <div className="overflow-y-auto h-screen no-scrollbar flex flex-col gap-8 py-10 px-20 w-full max-w-[1200px] mx-auto">

        {games.map((game, index) => (
          <div key={game.id} className="relative flex items-center justify-center gap-6">
            {/* Action Buttons - Left Side */}
            <div className="flex flex-col gap-4 items-center">
              {/* Play button */}
              <button
                aria-label="Play game"
                className="h-14 w-14 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 text-white hover:scale-110 active:scale-95 transition-all duration-200 shadow-xl hover:shadow-2xl"
                onClick={() => onPlay(game)}
              >
                <Play className="h-6 w-6 fill-white ml-0.5" strokeWidth={0} />
              </button>
              
              {/* Like button */}
              <div className="flex flex-col items-center gap-1">
                <button
                  aria-label={likedGames.has(game.id) ? 'Unlike game' : 'Like game'}
                  className={`h-14 w-14 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 shadow-xl hover:shadow-2xl ${
                    likedGames.has(game.id) 
                      ? 'bg-gradient-to-br from-red-500 to-pink-500 text-white' 
                      : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-red-400'
                  }`}
                  onClick={() => onLike(game.id, likedGames.has(game.id))}
                >
                  <Heart className={`h-6 w-6 ${likedGames.has(game.id) ? 'fill-white' : ''}`} strokeWidth={2} />
                </button>
                <span className="text-sm font-bold text-gray-700">{game.likes_count ?? 0}</span>
              </div>
              
              {/* Comments button */}
              <div className="flex flex-col items-center gap-1">
                <button
                  aria-label="View comments"
                  className="h-14 w-14 rounded-full flex items-center justify-center bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-400 hover:scale-110 active:scale-95 transition-all duration-200 shadow-xl hover:shadow-2xl"
                  onClick={() => onComment(game)}
                >
                  <MessageCircle className="h-6 w-6" strokeWidth={2} />
                </button>
                <span className="text-sm font-bold text-gray-700">
                  {commentsCount[game.id] || game.comments_count || 0}
                </span>
              </div>
              
              {/* Share button */}
              <div className="flex flex-col items-center">
                <button
                  aria-label="Share game"
                  className="h-14 w-14 rounded-full flex items-center justify-center bg-white border-2 border-gray-300 text-gray-700 hover:border-green-400 hover:scale-110 active:scale-95 transition-all duration-200 shadow-xl hover:shadow-2xl"
                  onClick={() => onShare(game)}
                >
                  <Share2 className="h-6 w-6" strokeWidth={2} />
                </button>
              </div>
            </div>

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
