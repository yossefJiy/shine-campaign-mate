import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { SessionTimeoutDialog } from "@/components/SessionTimeoutDialog";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
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
      
      <main className={cn(
        "min-h-screen transition-all duration-300 pt-4",
        isCollapsed ? "mr-20" : "mr-64"
      )}>
        {children}
      </main>
      
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
