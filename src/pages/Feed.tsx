import { GameFeed } from "@/components/GameFeed";
import { FeedTabs } from "@/components/FeedTabs";
import { WatchFeed } from "@/components/WatchFeed";
import { NotificationOnboarding } from "@/components/NotificationOnboarding";
import { ExistingUserNotificationPrompt } from "@/components/ExistingUserNotificationPrompt";
import { NotificationReminderSystem } from "@/components/NotificationReminderSystem";

export default function Feed() {
  return (
    <div className="no-scrollbar">
      <NotificationOnboarding trigger="early" />
      <ExistingUserNotificationPrompt />
      <NotificationReminderSystem strategy="gentle" />
      <FeedTabs 
        playContent={<GameFeed />}
        watchContent={<WatchFeed />}
      />
    </div>
  );
}