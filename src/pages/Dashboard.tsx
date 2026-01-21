import { MainLayout } from "@/components/layout/MainLayout";
import { useClient } from "@/hooks/useClient";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { 
  CheckSquare,
  Loader2,
  Clock,
  FolderKanban,
  TrendingUp,
  Trophy,
  Target,
  Plus,
  Calendar,
  CircleDot
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useGamification } from "@/hooks/useGamification";
import { StreakCounter, ProgressRing } from "@/components/gamification";

export default function Dashboard() {
  const { selectedClient } = useClient();
  const { points, streak, levelInfo } = useGamification();

  // Get current user's team member name
  const { data: currentTeamMember } = useQuery({
    queryKey: ["current-team-member"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return null;
      
      const { data } = await supabase
        .from("team")
        .select("name")
        .eq("email", user.email)
        .single();
      return data;
    },
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats", selectedClient?.id],
    queryFn: async () => {
      // Get tasks
      let tasksQuery = supabase.from("tasks").select("status, client_id, due_date");
      if (selectedClient) {
        tasksQuery = tasksQuery.eq("client_id", selectedClient.id);
      }
      const { data: tasks } = await tasksQuery;

      // Get projects  
      let projectsQuery = supabase.from("projects").select("status, client_id");
      if (selectedClient) {
        projectsQuery = projectsQuery.eq("client_id", selectedClient.id);
      }
      const { data: projects } = await projectsQuery;

      const today = new Date().toISOString().split("T")[0];
      
      return {
        totalTasks: tasks?.length || 0,
        completedTasks: tasks?.filter(t => t.status === "completed").length || 0,
        openTasks: tasks?.filter(t => t.status !== "completed").length || 0,
        todayTasks: tasks?.filter(t => t.due_date === today && t.status !== "completed").length || 0,
        activeProjects: projects?.filter(p => p.status === "active").length || 0,
      };
    },
  });

  // Get recent tasks
  const { data: recentTasks = [] } = useQuery({
    queryKey: ["recent-tasks", selectedClient?.id],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select("id, title, status, priority, due_date, projects(name, color)")
        .neq("status", "completed")
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(5);
      
      if (selectedClient) {
        query = query.eq("client_id", selectedClient.id);
      }
      
      const { data } = await query;
      return data || [];
    },
  });

  const completionPercent = stats?.totalTasks 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0;

  return (
    <MainLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              שלום{currentTeamMember?.name ? `, ${currentTeamMember.name}` : ''} 👋
            </h1>
            <p className="text-muted-foreground">
              {selectedClient ? `דשבורד ${selectedClient.name}` : "הנה סיכום המשימות שלך"}
            </p>
          </div>
          <Button asChild>
            <Link to="/tasks">
              <Plus className="w-4 h-4 ml-2" />
              משימה חדשה
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Gamification Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Progress Ring */}
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6 flex flex-col items-center">
                  <ProgressRing progress={completionPercent} size={100}>
                    <div className="text-center">
                      <span className="text-2xl font-bold">{completionPercent}%</span>
                    </div>
                  </ProgressRing>
                  <p className="text-sm text-muted-foreground mt-3">שיעור השלמה</p>
                </CardContent>
              </Card>

              {/* Points */}
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex flex-col items-center justify-center">
                    <Trophy className="w-8 h-8 text-primary" />
                    <span className="text-lg font-bold">{points?.total_points || 0}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    רמה {levelInfo.level} · {levelInfo.progress}%
                  </p>
                </CardContent>
              </Card>

              {/* Streak */}
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6 flex flex-col items-center">
                  <StreakCounter 
                    streak={streak?.current_streak || 0} 
                    longestStreak={streak?.longest_streak}
                    size="md"
                    showLabel={false}
                  />
                  <p className="text-sm text-muted-foreground mt-3">רצף ימים</p>
                </CardContent>
              </Card>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats?.todayTasks || 0}</p>
                      <p className="text-xs text-muted-foreground">משימות להיום</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <CircleDot className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats?.openTasks || 0}</p>
                      <p className="text-xs text-muted-foreground">משימות פתוחות</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <CheckSquare className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats?.completedTasks || 0}</p>
                      <p className="text-xs text-muted-foreground">הושלמו</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <FolderKanban className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats?.activeProjects || 0}</p>
                      <p className="text-xs text-muted-foreground">פרויקטים פעילים</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress & Recent Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Progress Card */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    התקדמות כללית
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">השלמת משימות</span>
                      <span className="text-2xl font-bold">{completionPercent}%</span>
                    </div>
                    <Progress value={completionPercent} className="h-3" />
                    <p className="text-sm text-muted-foreground">
                      {stats?.completedTasks} מתוך {stats?.totalTasks} משימות הושלמו
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Tasks */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="w-5 h-5 text-amber-500" />
                    משימות קרובות
                  </CardTitle>
                  <Link to="/tasks">
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                      הצג הכל
                    </Badge>
                  </Link>
                </CardHeader>
                <CardContent>
                  {recentTasks.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      אין משימות פתוחות 🎉
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {recentTasks.map((task: any) => (
                        <Link 
                          key={task.id}
                          to={`/tasks?task=${task.id}`}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <CircleDot className="w-4 h-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{task.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {task.projects?.name && (
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs"
                                  style={{ 
                                    backgroundColor: task.projects.color + '20',
                                    color: task.projects.color 
                                  }}
                                >
                                  {task.projects.name}
                                </Badge>
                              )}
                              {task.due_date && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(task.due_date).toLocaleDateString('he-IL')}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
