import { TikTokSidebar } from "./TikTokSidebar";
import { MobileSidebar } from "./MobileSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { useLocation } from "react-router-dom";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const isSearchPage = location.pathname === "/search";

  return (
    <div className="min-h-screen bg-white dark:bg-black flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <TikTokSidebar />
      </div>

      {/* Mobile Sidebar Drawer - hide hamburger on search/explore page */}
      <div className="md:hidden">
        <MobileSidebar hideButton={isSearchPage} />
      </div>
      
      <div className="flex-1 pb-16 md:pb-0 md:ml-[240px] lg:ml-[260px]">
        {children}
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

