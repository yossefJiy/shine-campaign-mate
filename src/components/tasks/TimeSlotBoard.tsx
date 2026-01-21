import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/hooks/useClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  Clock, 
  CheckSquare, 
  AlertTriangle,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PriorityCategoryBadge } from "./PriorityCategoryBadge";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { he } from "date-fns/locale";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  priority_category: string | null;
  due_date: string | null;
  scheduled_time: string | null;
  duration_minutes: number | null;
  client_id: string | null;
  assignee: string | null;
  clients?: { name: string } | null;
}

interface TimeSlotBoardProps {
  showAllTeam?: boolean;
  className?: string;
}

// Time slots from 8:00 to 20:00
const timeSlots = Array.from({ length: 13 }, (_, i) => {
  const hour = i + 8;
  return {
    hour,
    label: `${hour.toString().padStart(2, "0")}:00`,
  };
});

export function TimeSlotBoard({ showAllTeam = false, className }: TimeSlotBoardProps) {
  const { selectedClient } = useClient();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week">("day");

  // Get current user's team member ID
  const { data: currentTeamMember } = useQuery({
    queryKey: ["my-team-member-timeslot", user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const { data } = await supabase
        .from("team")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.email && !showAllTeam,
  });

  // Fetch tasks for the selected date range
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["timeslot-tasks", selectedClient?.id, selectedDate.toISOString().split("T")[0], showAllTeam, currentTeamMember?.id],
    queryFn: async () => {
      const dateStr = selectedDate.toISOString().split("T")[0];
      
      let query = supabase
        .from("tasks")
        .select("*, clients:clients!tasks_client_id_fkey(name)")
        .eq("due_date", dateStr)
        .neq("status", "completed")
        .order("scheduled_time", { ascending: true, nullsFirst: false });
      
      if (selectedClient) {
        query = query.eq("client_id", selectedClient.id);
      }
      
      if (!showAllTeam && currentTeamMember?.id) {
        query = query.eq("assignee", currentTeamMember.id);
      }
      
      const { data } = await query;
      return (data || []) as Task[];
    },
  });

  // Group tasks by hour
  const tasksByHour = useMemo(() => {
    const grouped: Record<number, Task[]> = {};
    
    tasks.forEach((task) => {
      if (task.scheduled_time) {
        const hour = parseInt(task.scheduled_time.split(":")[0]);
        if (!grouped[hour]) grouped[hour] = [];
        grouped[hour].push(task);
      }
    });
    
    return grouped;
  }, [tasks]);

  // Unscheduled tasks
  const unscheduledTasks = tasks.filter((t) => !t.scheduled_time);

  // Calculate total hours
  const totalMinutes = tasks.reduce((sum, t) => sum + (t.duration_minutes || 60), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  const goToDate = (direction: "prev" | "next") => {
    setSelectedDate((current) => 
      direction === "prev" ? addDays(current, -1) : addDays(current, 1)
    );
  };

  const isToday = isSameDay(selectedDate, new Date());

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "border-r-destructive";
      case "high": return "border-r-warning";
      case "medium": return "border-r-info";
      default: return "border-r-muted";
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            לוח זמנים
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {totalHours} שעות
            </Badge>
            <Badge variant="outline">
              {tasks.length} משימות
            </Badge>
          </div>
        </div>
        
        {/* Date Navigation */}
        <div className="flex items-center justify-between mt-2">
          <Button variant="ghost" size="icon" onClick={() => goToDate("prev")}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className={cn(
              "font-medium",
              isToday && "text-primary"
            )}>
              {format(selectedDate, "EEEE, d בMMMM", { locale: he })}
            </span>
            {isToday && (
              <Badge variant="default" className="text-xs">היום</Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => goToDate("next")}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-1 max-h-[600px] overflow-y-auto">
        {/* Unscheduled Tasks */}
        {unscheduledTasks.length > 0 && (
          <div className="mb-4 p-3 bg-warning/10 rounded-lg border border-warning/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="text-sm font-medium">ללא שעה מתוזמנת ({unscheduledTasks.length})</span>
            </div>
            <div className="space-y-1">
              {unscheduledTasks.slice(0, 5).map((task) => (
                <div 
                  key={task.id}
                  className={cn(
                    "p-2 bg-card rounded border-r-2 text-sm",
                    getPriorityColor(task.priority)
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{task.title}</span>
                    <PriorityCategoryBadge category={task.priority_category as any} size="sm" showLabel={false} />
                  </div>
                  {task.clients?.name && (
                    <span className="text-xs text-muted-foreground">{task.clients.name}</span>
                  )}
                </div>
              ))}
              {unscheduledTasks.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  +{unscheduledTasks.length - 5} נוספות
                </p>
              )}
            </div>
          </div>
        )}

        {/* Time Slots */}
        {timeSlots.map(({ hour, label }) => {
          const slotTasks = tasksByHour[hour] || [];
          const hasTask = slotTasks.length > 0;
          
          return (
            <div 
              key={hour}
              className={cn(
                "flex gap-3 py-2 border-b border-border/50 min-h-[50px]",
                hasTask && "bg-accent/30"
              )}
            >
              <div className="w-14 text-sm text-muted-foreground font-mono shrink-0 pt-1">
                {label}
              </div>
              <div className="flex-1 space-y-1">
                {slotTasks.map((task) => (
                  <div 
                    key={task.id}
                    className={cn(
                      "p-2 bg-card rounded-lg border-r-2 hover:bg-accent transition-colors cursor-pointer",
                      getPriorityColor(task.priority)
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="font-medium truncate">{task.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <PriorityCategoryBadge 
                          category={task.priority_category as any} 
                          size="sm" 
                          showLabel={false} 
                        />
                        {task.duration_minutes && (
                          <Badge variant="outline" className="text-xs font-mono">
                            {task.duration_minutes}ד'
                          </Badge>
                        )}
                      </div>
                    </div>
                    {task.clients?.name && (
                      <p className="text-xs text-muted-foreground mt-1 mr-6">
                        {task.clients.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {tasks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>אין משימות מתוזמנות ליום זה</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}