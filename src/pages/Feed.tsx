import { GameFeed } from "@/components/GameFeed";
import { FeedTabs } from "@/components/FeedTabs";
import { WatchFeed } from "@/components/WatchFeed";

export default function Feed() {
  return (
    <FeedTabs 
      playContent={<GameFeed />}
      watchContent={<WatchFeed />}
    />
  );
}