import { Card } from "@/components/ui/card";
import { Tv } from "lucide-react";

export const WatchFeed = () => {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card className="p-12 text-center gradient-card">
        <Tv className="w-16 h-16 mx-auto mb-4 text-primary" />
        <h3 className="text-2xl font-bold mb-2">Watch Feed Coming Soon!</h3>
        <p className="text-muted-foreground">
          Soon you'll be able to watch live gameplay, comment, and interact with other players in real-time.
        </p>
      </Card>
    </div>
  );
};
