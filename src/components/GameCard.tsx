import { Heart, Play, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface GameCardProps {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  likesCount: number;
  playsCount: number;
  isLiked: boolean;
  onLike: () => void;
  onPlay: () => void;
  onShare: () => void;
}

export const GameCard = ({
  title,
  description,
  thumbnailUrl,
  likesCount,
  playsCount,
  isLiked,
  onLike,
  onPlay,
  onShare,
}: GameCardProps) => {
  return (
    <Card className="gradient-card border-border/50 overflow-hidden hover:border-primary/50 transition-smooth group">
      <div className="relative aspect-video overflow-hidden">
        <img
          src={thumbnailUrl || "/placeholder.svg"}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent flex items-end p-4">
          <div className="w-full">
            <h3 className="text-xl font-bold text-foreground mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          </div>
        </div>
      </div>
      
      <div className="p-4 flex items-center justify-between">
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            <span>{likesCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Play className="h-4 w-4" />
            <span>{playsCount}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onLike}
            className="hover:bg-primary/20"
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onShare}
            className="hover:bg-accent/20"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            onClick={onPlay}
            className="gradient-primary glow-primary"
          >
            Play Now
          </Button>
        </div>
      </div>
    </Card>
  );
};