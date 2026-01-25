import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { DomainErrorBoundary } from "@/components/shared/DomainErrorBoundary";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  FolderKanban, 
  Plus, 
  Loader2, 
  Calendar, 
  CheckSquare,
  Clock,
  AlertTriangle,
  UserCheck,
  Pause,
  Check,
  MoreVertical,
  Copy,
  Trash2,
  Archive,
  FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ProjectDetailDialog } from "@/components/projects/ProjectDetailDialog";
import { microcopy, formatMessage } from "@/lib/microcopy";
import { differenceInDays } from "date-fns";
import { useProjectMutations } from "@/hooks/useProjects";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Status configuration with icons and colors
const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  active: { label: "פעיל", color: "text-success", bgColor: "bg-success/10", icon: Clock },
  waiting_client: { label: "ממתין ללקוח", color: "text-warning", bgColor: "bg-warning/10", icon: Pause },
  waiting_payment: { label: "ממתין לתשלום", color: "text-destructive", bgColor: "bg-destructive/10", icon: AlertTriangle },
  at_risk: { label: "בסיכון", color: "text-destructive", bgColor: "bg-destructive/10", icon: AlertTriangle },
  completed: { label: "הושלם", color: "text-info", bgColor: "bg-info/10", icon: Check },
  paused: { label: "מושהה", color: "text-muted-foreground", bgColor: "bg-muted", icon: Pause },
};

// Platform badges
const platformConfig: Record<string, { label: string; color: string }> = {
  google: { label: "Google", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  meta: { label: "Meta", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  tiktok: { label: "TikTok", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400" },
};

type FilterStatus = "all" | "active" | "waiting_client" | "waiting_payment" | "at_risk" | "completed";

export default function Projects() {
  const navigate = useNavigate();
  const { selectedClient, effectiveClient, isAgencyView, clients } = useClient();
  const { duplicateProject, deleteProject, archiveProject } = useProjectMutations();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  // Fetch projects with stages count
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects", selectedClient?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          clients:clients!projects_client_id_fkey(name, is_master_account, deleted_at),
          project_stages(id, status)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Filter out projects from deleted clients
      let filteredProjects = data.filter((p: any) => !p.clients?.deleted_at);
      
      // Filter by client when not in agency view
      if (selectedClient && !selectedClient.is_master_account) {
        filteredProjects = filteredProjects.filter((p: any) => p.client_id === selectedClient.id);
      }
      
      return filteredProjects;
    },
  });

  // Fetch tasks for progress calculation
  const { data: allTasks = [] } = useQuery({
    queryKey: ["project-tasks", selectedClient?.id],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select("id, status, project_id, task_tag")
        .not("project_id", "is", null);
      
      if (selectedClient) {
        query = query.eq("client_id", selectedClient.id);
      }
      
      const { data } = await query;
      return data || [];
    },
  });

  // Calculate project progress and stats
  const getProjectStats = (project: any) => {
    const projectTasks = allTasks.filter((t: any) => t.project_id === project.id);
    const completed = projectTasks.filter((t: any) => t.status === "completed").length;
    const total = projectTasks.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const stages = project.project_stages || [];
    const completedStages = stages.filter((s: any) => s.status === "completed").length;
    
    // Check for stalled projects (no activity in X days)
    const daysSinceActivity = project.last_activity_at 
      ? differenceInDays(new Date(), new Date(project.last_activity_at))
      : null;
    
    return {
      tasksTotal: total,
      tasksCompleted: completed,
      progressPercent: percent,
      stagesTotal: stages.length,
      stagesCompleted: completedStages,
      daysSinceActivity,
      isAtRisk: daysSinceActivity !== null && daysSinceActivity >= 4 && project.status !== "completed",
    };
  };

  // Get platforms from project metadata or template_type
  const getProjectPlatforms = (project: any): string[] => {
    const platforms: string[] = [];
    const templateType = project.template_type?.toLowerCase() || "";
    
    if (templateType.includes("google")) platforms.push("google");
    if (templateType.includes("meta")) platforms.push("meta");
    if (templateType.includes("tiktok")) platforms.push("tiktok");
    
    // Also check project name for platforms
    const name = project.name?.toLowerCase() || "";
    if (name.includes("google") && !platforms.includes("google")) platforms.push("google");
    if (name.includes("meta") || name.includes("facebook") || name.includes("instagram")) {
      if (!platforms.includes("meta")) platforms.push("meta");
    }
    if (name.includes("tiktok") && !platforms.includes("tiktok")) platforms.push("tiktok");
    
    return platforms;
  };

  // Filter projects
  const filteredProjects = projects.filter((project: any) => {
    if (filterStatus === "all") return true;
    
    const stats = getProjectStats(project);
    
    if (filterStatus === "at_risk") {
      return stats.isAtRisk || project.status === "at_risk";
    }
    
    return project.status === filterStatus;
  });

  // Count projects by status
  const statusCounts = {
    all: projects.length,
    active: projects.filter((p: any) => p.status === "active").length,
    waiting_client: projects.filter((p: any) => p.status === "waiting_client").length,
    waiting_payment: projects.filter((p: any) => p.status === "waiting_payment").length,
    at_risk: projects.filter((p: any) => {
      const stats = getProjectStats(p);
      return stats.isAtRisk || p.status === "at_risk";
    }).length,
    completed: projects.filter((p: any) => p.status === "completed").length,
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <DomainErrorBoundary domain="projects">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <PageHeader 
              title="פרויקטים"
              description={selectedClient ? `פרויקטים של ${selectedClient.name}` : "כל הפרויקטים"}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={() => navigate("/proposals")}>
                    <FileText className="w-4 h-4 ml-2" />
                    צור הצעת מחיר
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>פרויקטים נוצרים מהצעות מחיר שאושרו</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Status Filter Chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { value: "all", label: "הכל" },
              { value: "active", label: "פעיל" },
              { value: "waiting_client", label: "ממתין ללקוח" },
              { value: "waiting_payment", label: "ממתין לתשלום" },
              { value: "at_risk", label: "בסיכון" },
              { value: "completed", label: "הושלם" },
            ].map((filter) => (
              <Button
                key={filter.value}
                variant={filterStatus === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(filter.value as FilterStatus)}
                className={cn(
                  "gap-2",
                  filter.value === "at_risk" && statusCounts.at_risk > 0 && filterStatus !== "at_risk" && "border-destructive text-destructive"
                )}
              >
                {filter.label}
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-xs px-1.5",
                    filterStatus === filter.value && "bg-primary-foreground text-primary"
                  )}
                >
                  {statusCounts[filter.value as keyof typeof statusCounts]}
                </Badge>
              </Button>
            ))}
          </div>

          {filteredProjects.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <FolderKanban className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">
                  {filterStatus === "all" ? "אין פרויקטים עדיין" : "אין פרויקטים בסטטוס זה"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {filterStatus === "all" ? "פרויקטים נוצרים אוטומטית מהצעות מחיר שאושרו" : "נסה לבחור פילטר אחר"}
                </p>
                {filterStatus === "all" && (
                  <Button onClick={() => navigate("/proposals")}>
                    <FileText className="w-4 h-4 ml-2" />
                    צור הצעת מחיר
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project: any) => {
                const stats = getProjectStats(project);
                const status = statusConfig[stats.isAtRisk ? "at_risk" : project.status] || statusConfig.active;
                const StatusIcon = status.icon;
                const platforms = getProjectPlatforms(project);
                
                return (
                  <Card 
                    key={project.id} 
                    className={cn(
                      "hover:shadow-lg transition-all group cursor-pointer border-t-4",
                      stats.isAtRisk && "border-t-destructive",
                      !stats.isAtRisk && "border-t-primary"
                    )}
                    onClick={() => setSelectedProjectId(project.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            <FolderKanban className="w-4 h-4 text-primary" />
                            {project.name}
                          </CardTitle>
                          {project.clients?.name && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {project.clients.name}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <StatusIcon className={cn("w-4 h-4", status.color)} />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem onClick={() => duplicateProject.mutate(project.id)}>
                                <Copy className="w-4 h-4 ml-2" />
                                שכפל פרויקט
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => archiveProject.mutate(project.id)}>
                                <Archive className="w-4 h-4 ml-2" />
                                העבר לארכיון
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => deleteProject.mutate(project.id)}
                              >
                                <Trash2 className="w-4 h-4 ml-2" />
                                מחק פרויקט
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Status & Platform Badges */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        <Badge className={cn("text-xs", status.bgColor, status.color)}>
                          {status.label}
                        </Badge>
                        {platforms.map((platform) => (
                          <Badge 
                            key={platform} 
                            variant="outline"
                            className={cn("text-xs", platformConfig[platform]?.color)}
                          >
                            {platformConfig[platform]?.label}
                          </Badge>
                        ))}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Risk Warning */}
                      {stats.isAtRisk && stats.daysSinceActivity !== null && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 text-destructive text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{formatMessage(microcopy.messages.noProgressWarning, { days: stats.daysSinceActivity })}</span>
                        </div>
                      )}

                      {/* Progress */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">התקדמות</span>
                          <span className="font-medium">{stats.progressPercent}%</span>
                        </div>
                        <Progress value={stats.progressPercent} className="h-2" />
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          <span>{stats.stagesCompleted}/{stats.stagesTotal} שלבים</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckSquare className="w-3 h-3" />
                          <span>{stats.tasksCompleted}/{stats.tasksTotal} משימות</span>
                        </div>
                        {project.target_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(project.target_date).toLocaleDateString("he-IL")}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProjectId(project.id);
                        }}
                      >
                        {microcopy.buttons.goToProject}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Project Detail Dialog */}
          {selectedProjectId && (
            <ProjectDetailDialog
              open={!!selectedProjectId}
              onOpenChange={(open) => !open && setSelectedProjectId(null)}
              projectId={selectedProjectId}
            />
          )}

        </div>
      </DomainErrorBoundary>
    </MainLayout>
  );
}
