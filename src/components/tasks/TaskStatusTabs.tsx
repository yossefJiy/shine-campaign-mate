import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Inbox, PlayCircle, Clock, CheckCircle2 } from "lucide-react";
import { microcopy } from "@/lib/microcopy";

export type TaskStatusTab = "inbox" | "active" | "waiting" | "done";

interface TabOption {
  id: TaskStatusTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  badgeColor?: string;
}

const tabs: TabOption[] = [
  { 
    id: "inbox", 
    label: microcopy.tasks.tabInbox || "Inbox", 
    icon: Inbox,
    color: "text-warning",
    badgeColor: "bg-warning/20 text-warning"
  },
  { 
    id: "active", 
    label: microcopy.tasks.tabActive || "פעילות", 
    icon: PlayCircle,
    color: "text-primary",
    badgeColor: "bg-primary/20 text-primary"
  },
  { 
    id: "waiting", 
    label: microcopy.tasks.tabWaiting || "ממתינות", 
    icon: Clock,
    color: "text-orange-500",
    badgeColor: "bg-orange-500/20 text-orange-500"
  },
  { 
    id: "done", 
    label: microcopy.tasks.tabDone || "הושלמו", 
    icon: CheckCircle2,
    color: "text-success",
    badgeColor: "bg-success/20 text-success"
  },
];

interface TaskStatusTabsProps {
  currentTab: TaskStatusTab;
  onTabChange: (tab: TaskStatusTab) => void;
  counts: {
    inbox: number;
    active: number;
    waiting: number;
    done: number;
  };
}

export function TaskStatusTabs({ currentTab, onTabChange, counts }: TaskStatusTabsProps) {
  return (
    <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
      {tabs.map(({ id, label, icon: Icon, color, badgeColor }) => {
        const count = counts[id];
        const isSelected = currentTab === id;
        
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
              isSelected 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : cn("hover:bg-muted", color)
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
            {count > 0 && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "h-5 px-1.5 text-xs font-semibold",
                  isSelected ? "bg-primary-foreground/20 text-primary-foreground" : badgeColor
                )}
              >
                {count}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}
