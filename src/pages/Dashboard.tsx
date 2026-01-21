import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { 
  CheckSquare,
  Loader2,
  Circle,
  Calendar,
  Clock,
  FolderKanban,
  TrendingUp,
  Flame,
  Trophy,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { selectedClient } = useClient();

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
      let projectsQuery = supabase.from("projects").select("id, status");
      if (selectedClient) {
        projectsQuery = projectsQuery.eq("client_id", selectedClient.id);
      }
      const { data: projects } = await projectsQuery;

      const openTasks = tasks?.filter(t => t.status !== "completed").length || 0;
      const completedTasks = tasks?.filter(t => t.status === "completed").length || 0;
      const todayStr = new Date().toISOString().split("T")[0];
      const todayTasks = tasks?.filter(t => t.due_date === todayStr && t.status !== "completed").length || 0;
      const activeProjects = projects?.filter(p => p.status === "active").length || 0;

      return {
        openTasks,
        completedTasks,
        todayTasks,
        activeProjects,
        totalTasks: tasks?.length || 0,
      };
    },
  });

  // Fetch recent tasks
  const { data: recentTasks = [] } = useQuery({
    queryKey: ["recent-tasks-dashboard", selectedClient?.id],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select("*, projects:projects!tasks_project_id_fkey(name, color)")
        .neq("status", "completed")
        .order("due_date", { ascending: true })
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
      <div className="p-8 max-w-7xl mx-auto">
        <PageHeader 
          title={`שלום${currentTeamMember?.name ? `, ${currentTeamMember.name}` : ''}`}
          description="הנה סיכום המשימות שלך"
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <Card className="card-clean hover-lift">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Target className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{stats?.todayTasks || 0}</p>
                      <p className="text-sm text-muted-foreground">משימות להיום</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-clean hover-lift">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                      <Circle className="w-6 h-6 text-warning" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{stats?.openTasks || 0}</p>
                      <p className="text-sm text-muted-foreground">משימות פתוחות</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-clean hover-lift">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                      <CheckSquare className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{stats?.completedTasks || 0}</p>
                      <p className="text-sm text-muted-foreground">הושלמו</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-clean hover-lift">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
                      <FolderKanban className="w-6 h-6 text-info" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{stats?.activeProjects || 0}</p>
                      <p className="text-sm text-muted-foreground">פרויקטים פעילים</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress & Recent Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              {/* Progress Card */}
              <Card className="card-clean">
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
              <Card className="card-clean">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="w-5 h-5 text-warning" />
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
                        <div 
                          key={task.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <Circle className="w-4 h-4 text-muted-foreground" />
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
                        </div>
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
