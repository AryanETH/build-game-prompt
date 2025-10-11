import { Navigation } from "@/components/Navigation";
import { GameFeed } from "@/components/GameFeed";
import { FeedTabs } from "@/components/FeedTabs";
import { WatchFeed } from "@/components/WatchFeed";
import { useEffect } from "react";

export default function Feed() {

  // Keep mount effect in case we add future behavior
  useEffect(() => {}, []);

  return (
    <div className="min-h-screen pb-16 md:pt-16">
      <Navigation />
      <FeedTabs 
        playContent={<GameFeed />}
        watchContent={<WatchFeed />}
      />
    </div>
  );
}