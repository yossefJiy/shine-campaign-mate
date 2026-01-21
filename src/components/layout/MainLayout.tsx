import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { SessionTimeoutDialog } from "@/components/SessionTimeoutDialog";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { GlobalSearch } from "@/components/ai/GlobalSearch";
import { AIChatAssistant } from "@/components/ai/AIChatAssistant";
import { ClientSwitcher } from "./ClientSwitcher";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

function MainLayoutContent({ children }: MainLayoutProps) {
  const { showWarning, remainingTime, extendSession } = useSessionTimeout();
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      
      {/* Top Bar with Client Switcher and Global Search */}
      <header className={cn(
        "fixed top-0 left-0 h-16 bg-background/80 backdrop-blur-sm border-b border-border z-40 flex items-center justify-between px-6 transition-all duration-300",
        isCollapsed ? "right-[72px]" : "right-64"
      )}>
        <div className="flex items-center gap-4">
          <GlobalSearch />
        </div>
        <div className="w-64">
          <ClientSwitcher />
        </div>
      </header>
      
      <main className={cn(
        "min-h-screen transition-all duration-300 pt-20 pb-6",
        isCollapsed ? "mr-20" : "mr-64"
      )}>
        {children}
      </main>
      
      {/* AI Chat Assistant FAB */}
      <AIChatAssistant />
      
      <SessionTimeoutDialog 
        open={showWarning} 
        remainingTime={remainingTime} 
        onExtendSession={extendSession} 
      />
    </div>
  );
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </SidebarProvider>
  );
}
