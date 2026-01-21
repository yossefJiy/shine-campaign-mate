import { useState, useMemo } from "react";
import { format, parseISO, isToday, isBefore, startOfDay } from "date-fns";
import { he } from "date-fns/locale";
import { Clock, AlertCircle, CheckCircle2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TaskQuickActions } from "@/components/tasks/TaskQuickActions";
import logoIcon from "@/assets/logo-icon.svg";

interface TeamMember {
  name: string;
  avatar_color: string | null;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  scheduled_time?: string | null;
  duration_minutes?: number;
  due_date?: string | null;
  client_id?: string | null;
  assignee?: string | null;
  clients?: { name: string; is_master_account?: boolean } | null;
}

interface DraggableTimelineWidgetProps {
  tasks: Task[];
  masterClientId?: string;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 to 20:00

const priorityConfig: Record<string, { color: string; label: string }> = {
  high: { color: "bg-destructive/20 text-destructive border-destructive/50", label: "גבוהה" },
  medium: { color: "bg-warning/20 text-warning border-warning/50", label: "בינונית" },
  low: { color: "bg-muted text-muted-foreground border-border", label: "נמוכה" },
};

const statusConfig: Record<string, { icon: typeof Clock; color: string }> = {
  pending: { icon: Clock, color: "text-warning" },
  "in-progress": { icon: Clock, color: "text-info" },
  completed: { icon: CheckCircle2, color: "text-success" },
};

export function DraggableTimelineWidget({ tasks, masterClientId }: DraggableTimelineWidgetProps) {
  const queryClient = useQueryClient();
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOverHour, setDragOverHour] = useState<number | null>(null);

  // Fetch team members with their avatar colors
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-colors"],
    queryFn: async () => {
      const { data } = await supabase.from("team").select("id, name, avatar_color").eq("is_active", true);
      return (data || []) as (TeamMember & { id: string })[];
    },
  });

  // Map assignee ID to name and color
  const { assigneeIdToName, assigneeIdToColor } = useMemo(() => {
    const idToName: Record<string, string> = {};
    const idToColor: Record<string, string> = {};
    teamMembers.forEach(m => {
      if (m.id) {
        idToName[m.id] = m.name;
        if (m.avatar_color) {
          idToColor[m.id] = m.avatar_color;
        }
      }
    });
    return { assigneeIdToName: idToName, assigneeIdToColor: idToColor };
  }, [teamMembers]);

  // Helper function to get assignee display info
  const getAssigneeInfo = (assigneeId: string | null) => {
    if (!assigneeId) return null;
    const name = assigneeIdToName[assigneeId] || assigneeId;
    const color = assigneeIdToColor[assigneeId] || '#6366f1';
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);
    return { name, color, initials };
  };

  const { scheduledTasks, unscheduledTasks } = useMemo(() => {
    const today = startOfDay(new Date());
    
    const todayTasks = tasks.filter(task => {
      if (!task.due_date) return false;
      const dueDate = parseISO(task.due_date);
      return isToday(dueDate) || isBefore(dueDate, today);
    });

    const scheduled: (Task & { hour: number })[] = [];
    const unscheduled: Task[] = [];

    todayTasks.forEach(task => {
      if (task.scheduled_time) {
        const [hours] = task.scheduled_time.split(':').map(Number);
        if (hours >= 8 && hours <= 20) {
          scheduled.push({ ...task, hour: hours });
        } else {
          unscheduled.push(task);
        }
      } else {
        unscheduled.push(task);
      }
    });

    scheduled.sort((a, b) => a.hour - b.hour);

    return { scheduledTasks: scheduled, unscheduledTasks: unscheduled };
  }, [tasks]);

  const updateTimeMutation = useMutation({
    mutationFn: async ({ taskId, hour }: { taskId: string; hour: number }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ scheduled_time: `${hour.toString().padStart(2, '0')}:00:00` })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("שעה עודכנה");
    },
    onError: () => toast.error("שגיאה בעדכון"),
  });

  const isJiyTask = (task: Task) => {
    return task.clients?.is_master_account || 
           task.client_id === masterClientId ||
           task.clients?.name?.toLowerCase().includes("jiy") ||
           task.clients?.name?.includes("סוכנות");
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, hour: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverHour(hour);
  };

  const handleDragLeave = () => {
    setDragOverHour(null);
  };

  const handleDrop = (e: React.DragEvent, hour: number) => {
    e.preventDefault();
    if (draggedTask) {
      updateTimeMutation.mutate({ taskId: draggedTask, hour });
    }
    setDraggedTask(null);
    setDragOverHour(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverHour(null);
  };

  const renderTask = (task: Task, showTime?: boolean, draggable: boolean = false) => {
    const isJiy = isJiyTask(task);
    const StatusIcon = statusConfig[task.status]?.icon || Clock;
    const duration = task.duration_minutes || 60;
    const isDragging = draggedTask === task.id;

    return (
      <div
        key={task.id}
        draggable={draggable}
        onDragStart={(e) => draggable && handleDragStart(e, task.id)}
        onDragEnd={handleDragEnd}
        className={cn(
          "p-3 rounded-lg transition-all group",
          isJiy 
            ? "jiy-gold-border bg-card/90" 
            : "bg-muted/50 border border-border/50",
          task.status === "completed" && "opacity-60",
          draggable && "cursor-grab active:cursor-grabbing",
          isDragging && "opacity-50 scale-95"
        )}
      >
        <div className="flex items-start gap-3">
          {draggable && (
            <GripVertical className="w-4 h-4 text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
          {isJiy && (
            <img src={logoIcon} alt="JIY" className="w-5 h-5 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {showTime && task.scheduled_time && (
                <span className="text-xs font-mono text-muted-foreground">
                  {task.scheduled_time.slice(0, 5)}
                </span>
              )}
              <StatusIcon className={cn("w-4 h-4", statusConfig[task.status]?.color)} />
              <span className="font-medium truncate">{task.title}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={cn("text-xs", priorityConfig[task.priority]?.color)}>
                {priorityConfig[task.priority]?.label}
              </Badge>
              <span className="text-xs text-muted-foreground">{duration} דק׳</span>
              {task.clients?.name && (
                <span className="text-xs text-muted-foreground truncate">
                  • {task.clients.name}
                </span>
              )}
            </div>
          </div>
          {/* Assignee Avatar */}
          {task.assignee && (() => {
            const info = getAssigneeInfo(task.assignee);
            return info ? (
              <div 
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0"
                style={{ backgroundColor: info.color }}
                title={info.name}
              >
                {info.initials}
              </div>
            ) : null;
          })()}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <TaskQuickActions
              taskId={task.id}
              currentStatus={task.status}
              currentTime={task.scheduled_time}
              compact
            />
          </div>
        </div>
      </div>
    );
  };

  const currentHour = new Date().getHours();

  return (
    <div className="glass rounded-xl card-shadow overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-bold">לוח זמנים יומי</h3>
        </div>
        <span className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE, d בMMMM", { locale: he })}
        </span>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="p-4 space-y-1">
          {HOURS.map((hour) => {
            const hourTasks = scheduledTasks.filter(t => t.hour === hour);
            const isCurrentHour = hour === currentHour;
            const isDragOver = dragOverHour === hour;

            return (
              <div 
                key={hour} 
                className="flex gap-3"
                onDragOver={(e) => handleDragOver(e, hour)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, hour)}
              >
                {/* Time column */}
                <div className={cn(
                  "w-14 text-left text-sm font-mono py-2 flex-shrink-0",
                  isCurrentHour ? "text-primary font-bold" : "text-muted-foreground"
                )}>
                  {String(hour).padStart(2, '0')}:00
                </div>

                {/* Tasks column */}
                <div className={cn(
                  "flex-1 min-h-[48px] border-r-2 pr-3 py-1 transition-colors rounded-lg",
                  isCurrentHour ? "border-primary" : "border-border/50",
                  isDragOver && "bg-primary/10 border-primary"
                )}>
                  {isCurrentHour && (
                    <div className="flex items-center gap-1 mb-2">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-xs text-primary font-medium">עכשיו</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    {hourTasks.map(task => renderTask(task, true, false))}
                  </div>
                  {isDragOver && hourTasks.length === 0 && (
                    <div className="h-12 border-2 border-dashed border-primary/50 rounded-lg flex items-center justify-center">
                      <span className="text-xs text-primary">שחרר כאן</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Unscheduled tasks section - draggable */}
      {unscheduledTasks.length > 0 && (
        <div className="border-t border-border">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-warning" />
              <span className="text-sm font-medium">משימות ללא שעה - גרור לתזמון</span>
              <Badge variant="secondary" className="text-xs">{unscheduledTasks.length}</Badge>
            </div>
            <div className="space-y-2">
              {unscheduledTasks.map(task => renderTask(task, false, true))}
            </div>
          </div>
        </div>
      )}

      {scheduledTasks.length === 0 && unscheduledTasks.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>אין משימות להיום</p>
        </div>
      )}
    </div>
  );
}
