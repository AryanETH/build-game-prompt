import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gamepad2, Eye } from "lucide-react";

interface FeedTabsProps {
  playContent: React.ReactNode;
  watchContent: React.ReactNode;
}

export const FeedTabs = ({ playContent, watchContent }: FeedTabsProps) => {
  return (
    <Tabs defaultValue="play" className="w-full">
      <div className="sticky top-16 md:top-16 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <TabsList className="w-full h-12 rounded-none bg-transparent">
          <TabsTrigger 
            value="play" 
            className="flex-1 gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <Gamepad2 className="w-5 h-5" />
            <span className="font-semibold">Play Feed</span>
          </TabsTrigger>
          <TabsTrigger 
            value="watch" 
            className="flex-1 gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <Eye className="w-5 h-5" />
            <span className="font-semibold">Watch Feed</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="play" className="mt-0">
        {playContent}
      </TabsContent>

      <TabsContent value="watch" className="mt-0">
        {watchContent}
      </TabsContent>
    </Tabs>
  );
};
