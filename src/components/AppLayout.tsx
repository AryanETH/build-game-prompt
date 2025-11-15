import { TikTokSidebar } from "./TikTokSidebar";
import { Navigation } from "./Navigation";
import { MobileSidebar } from "./MobileSidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-white dark:bg-black flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <TikTokSidebar />
      </div>
      
      {/* Mobile Sidebar Drawer */}
      <div className="md:hidden">
        <MobileSidebar />
      </div>
      
      <div className="flex-1 md:ml-[240px] lg:ml-[260px]">
        {children}
      </div>
      
      {/* Mobile bottom navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
        <Navigation hideBrand />
      </div>
    </div>
  );
};

