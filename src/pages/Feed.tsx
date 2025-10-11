import { Navigation } from "@/components/Navigation";
import { GameFeed } from "@/components/GameFeed";
import { FeedTabs } from "@/components/FeedTabs";
import { WatchFeed } from "@/components/WatchFeed";
import { useEffect } from "react";
import { useLocationContext } from "@/context/LocationContext";

export default function Feed() {
  const { mode, city, requestCityFromBrowser } = useLocationContext();

  useEffect(() => {
    // Ask for location on first entry to feed if not already set
    if (mode === "global" && !city) {
      requestCityFromBrowser();
    }
  }, [mode, city, requestCityFromBrowser]);

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