import { Heart, MessageCircle, Share2, Play, Sparkles } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Card } from "../ui/card";
import { GameWithCreator } from "./types";

interface GameCardProps {
  game: GameWithCreator;
  userId: string | null;
  isLiked: boolean;
  isFollowing: boolean;
  commentsCount: number;
  onPlay: () => void;
  onLike: () => void;
  onShare: () => void;
  onRemix: () => void;
  onComment: () => void;
  onFollow: () => void;
  onNavigateToProfile: () => void;
  isMobile?: boolean;
  hideButtons?: boolean;
}

export const GameCard = ({
  game,
  userId,
  isLiked,
  isFollowing,
  commentsCount,
  onPlay,
  onLike,
  onShare,
  onRemix,
  onComment,
  onFollow,
  onNavigateToProfile,
  isMobile = false,
  hideButtons = false
}: GameCardProps) => {
  return (
    <Card className={`relative w-full h-full overflow-hidden ${isMobile ? 'rounded-none border-0 bg-black' : 'rounded-3xl border border-gray-200 shadow-lg bg-gray-300'}`}>
      <img
        src={game.cover_url || game.thumbnail_url || '/placeholder.svg'}
        alt={game.title}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className={`absolute inset-0 ${isMobile ? 'bg-gradient-to-t from-black/90 via-black/10 to-transparent dark:from-black/95 dark:via-black/20' : 'bg-gradient-to-b from-gray-200/50 via-gray-300/50 to-black/80'}`} />
      
      {/* Center Placeholder Icon - Desktop only */}
      {!isMobile && (
      <div className="absolute inset-0 flex items-center justify-center z-0 opacity-20">
        <svg className="w-24 h-24 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
      </div>
      )}

      {/* Remix button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          className="px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
          onClick={onRemix}
        >
          <Sparkles className="w-4 h-4" strokeWidth={2} />
          Remix
        </button>
      </div>

      {/* Game info - bottom left */}
      <div className={`absolute left-0 right-[70px] ${isMobile ? 'bottom-6 p-3' : 'bottom-16 p-5'} text-white z-10`}>
        <div className="flex items-center gap-2 mb-2">
          <button 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity group"
            onClick={onNavigateToProfile}
          >
            <div className="relative">
              <Avatar className={`${isMobile ? 'w-9 h-9' : 'w-12 h-12'} border-2 border-white/50 group-hover:border-white transition-colors`}>
                <AvatarImage src={game.creator?.avatar_url || undefined} />
                <AvatarFallback className={`gradient-primary text-white ${isMobile ? 'text-xs' : 'text-sm'} font-semibold`}>
                  {game.creator?.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {/* Plus icon for follow */}
              {game.creator_id !== userId && !isFollowing && (
                <button
                  className={`absolute -bottom-0.5 -right-0.5 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'} rounded-full gradient-primary flex items-center justify-center text-white shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 border-2 border-white`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFollow();
                  }}
                >
                  <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold leading-none`}>+</span>
                </button>
              )}
            </div>
            <span className={`${isMobile ? 'text-sm' : 'text-base'} font-bold drop-shadow-lg`}>@{game.creator?.username || 'creator'}</span>
          </button>
        </div>
        <div className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold leading-tight mb-1 drop-shadow-lg line-clamp-2`}>{game.title}</div>
        <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-white/95 line-clamp-2 drop-shadow-md leading-snug`}>{game.description || ''}</div>
      </div>

      {/* Action buttons - Only show if not hidden */}
      {!hideButtons && (
      <div className={`absolute ${isMobile ? 'right-3 bottom-20' : '-right-[70px] bottom-[200px]'} flex flex-col gap-3 md:gap-5 items-center text-white z-30`}>
        {/* Play button */}
        <button
          aria-label="Play game"
          className={`h-12 w-12 rounded-full flex items-center justify-center ${isMobile ? 'gradient-primary' : 'bg-[#5B4AF4]'} text-white hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg`}
          onClick={onPlay}
        >
          <Play className={`h-5 w-5 fill-current ${!isMobile && 'ml-1'}`} strokeWidth={2} />
        </button>
        
        {/* Like button */}
        <div className={`flex flex-col items-center ${isMobile ? 'gap-0.5' : 'gap-1'}`}>
          <button
            aria-label={isLiked ? 'Unlike game' : 'Like game'}
            className={`h-12 w-12 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg ${
              isLiked 
                ? 'bg-red-500 text-white' 
                : isMobile ? 'bg-gray-600/80 text-white hover:bg-gray-500' : 'bg-[#FF4D4D] text-white'
            }`}
            onClick={onLike}
          >
            <Heart className={`fill-current ${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} strokeWidth={2} />
          </button>
          <span className={`${isMobile ? 'text-[10px] text-white drop-shadow-lg' : 'text-xs text-gray-500 mt-1'} font-bold`}>{game.likes_count ?? 0}</span>
        </div>
        
        {/* Comments button */}
        <div className={`flex flex-col items-center ${isMobile ? 'gap-0.5' : 'gap-1'}`}>
          <button
            aria-label="View comments"
            className={`h-12 w-12 rounded-full flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg ${
              isMobile ? 'bg-gray-600/80 hover:bg-gray-500' : 'bg-gray-400/50 backdrop-blur-sm hover:bg-gray-400'
            }`}
            onClick={onComment}
          >
            <MessageCircle className={`fill-white transform -scale-x-100 ${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} strokeWidth={2} />
          </button>
          <span className={`${isMobile ? 'text-[10px] text-white drop-shadow-lg' : 'text-xs text-gray-500 mt-1'} font-bold`}>
            {commentsCount}
          </span>
        </div>
        
        {/* Share button */}
        <div className="flex flex-col items-center">
          <button
            aria-label="Share game"
            className={`h-12 w-12 rounded-full flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg ${
              isMobile ? 'bg-gray-600/80 hover:bg-gray-500' : 'bg-gray-400/50 backdrop-blur-sm hover:bg-gray-400'
            }`}
            onClick={onShare}
          >
            <Share2 className={`ml-[-2px] ${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} strokeWidth={2} />
          </button>
        </div>
      </div>
      )}
    </Card>
  );
};
