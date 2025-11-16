import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";
import { Play, Radio } from "lucide-react";

interface FeedTabsProps {
  playContent: React.ReactNode;
  watchContent: React.ReactNode;
}

export const FeedTabs = ({ playContent, watchContent }: FeedTabsProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") === "watch" ? "watch" : "play";

  const handleTabChange = (value: string) => {
    if (value === "watch") {
      setSearchParams({ tab: "watch" });
    } else {
      setSearchParams({});
    }
  };

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full h-full">
      {/* Mobile-only TikTok-style header tabs */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-lg border-b border-border/50">
        <TabsList className="w-full h-14 bg-transparent rounded-none border-0 p-0">
          <TabsTrigger 
            value="play" 
            className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary font-semibold text-base gap-2"
          >
            <Play className="h-5 w-5" />
            Game Feed
          </TabsTrigger>
          <TabsTrigger 
            value="watch" 
            className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary font-semibold text-base gap-2"
          >
            <Radio className="h-5 w-5" />
            Live Feed
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="play" className="mt-0 md:mt-0">
        <div className="pt-14 md:pt-0">
          {playContent}
        </div>
      </TabsContent>

      <TabsContent value="watch" className="mt-0 md:mt-0">
        <div className="pt-14 md:pt-0">
          {watchContent}
        </div>
      </TabsContent>
    </Tabs>
  );
};
