import { useState } from "react";
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Clock, 
  DollarSign, 
  AlertTriangle,
  Flame,
  FileText,
  UserCheck,
  Send,
  Ban,
  Hourglass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSmartAlerts, AlertType, AlertPriority, SmartAlert } from "@/hooks/useSmartAlerts";
import { microcopy } from "@/lib/microcopy";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";

const alertIcons: Record<AlertType, React.ReactNode> = {
  task_overdue: <Clock className="h-4 w-4 text-red-500" />,
  client_delay: <Clock className="h-4 w-4 text-orange-500" />,
  payment_overdue: <DollarSign className="h-4 w-4 text-red-500" />,
  stage_approved: <CheckCheck className="h-4 w-4 text-green-500" />,
  project_stalled: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  no_income_tasks: <Flame className="h-4 w-4 text-amber-500" />,
  proposal_approved: <FileText className="h-4 w-4 text-green-500" />,
  proposal_expired: <FileText className="h-4 w-4 text-red-500" />,
  task_assigned: <UserCheck className="h-4 w-4 text-blue-500" />,
  proposal_sent: <Send className="h-4 w-4 text-blue-500" />,
  retainer_paid: <DollarSign className="h-4 w-4 text-green-500" />,
  stage_approval_request: <Hourglass className="h-4 w-4 text-orange-500" />,
  task_waiting: <Clock className="h-4 w-4 text-yellow-500" />,
  work_blocked: <Ban className="h-4 w-4 text-red-500" />,
};

const priorityColors: Record<AlertPriority, string> = {
  low: "bg-muted",
  normal: "bg-background",
  high: "bg-amber-50 dark:bg-amber-950/30",
  urgent: "bg-red-50 dark:bg-red-950/30",
};

export function SmartAlertsPanel() {
  const { alerts, unreadCount, isLoading, markAsRead, markAllAsRead } = useSmartAlerts();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold">{microcopy.sections.alerts}</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => markAllAsRead()}
            >
              <CheckCheck className="h-3 w-3 ml-1" />
              סמן הכל כנקרא
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              טוען...
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>אין התראות חדשות</p>
            </div>
          ) : (
            <div className="divide-y">
              {alerts.map((alert) => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  onMarkAsRead={() => markAsRead(alert.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

interface AlertItemProps {
  alert: SmartAlert;
  onMarkAsRead: () => void;
}

function AlertItem({ alert, onMarkAsRead }: AlertItemProps) {
  return (
    <div
      className={cn(
        "p-3 hover:bg-muted/50 transition-colors cursor-pointer",
        priorityColors[alert.priority],
        !alert.is_read && "border-r-2 border-primary"
      )}
      onClick={onMarkAsRead}
    >
      <div className="flex gap-3">
        <div className="shrink-0 mt-0.5">
          {alertIcons[alert.alert_type] || <Bell className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm", !alert.is_read && "font-medium")}>
            {alert.title}
          </p>
          {alert.message && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {alert.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(alert.created_at), { 
              addSuffix: true, 
              locale: he 
            })}
          </p>
        </div>
        {!alert.is_read && (
          <div className="shrink-0">
            <div className="h-2 w-2 rounded-full bg-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
