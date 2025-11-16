import { TikTokSidebar } from "./TikTokSidebar";
import { MobileSidebar } from "./MobileSidebar";
import { MobileBottomNav } from "./MobileBottomNav";

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
      
      <div className="flex-1 pb-16 md:pb-0 md:ml-[240px] lg:ml-[260px]">
        {children}
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

