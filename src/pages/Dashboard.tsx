import { MainLayout } from "@/components/layout/MainLayout";
import { useClient } from "@/hooks/useClient";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { 
  Loader2,
  Trophy,
  Plus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGamification } from "@/hooks/useGamification";
import { usePermissions } from "@/hooks/useAuth";
import { StreakCounter, ProgressRing } from "@/components/gamification";
import { FocusDashboard } from "@/components/dashboard/FocusDashboard";
import { ClientDashboard } from "@/components/dashboard/ClientDashboard";
import { EmployeeDashboard } from "@/components/dashboard/EmployeeDashboard";

export default function Dashboard() {
  const { selectedClient, isAgencyView } = useClient();
  const { points, streak, levelInfo } = useGamification();
  const { isClient, isEmployee, isAgencyManager, isAdmin } = usePermissions();

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
    queryKey: ["dashboard-stats", selectedClient?.id, isAgencyView],
    queryFn: async () => {
      let tasksQuery = supabase.from("tasks").select("status, client_id");
      if (selectedClient && !isAgencyView) {
        tasksQuery = tasksQuery.eq("client_id", selectedClient.id);
      }
      const { data: tasks } = await tasksQuery;
      
      return {
        totalTasks: tasks?.length || 0,
        completedTasks: tasks?.filter(t => t.status === "completed").length || 0,
      };
    },
  });

  const completionPercent = stats?.totalTasks 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0;

  // Role-based dashboard routing
  // Clients see ClientDashboard
  if (isClient) {
    return (
      <MainLayout>
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
          <ClientDashboard />
        </div>
      </MainLayout>
    );
  }

  // Regular employees see EmployeeDashboard
  if (isEmployee && !isAgencyManager && !isAdmin) {
    return (
      <MainLayout>
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
          <EmployeeDashboard />
        </div>
      </MainLayout>
    );
  }

  // Admins and Agency Managers see FocusDashboard
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
              {selectedClient ? `דשבורד ${selectedClient.name}` : "זה מה שיקדם את העסק היום"}
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
            {/* Gamification Row - Compact */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-4 pb-4 flex items-center justify-center gap-3">
                  <ProgressRing progress={completionPercent} size={60}>
                    <span className="text-sm font-bold">{completionPercent}%</span>
                  </ProgressRing>
                  <span className="text-sm text-muted-foreground">השלמה</span>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="pt-4 pb-4 flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <span className="text-lg font-bold">{points?.total_points || 0}</span>
                    <p className="text-xs text-muted-foreground">רמה {levelInfo.level}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="pt-4 pb-4 flex items-center justify-center gap-3">
                  <StreakCounter 
                    streak={streak?.current_streak || 0} 
                    longestStreak={streak?.longest_streak}
                    size="sm"
                    showLabel={false}
                  />
                  <span className="text-sm text-muted-foreground">רצף ימים</span>
                </CardContent>
              </Card>
            </div>

            {/* Focus Dashboard - Main Content */}
            <FocusDashboard clientId={isAgencyView ? undefined : selectedClient?.id} />
          </>
        )}
      </div>
    </MainLayout>
  );
}
