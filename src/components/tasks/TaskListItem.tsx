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
  Calendar,
  Building2,
  Paperclip,
  FolderKanban,
  DollarSign,
  Wrench,
  UserCheck,
  Pause,
  ShieldCheck,
} from "lucide-react";
import { getTaskTypeConfig } from "./TaskTypeSelector";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { TaskQuickActions } from "./TaskQuickActions";
import { TaskAttachmentsBadge } from "./TaskAttachmentsBadge";
import { TaskSubtaskProgress } from "./TaskSubtaskProgress";
import { microcopy } from "@/lib/microcopy";

export interface Task {
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
  stage_id?: string | null;
  task_tag?: string | null;
  income_value?: number | null;
  task_type?: string | null;
  ready_for_qa?: boolean | null;
  clients?: { name: string; is_master_account?: boolean } | null;
  projects?: { id: string; name: string; color: string | null } | null;
}

const taskTagConfig: Record<string, { icon: typeof DollarSign; color: string; label: string }> = {
  income_generating: { icon: DollarSign, color: "bg-success/10 text-success border-success/30", label: microcopy.taskTags.income_generating },
  operational: { icon: Wrench, color: "bg-muted text-muted-foreground", label: microcopy.taskTags.operational },
  client_dependent: { icon: UserCheck, color: "bg-warning/10 text-warning border-warning/30", label: microcopy.taskTags.client_dependent },
};

interface TeamMember {
  id: string;
  name: string;
  avatar_color?: string | null;
}

const statusConfig: Record<string, { color: string; bg: string; label: string; icon: typeof Circle }> = {
  pending: { color: "text-muted-foreground", bg: "bg-muted", label: microcopy.tasks.statusNotStarted, icon: Circle },
  "in-progress": { color: "text-info", bg: "bg-info/10", label: microcopy.tasks.statusInProgress, icon: Clock },
  waiting: { color: "text-warning", bg: "bg-warning/10", label: microcopy.tasks.statusWaiting, icon: Pause },
  completed: { color: "text-success", bg: "bg-success/10", label: microcopy.tasks.statusDone, icon: CheckCircle2 },
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  low: { color: "bg-muted", label: "נמוכה" },
  medium: { color: "bg-warning", label: "בינונית" },
  high: { color: "bg-destructive", label: "גבוהה" },
};

interface TaskListItemProps {
  task: Task;
  isSubtask?: boolean;
  childTasks?: Task[];
  isExpanded?: boolean;
  isSelected?: boolean;
  showArchive?: boolean;
  teamMembers: TeamMember[];
  onToggleExpand?: () => void;
  onToggleSelect?: () => void;
  onStatusChange: (id: string, status: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onDuplicate: (task: Task) => void;
  onRestore: (id: string) => void;
  onNewTask: () => void;
  renderChild?: (child: Task) => React.ReactNode;
}

export function TaskListItem({
  task,
  isSubtask = false,
  childTasks = [],
  isExpanded = false,
  isSelected = false,
  showArchive = false,
  teamMembers,
  onToggleExpand,
  onToggleSelect,
  onStatusChange,
  onEdit,
  onDelete,
  onDuplicate,
  onRestore,
  onNewTask,
  renderChild,
}: TaskListItemProps) {
  const status = statusConfig[task.status] || statusConfig.pending;
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const StatusIcon = status.icon;
  const hasChildren = childTasks.length > 0;

  // Get assignee display info
  const getAssigneeInfo = (assigneeId: string | null) => {
    if (!assigneeId) return null;
    const member = teamMembers.find(m => m.id === assigneeId);
    if (!member) return { name: assigneeId, color: '#6366f1', initials: assigneeId.slice(0, 2) };
    const initials = member.name.split(' ').map(n => n[0]).join('').slice(0, 2);
    return { name: member.name, color: member.avatar_color || '#6366f1', initials };
  };

  const formatTime = (time: string | null) => {
    if (!time) return null;
    return time.slice(0, 5);
  };

  const assigneeInfo = getAssigneeInfo(task.assignee);

  return (
    <div>
      <div className={cn(
        "p-4 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors group",
        isSubtask && "bg-muted/20 pr-12",
        isSelected && "bg-primary/5"
      )}>
        <div className="flex items-start gap-3">
          {/* Checkbox for selection */}
          {!isSubtask && onToggleSelect && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggleSelect}
              className="mt-2"
            />
          )}
          
          {!isSubtask && hasChildren ? (
            <button
              onClick={onToggleExpand}
              className="p-2 rounded-lg transition-colors hover:bg-muted flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
          ) : (
            <button
              onClick={() => {
                const nextStatus = task.status === "pending" ? "in-progress" : task.status === "in-progress" ? "completed" : "pending";
                onStatusChange(task.id, nextStatus);
              }}
              className={cn("p-2 rounded-lg transition-colors hover:opacity-80 flex-shrink-0", status.bg)}
            >
              <StatusIcon className={cn("w-5 h-5", status.color)} />
            </button>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {isSubtask && <ListTree className="w-4 h-4 text-muted-foreground" />}
              <h3 className={cn("font-medium", task.status === "completed" && "line-through text-muted-foreground")}>
                {task.title}
              </h3>
              <span className={cn("w-2 h-2 rounded-full flex-shrink-0", priority.color)} title={priority.label} />
              {/* Task Tag Badge */}
              {task.task_tag && taskTagConfig[task.task_tag] && (
                <Badge 
                  variant="outline" 
                  className={cn("text-xs flex items-center gap-1", taskTagConfig[task.task_tag].color)}
                >
                  {(() => {
                    const TagIcon = taskTagConfig[task.task_tag!].icon;
                    return <TagIcon className="w-3 h-3" />;
                  })()}
                  {taskTagConfig[task.task_tag].label}
                </Badge>
              )}
              {hasChildren && (
                <Badge variant="secondary" className="text-xs">
                  {childTasks.length} תתי-משימות
                </Badge>
              )}
              {task.projects && (
                <Badge 
                  variant="outline" 
                  className="text-xs flex items-center gap-1"
                  style={{ borderColor: task.projects.color || '#3B82F6' }}
                >
                  <FolderKanban className="w-3 h-3" />
                  {task.projects.name}
                </Badge>
              )}
              <TaskAttachmentsBadge taskId={task.id} />
              <TaskSubtaskProgress taskId={task.id} />
            </div>
            
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
            )}
            
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
              {task.clients && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {task.clients.name}
                </span>
              )}
              {task.due_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(task.due_date).toLocaleDateString("he-IL")}
                </span>
              )}
              {task.scheduled_time && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(task.scheduled_time)}
                </span>
              )}
              {task.category && (
                <Badge variant="outline" className="text-xs">
                  {task.category}
                </Badge>
              )}
            </div>
          </div>

          {/* Assignee Avatar */}
          {assigneeInfo && (
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0"
              style={{ backgroundColor: assigneeInfo.color }}
              title={assigneeInfo.name}
            >
              {assigneeInfo.initials}
            </div>
          )}

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
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDuplicate(task)} title="שכפל">
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

          <div className="flex items-center gap-2 flex-shrink-0">
            <TaskQuickActions
              taskId={task.id}
              currentStatus={task.status}
              currentTime={task.scheduled_time}
              compact
            />
          </div>
        </div>
      </div>
      
      {/* Render child tasks */}
      {hasChildren && isExpanded && renderChild && (
        <div className="border-r-2 border-primary/20 mr-6">
          {childTasks.map(child => renderChild(child))}
        </div>
      )}
    </div>
  );
}
