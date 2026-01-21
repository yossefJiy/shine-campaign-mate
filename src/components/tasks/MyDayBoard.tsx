import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/hooks/useClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  Clock, 
  CheckSquare, 
  Circle,
  Play,
  Target,
  Coffee
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { PriorityCategoryBadge } from "./PriorityCategoryBadge";

interface MyDayBoardProps {
  className?: string;
}

export function MyDayBoard({ className }: MyDayBoardProps) {
  const { selectedClient } = useClient();
  const { user } = useAuth();
  const todayStr = new Date().toISOString().split("T")[0];

  // Fetch today's tasks for current user
  const { data: myTasks = [], isLoading } = useQuery({
    queryKey: ["my-day-tasks", user?.email, selectedClient?.id, todayStr],
    queryFn: async () => {
      if (!user?.email) return [];
      
      let query = supabase
        .from("tasks")
        .select("*, clients:clients!tasks_client_id_fkey(name)")
        .eq("due_date", todayStr)
        .eq("assignee", user.email)
        .order("scheduled_time", { ascending: true, nullsFirst: false })
        .order("priority", { ascending: true });
      
      if (selectedClient) {
        query = query.eq("client_id", selectedClient.id);
      }
      
      const { data } = await query;
      return data || [];
    },
    enabled: !!user?.email,
  });

  // Fetch completed today
  const { data: completedToday = [] } = useQuery({
    queryKey: ["my-completed-today", user?.email, todayStr],
    queryFn: async () => {
      if (!user?.email) return [];
      
      const { data } = await supabase
        .from("tasks")
        .select("id, duration_minutes, priority_category")
        .eq("status", "completed")
        .eq("assignee", user.email)
        .gte("updated_at", `${todayStr}T00:00:00`);
      
      return data || [];
    },
    enabled: !!user?.email,
  });

  // Calculate stats
  const pendingTasks = myTasks.filter((t: any) => t.status !== "completed");
  const inProgressTasks = myTasks.filter((t: any) => t.status === "in-progress");
  const totalMinutesPlanned = pendingTasks.reduce((sum: number, t: any) => sum + (t.duration_minutes || 60), 0);
  const totalMinutesCompleted = completedToday.reduce((sum: number, t: any) => sum + (t.duration_minutes || 60), 0);
  const hoursPlanned = (totalMinutesPlanned / 60).toFixed(1);
  const hoursCompleted = (totalMinutesCompleted / 60).toFixed(1);
  const progressPercent = totalMinutesPlanned > 0 
    ? Math.min(100, Math.round((totalMinutesCompleted / (totalMinutesPlanned + totalMinutesCompleted)) * 100))
    : 0;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "border-r-destructive bg-destructive/5";
      case "high": return "border-r-warning bg-warning/5";
      case "medium": return "border-r-info";
      default: return "border-r-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "in-progress": return <Play className="w-4 h-4 text-info" />;
      case "completed": return <CheckSquare className="w-4 h-4 text-success" />;
      default: return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="card-clean">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingTasks.length}</p>
                <p className="text-xs text-muted-foreground">לביצוע</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-clean">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                <Play className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressTasks.length}</p>
                <p className="text-xs text-muted-foreground">בתהליך</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-clean">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedToday.length}</p>
                <p className="text-xs text-muted-foreground">הושלמו</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-clean">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{hoursPlanned}</p>
                <p className="text-xs text-muted-foreground">שעות נותרו</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="card-clean">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">התקדמות היום</span>
            <span className="text-sm text-muted-foreground">
              {hoursCompleted} מתוך {parseFloat(hoursCompleted) + parseFloat(hoursPlanned)} שעות
            </span>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{completedToday.length} הושלמו</span>
            <span>{pendingTasks.length} נותרו</span>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <Card className="card-clean">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            המשימות שלי להיום
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Coffee className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">אין משימות להיום!</p>
              <p className="text-sm">זמן להפסקה או לקחת משימות חדשות</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingTasks.map((task: any) => (
                <div 
                  key={task.id}
                  className={cn(
                    "p-3 rounded-lg border-r-3 bg-card hover:bg-accent transition-colors cursor-pointer",
                    getPriorityColor(task.priority)
                  )}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(task.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium truncate">{task.title}</h4>
                        <div className="flex items-center gap-2 shrink-0">
                          <PriorityCategoryBadge 
                            category={task.priority_category} 
                            size="sm" 
                            showLabel={false}
                          />
                          {task.scheduled_time && (
                            <Badge variant="outline" className="font-mono text-xs">
                              {task.scheduled_time.slice(0, 5)}
                            </Badge>
                          )}
                          {task.duration_minutes && (
                            <Badge variant="secondary" className="text-xs">
                              {task.duration_minutes}ד'
                            </Badge>
                          )}
                        </div>
                      </div>
                      {task.clients?.name && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {task.clients.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
