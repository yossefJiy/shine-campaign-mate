import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  CheckSquare, 
  FolderKanban,
  Building2,
  Users, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Bell,
  Palette,
  Trophy,
  Flame,
  UserPlus,
  CreditCard,
  Bot,
  Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/contexts/SidebarContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useGamification } from "@/hooks/useGamification";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "דשבורד", path: "/dashboard" },
  { icon: FolderKanban, label: "פרויקטים", path: "/projects" },
  { icon: CheckSquare, label: "משימות", path: "/tasks" },
  { icon: Building2, label: "לקוחות", path: "/clients" },
  { icon: CreditCard, label: "חיובים", path: "/billing" },
  { icon: Users, label: "צוות", path: "/team" },
];

// Legacy modules - preserved but inactive
const legacyModules: MenuItem[] = [
  { icon: UserPlus, label: "לידים", path: "/leads" },
  { icon: Bot, label: "סוכני AI", path: "/ai-agents" },
];

const settingsItems = [
  { icon: User, label: "פרופיל", path: "/settings" },
  { icon: Bell, label: "התראות", path: "/settings?tab=notifications" },
  { icon: Palette, label: "מראה", path: "/settings?tab=appearance" },
];

export function Sidebar() {
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, role } = useAuth();
  const { points, streak } = useGamification();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const userEmail = user?.email || "";
  const userInitials = userEmail ? userEmail.substring(0, 2).toUpperCase() : "U";

  const getRoleLabel = (role: string | null) => {
    const labels: Record<string, string> = {
      super_admin: "אדמין ראשי",
      admin: "אדמין",
      agency_manager: "מנהל",
      team_manager: "מנהל צוות",
      employee: "עובד",
      premium_client: "לקוח פרמיום",
      basic_client: "לקוח",
      demo: "משתמש דמו",
    };
    return role ? labels[role] || role : "משתמש";
  };

  return (
    <aside 
      className={cn(
        "fixed right-0 top-0 h-screen bg-background border-l border-border transition-all duration-300 z-50 flex flex-col",
        isCollapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo & Toggle */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border shrink-0">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <CheckSquare className="w-5 h-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-lg">Tasks</span>
          )}
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          {isCollapsed ? (
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Gamification Stats */}
      {!isCollapsed && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{points?.total_points || 0}</span>
            </div>
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full",
              streak?.current_streak && streak.current_streak > 0 
                ? "bg-orange-500/10" 
                : "bg-muted"
            )}>
              <Flame className={cn(
                "w-4 h-4",
                streak?.current_streak && streak.current_streak > 0 
                  ? "text-orange-500 animate-pulse" 
                  : "text-muted-foreground"
              )} />
              <span className="text-sm font-medium">{streak?.current_streak || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed Gamification */}
      {isCollapsed && (
        <div className="p-2 border-b border-border flex flex-col items-center gap-2">
          <div className="flex flex-col items-center gap-1 bg-primary/10 p-2 rounded-lg">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium">{points?.total_points || 0}</span>
          </div>
          <div className={cn(
            "flex flex-col items-center gap-1 p-2 rounded-lg",
            streak?.current_streak && streak.current_streak > 0 
              ? "bg-orange-500/10" 
              : "bg-muted"
          )}>
            <Flame className={cn(
              "w-4 h-4",
              streak?.current_streak && streak.current_streak > 0 
                ? "text-orange-500 animate-pulse" 
                : "text-muted-foreground"
            )} />
            <span className="text-xs font-medium">{streak?.current_streak || 0}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 shrink-0 transition-transform duration-200",
                isActive && "scale-110"
              )} />
              {!isCollapsed && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
            </Link>
          );
        })}

        {/* Legacy Modules - Preserved but inactive */}
        {legacyModules.length > 0 && (
          <>
            <div className="my-3 mx-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
                <div className="h-px flex-1 bg-border/50" />
                {!isCollapsed && <span className="flex items-center gap-1"><Archive className="w-3 h-3" /> ארכיון</span>}
                <div className="h-px flex-1 bg-border/50" />
              </div>
            </div>
            {legacyModules.map((item) => (
              <TooltipProvider key={item.path}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                        "text-muted-foreground/40 cursor-not-allowed opacity-60"
                      )}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!isCollapsed && (
                        <span className="font-medium text-xs">{item.label}</span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p className="text-xs">{item.label} - מודול לא פעיל</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-border shrink-0">
        {/* Settings Dropdown */}
        <div className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-10",
                  isCollapsed && "justify-center px-2",
                  location.pathname === "/settings"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Settings className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="font-medium text-sm">הגדרות</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-48">
              <DropdownMenuLabel>הגדרות</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {settingsItems.map((item) => (
                <DropdownMenuItem key={item.label} asChild>
                  <Link to={item.path} className="flex items-center gap-2 cursor-pointer">
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* User Menu */}
        <div className="p-3 pt-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-auto py-2",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex flex-col items-start text-right overflow-hidden">
                    <span className="text-sm font-medium truncate max-w-[140px]">
                      {userEmail}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {getRoleLabel(role)}
                    </span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-48">
              <DropdownMenuLabel>החשבון שלי</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                  <User className="w-4 h-4" />
                  <span>פרופיל</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                <LogOut className="w-4 h-4 ml-2" />
                <span>התנתקות</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
}
