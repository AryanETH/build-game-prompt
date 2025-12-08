import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Loader2, Search } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
}

// Using Giphy API (free public beta key)
const GIPHY_API_KEY = "sXpGFDGZs0Dv1mmNFvYaGUvYwKX0PWIh"; // Public beta key
const GIPHY_API_URL = "https://api.giphy.com/v1/gifs";

export const GifPicker = ({ onSelect }: GifPickerProps) => {
  const [search, setSearch] = useState("");
  const [gifs, setGifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTrendingGifs();
  }, []);

  useEffect(() => {
    if (search.trim()) {
      const timer = setTimeout(() => searchGifs(search), 500);
      return () => clearTimeout(timer);
    } else {
      fetchTrendingGifs();
    }
  }, [search]);

  const fetchTrendingGifs = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${GIPHY_API_URL}/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`
      );
      const data = await response.json();
      setGifs(data.data || []);
    } catch (error) {
      console.error("Failed to fetch trending GIFs:", error);
      setGifs([]);
    } finally {
      setLoading(false);
    }
  };

  const searchGifs = async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${GIPHY_API_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=g`
      );
      const data = await response.json();
      setGifs(data.data || []);
    } catch (error) {
      console.error("Failed to search GIFs:", error);
      setGifs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[400px] max-h-[60vh] w-full overflow-hidden">
      <div className="p-3 border-b flex-shrink-0 bg-background">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search GIFs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="w-full">
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : gifs.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
            No GIFs found
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 p-3">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => onSelect(gif.images.fixed_height.url)}
                className="relative aspect-square rounded-lg overflow-hidden hover:opacity-80 transition-opacity bg-muted"
              >
                <img
                  src={gif.images.fixed_height_small.url}
                  alt={gif.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
