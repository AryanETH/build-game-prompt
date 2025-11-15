import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";

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
      {/* Removed top navigation - tabs are now in sidebar */}

      <TabsContent value="play" className="mt-0">
        {playContent}
      </TabsContent>

      <TabsContent value="watch" className="mt-0">
        {watchContent}
      </TabsContent>
    </Tabs>
  );
};
