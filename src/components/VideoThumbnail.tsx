import { useState, useRef, useEffect } from 'react';
import { Play } from 'lucide-react';

interface VideoThumbnailProps {
  thumbnailUrl: string;
  title: string;
  className?: string;
  showPlayIcon?: boolean;
}

export const VideoThumbnail = ({ 
  thumbnailUrl, 
  title, 
  className = "w-full h-full object-cover",
  showPlayIcon = false 
}: VideoThumbnailProps) => {
  const [isVideo, setIsVideo] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check if the thumbnail URL is a video
  useEffect(() => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv', '.wmv'];
    const videoMimeTypes = ['video/', 'mp4', 'webm', 'ogg'];
    
    const isVideoFile = videoExtensions.some(ext => 
      thumbnailUrl.toLowerCase().includes(ext)
    ) || videoMimeTypes.some(type => 
      thumbnailUrl.toLowerCase().includes(type)
    );
    
    setIsVideo(isVideoFile);
  }, [thumbnailUrl]);

  // Handle video hover effects
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;

    if (isHovered && isLoaded) {
      video.currentTime = 0;
      video.play().catch(() => {
        // Ignore play errors (autoplay restrictions)
      });
    } else {
      video.pause();
    }
  }, [isHovered, isLoaded, isVideo]);

  const handleVideoLoad = () => {
    setIsLoaded(true);
  };

  const handleVideoError = () => {
    setIsVideo(false); // Fallback to image if video fails
  };

  if (isVideo) {
    return (
      <div 
        className="relative w-full h-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <video
          ref={videoRef}
          src={thumbnailUrl}
          className={className}
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
          poster={thumbnailUrl.replace(/\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv)$/i, '.jpg')} // Try to use a poster image
          style={{ objectFit: 'cover' }}
        />
        {showPlayIcon && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white/90 rounded-full p-2">
              <Play className="w-4 h-4 text-black fill-black" />
            </div>
          </div>
        )}
        {!isLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
      </div>
    );
  }

  // Fallback to regular image
  return (
    <div className="relative w-full h-full">
      <img 
        src={thumbnailUrl} 
        alt={title} 
        className={className}
        loading="lazy"
      />
      {showPlayIcon && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-white/90 rounded-full p-2">
            <Play className="w-4 h-4 text-black fill-black" />
          </div>
        </div>
      )}
    </div>
  );
};