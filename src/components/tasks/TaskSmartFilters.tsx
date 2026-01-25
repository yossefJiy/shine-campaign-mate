import { 
  User, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  Filter,
  Building2,
  Calendar,
  FolderKanban
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { microcopy } from "@/lib/microcopy";

export type SmartFilter = 
  | "all" 
  | "mine" 
  | "income" 
  | "waiting" 
  | "overdue" 
  | "assignee" 
  | "department" 
  | "date" 
  | "client" 
  | "project";

interface FilterOption {
  id: SmartFilter;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  badgeColor?: string;
}

const smartFilters: FilterOption[] = [
  { id: "all", label: "הכל" },
  { id: "mine", label: microcopy.tasks.filterMine, icon: User },
  { id: "income", label: microcopy.tasks.filterIncome, icon: DollarSign, color: "text-success", badgeColor: "bg-success/20 text-success" },
  { id: "waiting", label: microcopy.tasks.filterWaiting, icon: Clock, color: "text-warning", badgeColor: "bg-warning/20 text-warning" },
  { id: "overdue", label: microcopy.tasks.filterOverdue, icon: AlertTriangle, color: "text-destructive", badgeColor: "bg-destructive/20 text-destructive" },
];

const secondaryFilters: FilterOption[] = [
  { id: "assignee", label: "עובד", icon: User },
  { id: "department", label: "מחלקה", icon: Building2 },
  { id: "date", label: "תאריך", icon: Calendar },
  { id: "client", label: "לקוח", icon: Building2 },
  { id: "project", label: "פרויקט", icon: FolderKanban },
];

interface TaskSmartFiltersProps {
  currentFilter: SmartFilter;
  onFilterChange: (filter: SmartFilter) => void;
  counts: {
    mine: number;
    income: number;
    waiting: number;
    overdue: number;
  };
}

export function TaskSmartFilters({ currentFilter, onFilterChange, counts }: TaskSmartFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Smart Filters - Primary */}
      <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
        {smartFilters.map(({ id, label, icon: Icon, color, badgeColor }) => {
          const count = id === "mine" ? counts.mine :
                       id === "income" ? counts.income :
                       id === "waiting" ? counts.waiting :
                       id === "overdue" ? counts.overdue : null;
          
          return (
            <button
              key={id}
              onClick={() => onFilterChange(id)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5",
                currentFilter === id 
                  ? "bg-primary text-primary-foreground" 
                  : cn("hover:bg-muted", color)
              )}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {label}
              {count !== null && count > 0 && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "h-5 px-1.5 text-xs",
                    currentFilter === id ? "bg-primary-foreground/20 text-primary-foreground" : badgeColor
                  )}
                >
                  {count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-border mx-1" />

      {/* Secondary Filters */}
      <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
        {secondaryFilters.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onFilterChange(id)}
            className={cn(
              "px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1",
              currentFilter === id 
                ? "bg-muted text-foreground" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {Icon && <Icon className="w-3 h-3" />}
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
