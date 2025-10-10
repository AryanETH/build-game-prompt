import { Navigation } from "@/components/Navigation";
import { GameFeed } from "@/components/GameFeed";
import { FeedTabs } from "@/components/FeedTabs";
import { WatchFeed } from "@/components/WatchFeed";

export default function Feed() {
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