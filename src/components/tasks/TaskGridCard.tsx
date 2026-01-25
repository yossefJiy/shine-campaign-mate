import { 
  Circle, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar 
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskQuickActions } from "./TaskQuickActions";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  scheduled_time: string | null;
  assignee: string | null;
  department: string | null;
  client_id: string | null;
  project_id: string | null;
  category: string | null;
  reminder_at: string | null;
  notification_email: boolean;
  notification_sms: boolean;
  notification_phone: string | null;
  notification_email_address: string | null;
  reminder_sent: boolean;
  duration_minutes: number;
  credits_cost: number | null;
  recurrence_type: string | null;
  recurrence_end_date: string | null;
  stage_id: string | null;
  task_tag: string | null;
  income_value: number | null;
}

interface TaskGridCardProps {
  task: Task;
  index: number;
  isSelected: boolean;
  childCount: number;
  assigneeInfo: { name: string; color: string; initials: string } | null;
  onToggleSelect: (taskId: string) => void;
  onToggleStatus: (taskId: string, currentStatus: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onNewTask: () => void;
}

const statusConfig: Record<string, { color: string; bg: string; label: string; icon: typeof Circle }> = {
  pending: { color: "text-warning", bg: "bg-warning/10", label: "ממתין", icon: Circle },
  "in-progress": { color: "text-info", bg: "bg-info/10", label: "בתהליך", icon: Clock },
  completed: { color: "text-success", bg: "bg-success/10", label: "הושלם", icon: CheckCircle2 },
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  low: { color: "bg-muted", label: "נמוכה" },
  medium: { color: "bg-warning", label: "בינונית" },
  high: { color: "bg-destructive", label: "גבוהה" },
};

export function TaskGridCard({
  task,
  index,
  isSelected,
  childCount,
  assigneeInfo,
  onToggleSelect,
  onToggleStatus,
  onEdit,
  onDelete,
  onNewTask,
}: TaskGridCardProps) {
  const status = statusConfig[task.status] || statusConfig.pending;
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const StatusIcon = status.icon;

  const formatTime = (time: string | null) => {
    if (!time) return null;
    return time.slice(0, 5);
  };

  return (
    <div 
      className={cn(
        "glass rounded-xl card-shadow opacity-0 animate-slide-up group",
        isSelected && "ring-2 ring-primary"
      )}
      style={{ animationDelay: `${0.1 + index * 0.05}s`, animationFillMode: "forwards" }}
    >
      <div className="p-4 md:p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect(task.id)}
            />
            <span className={cn("w-2 h-2 rounded-full", priority.color)} />
            <span className="text-xs text-muted-foreground">{priority.label}</span>
          </div>
          <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onNewTask}>
              <Plus className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(task)}>
              <Edit2 className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(task)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <h3 className={cn("font-medium mb-2", task.status === "completed" && "line-through text-muted-foreground")}>
          {task.title}
        </h3>

        {task.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
        )}

        {childCount > 0 && (
          <Badge variant="secondary" className="text-xs mb-3">
            {childCount} תתי-משימות
          </Badge>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onToggleStatus(task.id, task.status)}
              className={cn("p-1.5 rounded-lg transition-colors", status.bg)}
            >
              <StatusIcon className={cn("w-4 h-4", status.color)} />
            </button>
            {task.due_date && (
              <Badge variant="outline" className="text-xs flex gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(task.due_date), "dd/MM")}
                {task.scheduled_time && ` ${formatTime(task.scheduled_time)}`}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {assigneeInfo && (
              <div 
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white"
                style={{ backgroundColor: assigneeInfo.color }}
                title={assigneeInfo.name}
              >
                {assigneeInfo.initials}
              </div>
            )}
            <TaskQuickActions
              taskId={task.id}
              currentStatus={task.status}
              currentTime={task.scheduled_time}
              compact
            />
          </div>
        </div>
      </div>
    </div>
  );
}
