import { Navigation } from "@/components/Navigation";
import { GameFeed } from "@/components/GameFeed";

export default function Feed() {
  return (
    <div className="min-h-screen pb-16 md:pt-16">
      <Navigation />
      <GameFeed />
    </div>
  );
}