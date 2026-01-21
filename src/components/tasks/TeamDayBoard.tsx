import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/hooks/useClient";
import { 
  Users, 
  Clock, 
  CheckSquare,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface TeamDayBoardProps {
  className?: string;
}

interface TeamMemberStats {
  email: string;
  name: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  urgentTasks: number;
  totalMinutes: number;
}

export function TeamDayBoard({ className }: TeamDayBoardProps) {
  const { selectedClient } = useClient();
  const todayStr = new Date().toISOString().split("T")[0];

  // Fetch team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-members-day"],
    queryFn: async () => {
      const { data } = await supabase
        .from("team")
        .select("id, name, email, department, role")
        .eq("is_active", true)
        .order("name");
      return data || [];
    },
  });

  // Fetch today's tasks for all team
  const { data: todayTasks = [], isLoading } = useQuery({
    queryKey: ["team-day-tasks", selectedClient?.id, todayStr],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select("id, title, status, priority, duration_minutes, assignee, client_id")
        .eq("due_date", todayStr);
      
      if (selectedClient) {
        query = query.eq("client_id", selectedClient.id);
      }
      
      const { data } = await query;
      return data || [];
    },
  });

  // Calculate stats per team member (match by team member ID)
  const teamStats: TeamMemberStats[] = teamMembers.map((member: any) => {
    const memberTasks = todayTasks.filter((t: any) => t.assignee === member.id);
    const completed = memberTasks.filter((t: any) => t.status === "completed");
    const inProgress = memberTasks.filter((t: any) => t.status === "in-progress");
    const urgent = memberTasks.filter((t: any) => 
      t.priority === "urgent" || t.priority === "high"
    );
    const totalMinutes = memberTasks.reduce((sum: number, t: any) => 
      sum + (t.duration_minutes || 60), 0
    );

    return {
      email: member.email,
      name: member.name || member.email?.split("@")[0] || "Unknown",
      totalTasks: memberTasks.length,
      completedTasks: completed.length,
      inProgressTasks: inProgress.length,
      urgentTasks: urgent.length,
      totalMinutes,
    };
  }).filter(m => m.totalTasks > 0).sort((a, b) => b.totalTasks - a.totalTasks);

  // Unassigned tasks
  const unassignedTasks = todayTasks.filter((t: any) => !t.assignee);

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
            <Users className="w-5 h-5" />
            עומס הצוות - היום
          </CardTitle>
          <Badge variant="outline">
            {todayTasks.length} משימות
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {teamStats.length === 0 && unassignedTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>אין משימות מתוזמנות להיום</p>
          </div>
        ) : (
          <>
            {/* Team Members */}
            {teamStats.map((member) => {
              const progressPercent = member.totalTasks > 0 
                ? Math.round((member.completedTasks / member.totalTasks) * 100)
                : 0;
              const hours = (member.totalMinutes / 60).toFixed(1);
              
              return (
                <div 
                  key={member.email}
                  className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {member.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{member.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {hours} שעות
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckSquare className="w-3 h-3" />
                          {member.totalTasks} משימות
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.urgentTasks > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="w-3 h-3 ml-1" />
                          {member.urgentTasks}
                        </Badge>
                      )}
                      {member.inProgressTasks > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          בתהליך: {member.inProgressTasks}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={progressPercent} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground w-12 text-left">
                      {progressPercent}%
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Unassigned Tasks Warning */}
            {unassignedTasks.length > 0 && (
              <div className="p-3 rounded-lg border border-warning/50 bg-warning/10">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="font-medium text-sm">
                    {unassignedTasks.length} משימות ללא שיוך
                  </span>
                </div>
                <div className="space-y-1">
                  {unassignedTasks.slice(0, 3).map((task: any) => (
                    <div key={task.id} className="text-sm text-muted-foreground">
                      • {task.title}
                    </div>
                  ))}
                  {unassignedTasks.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{unassignedTasks.length - 3} נוספות
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}