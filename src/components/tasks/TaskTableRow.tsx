import { 
  Circle, 
  Clock, 
  CheckCircle2, 
  ChevronDown, 
  ChevronLeft, 
  ListTree, 
  Plus, 
  Copy, 
  Edit2, 
  Trash2, 
  RotateCcw,
  FolderKanban
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskAttachmentsBadge } from "./TaskAttachmentsBadge";
import { TaskSubtaskProgress } from "./TaskSubtaskProgress";
import { PriorityCategoryBadge } from "./PriorityCategoryBadge";
import { TaskQuickAssign } from "./TaskQuickAssign";
import { TaskQuickDate } from "./TaskQuickDate";

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
  projects?: { id: string; name: string; color: string | null } | null;
  clients?: { name: string; is_master_account?: boolean } | null;
}

interface TaskTableRowProps {
  task: Task;
  isSubtask?: boolean;
  isSelected: boolean;
  isExpanded: boolean;
  childTasks: Task[];
  showArchive: boolean;
  assigneeInfo: { name: string; color: string; initials: string } | null;
  onToggleSelect: (taskId: string) => void;
  onToggleExpand: (taskId: string) => void;
  onToggleStatus: (taskId: string, currentStatus: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onDuplicate: (task: Task) => void;
  onRestore: (taskId: string) => void;
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

export function TaskTableRow({
  task,
  isSubtask = false,
  isSelected,
  isExpanded,
  childTasks,
  showArchive,
  assigneeInfo,
  onToggleSelect,
  onToggleExpand,
  onToggleStatus,
  onEdit,
  onDelete,
  onDuplicate,
  onRestore,
  onNewTask,
}: TaskTableRowProps) {
  const status = statusConfig[task.status] || statusConfig.pending;
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const StatusIcon = status.icon;
  const hasChildren = childTasks.length > 0;

  return (
    <div key={task.id}>
      <div className={cn(
        "p-4 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors group",
        isSubtask && "bg-muted/20 pr-12",
        isSelected && "bg-primary/5"
      )}>
        <div className="flex items-start gap-3">
          {/* Checkbox for selection */}
          {!isSubtask && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect(task.id)}
              className="mt-2"
            />
          )}

          {/* Status toggle button - always shown */}
          <button
            onClick={() => onToggleStatus(task.id, task.status)}
            className={cn("p-2 rounded-lg transition-colors hover:opacity-80 flex-shrink-0", status.bg)}
            title={`לחץ לשינוי סטטוס (${status.label})`}
          >
            <StatusIcon className={cn("w-5 h-5", status.color)} />
          </button>
          
          {/* Expand button for tasks with children */}
          {!isSubtask && hasChildren && (
            <button
              onClick={() => onToggleExpand(task.id)}
              className="p-1 rounded-lg transition-colors hover:bg-muted flex-shrink-0"
              title="הרחב/כווץ תתי-משימות"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {isSubtask && <ListTree className="w-4 h-4 text-muted-foreground" />}
              <h3 className={cn("font-medium", task.status === "completed" && "line-through text-muted-foreground")}>
                {task.title}
              </h3>
              <span className={cn("w-2 h-2 rounded-full flex-shrink-0", priority.color)} title={priority.label} />
              {hasChildren && (
                <Badge variant="secondary" className="text-xs">
                  {childTasks.length} תתי-משימות
                </Badge>
              )}
              {task.projects && (
                <Badge 
                  variant="outline" 
                  className="text-xs flex items-center gap-1"
                  style={{ borderColor: task.projects.color || 'hsl(var(--primary))' }}
                >
                  <FolderKanban className="w-3 h-3" style={{ color: task.projects.color || 'hsl(var(--primary))' }} />
                  {task.projects.name}
                </Badge>
              )}
              {task.category && ['revenue', 'growth', 'innovation', 'maintenance'].includes(task.category) && (
                <PriorityCategoryBadge category={task.category as "revenue" | "growth" | "innovation" | "maintenance"} />
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              {task.clients && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  {task.clients.is_master_account ? (
                    <Badge variant="outline" className="text-xs bg-gradient-to-r from-warning/10 to-warning/20 border-warning/30">
                      JIY
                    </Badge>
                  ) : task.clients.name}
                </span>
              )}
              {task.department && <span>{task.department}</span>}
              <TaskSubtaskProgress taskId={task.id} />
              <TaskAttachmentsBadge taskId={task.id} />
            </div>
          </div>

          {/* Quick Date/Time Picker - separate from status */}
          <div className="flex-shrink-0">
            <TaskQuickDate
              taskId={task.id}
              currentDate={task.due_date}
              currentTime={task.scheduled_time}
              compact
            />
          </div>

          {/* Quick Assign - replaces static avatar */}
          <TaskQuickAssign
            taskId={task.id}
            currentAssignee={task.assignee}
            assigneeInfo={assigneeInfo}
            compact
          />

          <div className="flex items-center gap-1 flex-shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            {showArchive ? (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:text-success" onClick={() => onRestore(task.id)} title="שחזר">
                <RotateCcw className="w-4 h-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNewTask} title="משימה חדשה">
                  <Plus className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDuplicate(task)} title="שכפל עם בחירת תאריך">
                  <Copy className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(task)}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(task)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Render child tasks */}
      {hasChildren && isExpanded && (
        <div className="border-r-2 border-primary/20 mr-6">
          {childTasks.map(child => (
            <TaskTableRow
              key={child.id}
              task={child}
              isSubtask
              isSelected={false}
              isExpanded={false}
              childTasks={[]}
              showArchive={showArchive}
              assigneeInfo={null}
              onToggleSelect={onToggleSelect}
              onToggleExpand={onToggleExpand}
              onToggleStatus={onToggleStatus}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onRestore={onRestore}
              onNewTask={onNewTask}
            />
          ))}
        </div>
      )}
    </div>
  );
}
