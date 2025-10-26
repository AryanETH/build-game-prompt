import { Heart, Play, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PostActions from "./PostActions"; // Assuming you have this component

interface GameCardProps {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  coverUrl?: string;
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
  coverUrl,
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
          src={thumbnailUrl || coverUrl || "/placeholder.svg"}
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
            <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            <span>{likesCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Play className="h-3.5 w-3.5" />
            <span>{playsCount}</span>
          </div>
        </div>
        
        <div className="flex items-center">
          <PostActions />
          <Button
            onClick={onPlay}
            className="gradient-primary glow-primary"
            size="sm"
          >
            Play
          </Button>
        </div>
      </div>
    </Card>
  );
};
