import { ActivityFeed } from "@/components/ActivityFeed";
import { Card } from "@/components/ui/card";

export default function Activity() {
  return (
    <div className="min-h-screen pb-16 md:pb-0 gradient-hero">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Card className="p-6 gradient-card border-primary/20">
          <h1 className="text-3xl font-bold mb-2">Activity</h1>
          <p className="text-muted-foreground">See what's happening in your network</p>
        </Card>
        
        <ActivityFeed />
      </div>
    </div>
  );
}
