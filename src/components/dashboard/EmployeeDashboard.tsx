import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle2, 
  Clock, 
  Play,
  CheckSquare,
  Loader2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { microcopy } from "@/lib/microcopy";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { he } from "date-fns/locale";
import { Link } from "react-router-dom";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  project_name?: string;
  client_name?: string;
}

export function EmployeeDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch current user's team member record
  const { data: teamMember } = useQuery({
    queryKey: ["current-team-member"],
    queryFn: async () => {
      if (!user?.email) return null;
      
      const { data } = await supabase
        .from("team")
        .select("id, name")
        .eq("email", user.email)
        .single();
      
      return data;
    },
    enabled: !!user?.email,
  });

  // Fetch assigned tasks
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["employee-tasks", teamMember?.id],
    queryFn: async () => {
      if (!teamMember?.id) return { today: [], upcoming: [], overdue: [] };
      
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          id, title, status, priority, due_date,
          projects:projects!tasks_project_id_fkey(name),
          clients:clients!tasks_client_id_fkey(name)
        `)
        .eq("assignee", teamMember.id)
        .neq("status", "completed")
        .order("due_date", { ascending: true, nullsFirst: false });
      
      if (error) throw error;

      const today: Task[] = [];
      const upcoming: Task[] = [];
      const overdue: Task[] = [];

      (data || []).forEach((task: any) => {
        const t: Task = {
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          due_date: task.due_date,
          project_name: task.projects?.name,
          client_name: task.clients?.name,
        };

        if (!task.due_date) {
          upcoming.push(t);
        } else {
          const dueDate = new Date(task.due_date);
          if (isToday(dueDate) || isTomorrow(dueDate)) {
            today.push(t);
          } else if (isPast(dueDate)) {
            overdue.push(t);
          } else {
            upcoming.push(t);
          }
        }
      });

      return { today, upcoming, overdue };
    },
    enabled: !!teamMember?.id,
  });

  // Update task status mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ status })
        .eq("id", taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-tasks"] });
      toast.success("המשימה עודכנה");
    },
    onError: () => {
      toast.error("שגיאה בעדכון המשימה");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const totalTasks = (tasks?.today?.length || 0) + (tasks?.upcoming?.length || 0) + (tasks?.overdue?.length || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold">
          שלום{teamMember?.name ? `, ${teamMember.name}` : ''} 👋
        </h2>
        <p className="text-muted-foreground">
          יש לך {totalTasks} משימות פתוחות
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-red-500">{tasks?.overdue?.length || 0}</p>
            <p className="text-xs text-muted-foreground">באיחור</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-amber-500">{tasks?.today?.length || 0}</p>
            <p className="text-xs text-muted-foreground">להיום</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-muted-foreground">{tasks?.upcoming?.length || 0}</p>
            <p className="text-xs text-muted-foreground">בהמתנה</p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Tasks */}
      {tasks?.overdue && tasks.overdue.length > 0 && (
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg text-red-600">
              <Clock className="h-5 w-5" />
              משימות באיחור
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TaskList 
              tasks={tasks.overdue} 
              onStart={(id) => updateTaskMutation.mutate({ taskId: id, status: "in_progress" })}
              onComplete={(id) => updateTaskMutation.mutate({ taskId: id, status: "completed" })}
              isPending={updateTaskMutation.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* Today's Tasks */}
      <Card className="border-amber-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckSquare className="h-5 w-5 text-amber-500" />
            המשימות שלי להיום
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasks?.today && tasks.today.length > 0 ? (
            <TaskList 
              tasks={tasks.today} 
              onStart={(id) => updateTaskMutation.mutate({ taskId: id, status: "in_progress" })}
              onComplete={(id) => updateTaskMutation.mutate({ taskId: id, status: "completed" })}
              isPending={updateTaskMutation.isPending}
            />
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p>אין לך משימות להיום - כל הכבוד!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Tasks */}
      {tasks?.upcoming && tasks.upcoming.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
              משימות קרובות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TaskList 
              tasks={tasks.upcoming.slice(0, 5)} 
              onStart={(id) => updateTaskMutation.mutate({ taskId: id, status: "in_progress" })}
              onComplete={(id) => updateTaskMutation.mutate({ taskId: id, status: "completed" })}
              isPending={updateTaskMutation.isPending}
            />
            {tasks.upcoming.length > 5 && (
              <Link to="/tasks" className="block text-center mt-4">
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                  הצג עוד {tasks.upcoming.length - 5} משימות
                </Badge>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mindset */}
      <p className="text-center text-sm text-muted-foreground italic">
        {microcopy.mindset.smallProgressMatters}
      </p>
    </div>
  );
}

interface TaskListProps {
  tasks: Task[];
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  isPending: boolean;
}

function TaskList({ tasks, onStart, onComplete, isPending }: TaskListProps) {
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center justify-between p-3 rounded-lg bg-background border"
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{task.title}</p>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              {task.project_name && <span>{task.project_name}</span>}
              {task.client_name && <span>• {task.client_name}</span>}
              {task.due_date && (
                <span className={cn(
                  isPast(new Date(task.due_date)) && "text-red-500"
                )}>
                  • {format(new Date(task.due_date), "dd/MM", { locale: he })}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {task.status === "pending" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStart(task.id)}
                disabled={isPending}
              >
                <Play className="h-3 w-3 ml-1" />
                התחל
              </Button>
            )}
            <Button
              size="sm"
              variant={task.status === "in_progress" ? "default" : "outline"}
              onClick={() => onComplete(task.id)}
              disabled={isPending}
            >
              <CheckCircle2 className="h-3 w-3 ml-1" />
              סיום
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
