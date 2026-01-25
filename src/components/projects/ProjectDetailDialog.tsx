import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  User, 
  DollarSign,
  MessageSquare,
  Loader2,
  Flame,
  Settings,
  Eye,
  Plus,
  UserCheck,
  AlertTriangle,
  Share2,
  History
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { microcopy } from "@/lib/microcopy";
import { format, differenceInDays } from "date-fns";
import { he } from "date-fns/locale";
import { AddStageDialog } from "./AddStageDialog";

interface ProjectDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

const taskTagIcons = {
  income_generating: <Flame className="h-3 w-3 text-amber-500" />,
  operational: <Settings className="h-3 w-3 text-muted-foreground" />,
  client_dependent: <User className="h-3 w-3 text-orange-500" />,
};

const statusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-warning/20 text-warning",
  waiting_client: "bg-tag-waiting text-tag-waiting-foreground",
  waiting: "bg-tag-waiting text-tag-waiting-foreground",
  approved: "bg-success/20 text-success",
  completed: "bg-success/20 text-success",
  todo: "bg-muted text-muted-foreground",
};

const stageStatusLabels: Record<string, string> = {
  pending: "ממתין",
  in_progress: "בעבודה",
  waiting_client: "ממתין ללקוח",
  approved: "אושר",
  completed: "הושלם",
};

export function ProjectDetailDialog({ open, onOpenChange, projectId }: ProjectDetailDialogProps) {
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");
  const [showAddStageDialog, setShowAddStageDialog] = useState(false);

  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project-detail", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          clients(name)
        `)
        .eq("id", projectId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: open && !!projectId,
  });

  // Fetch stages with tasks
  const { data: stages = [], isLoading: stagesLoading } = useQuery({
    queryKey: ["project-stages-with-tasks", projectId],
    queryFn: async () => {
      const { data: stagesData, error: stagesError } = await supabase
        .from("project_stages")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order");
      
      if (stagesError) throw stagesError;

      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select(`
          id, title, status, priority, due_date, task_tag, income_value, 
          is_client_visible, assignee, stage_id,
          team:assignee(name)
        `)
        .eq("project_id", projectId)
        .order("created_at");
      
      if (tasksError) throw tasksError;

      return (stagesData || []).map((stage: any) => ({
        ...stage,
        tasks: (tasksData || []).filter((t: any) => t.stage_id === stage.id),
      }));
    },
    enabled: open && !!projectId,
  });

  // Fetch billing records
  const { data: billingRecords = [] } = useQuery({
    queryKey: ["project-billing", projectId],
    queryFn: async () => {
      if (!project?.client_id) return [];
      
      const { data, error } = await supabase
        .from("billing_records")
        .select("*")
        .eq("client_id", project.client_id)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: open && !!project?.client_id,
  });

  // Fetch project notes
  const { data: notes = [] } = useQuery({
    queryKey: ["project-notes", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_notes")
        .select(`
          *,
          profiles:user_id(display_name)
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: open && !!projectId,
  });

  // Fetch activity history (stage changes, task updates)
  const { data: activityHistory = [] } = useQuery({
    queryKey: ["project-activity", projectId],
    queryFn: async () => {
      // Get stage approvals
      const { data: approvals } = await supabase
        .from("stage_approvals")
        .select(`
          id, created_at, decision, notes,
          project_stages!inner(name, project_id)
        `)
        .eq("project_stages.project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(20);
      
      // Get recent task status changes
      const { data: recentTasks } = await supabase
        .from("tasks")
        .select("id, title, status, updated_at")
        .eq("project_id", projectId)
        .order("updated_at", { ascending: false })
        .limit(10);
      
      const activities: Array<{
        id: string;
        type: "approval" | "task_update" | "note";
        content: string;
        timestamp: string;
        actor?: string;
      }> = [];
      
      (approvals || []).forEach((a: any) => {
        activities.push({
          id: a.id,
          type: "approval",
          content: `שלב "${a.project_stages?.name}" ${a.decision === "approved" ? "אושר" : "נדחה"}`,
          timestamp: a.created_at,
        });
      });
      
      (recentTasks || []).forEach((t: any) => {
        activities.push({
          id: t.id,
          type: "task_update",
          content: `משימה "${t.title}" עודכנה ל${microcopy.status[t.status as keyof typeof microcopy.status] || t.status}`,
          timestamp: t.updated_at,
        });
      });
      
      return activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 20);
    },
    enabled: open && !!projectId,
  });

  // Update stage status mutation
  const updateStageMutation = useMutation({
    mutationFn: async ({ stageId, status }: { stageId: string; status: string }) => {
      const updateData: Record<string, unknown> = { status };
      
      if (status === "completed") {
        updateData.completed_at = new Date().toISOString();
      }
      if (status === "approved") {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by_client = true;
      }
      if (status === "waiting_client") {
        // Update project status as well
        await supabase
          .from("projects")
          .update({ status: "waiting_client" })
          .eq("id", projectId);
      }

      const { error } = await supabase
        .from("project_stages")
        .update(updateData)
        .eq("id", stageId);
      
      if (error) throw error;

      // Update project last_activity_at
      await supabase
        .from("projects")
        .update({ last_activity_at: new Date().toISOString() })
        .eq("id", projectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-stages-with-tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-detail", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("השלב עודכן");
    },
    onError: () => toast.error("שגיאה בעדכון השלב"),
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async () => {
      if (!newNote.trim()) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("project_notes")
        .insert({
          project_id: projectId,
          content: newNote,
          user_id: user.id,
          is_internal: true,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      setNewNote("");
      queryClient.invalidateQueries({ queryKey: ["project-notes", projectId] });
      toast.success("ההערה נוספה");
    },
    onError: () => toast.error("שגיאה בהוספת ההערה"),
  });

  // Calculate stats
  const allTasks = stages.flatMap((s: any) => s.tasks || []);
  const completedTasks = allTasks.filter((t: any) => t.status === "completed").length;
  const progressPercent = allTasks.length > 0 
    ? Math.round((completedTasks / allTasks.length) * 100) 
    : 0;

  const totalBilled = billingRecords.reduce((sum: number, r: any) => sum + (r.total_amount || 0), 0);
  const totalPaid = billingRecords
    .filter((r: any) => r.status === "paid")
    .reduce((sum: number, r: any) => sum + (r.total_amount || 0), 0);

  if (projectLoading || stagesLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-64 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FolderKanban className="h-6 w-6 text-primary" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{project?.name}</span>
                  {project?.clients?.name && (
                    <Badge variant="outline" className="text-xs">
                      {project.clients.name}
                    </Badge>
                  )}
                </div>
                {/* Internal tag - Campaign is bread and butter */}
                {(project?.name?.toLowerCase().includes('קמפיין') ||
                  project?.name?.toLowerCase().includes('campaign') ||
                  project?.name?.toLowerCase().includes('meta') ||
                  project?.name?.toLowerCase().includes('google') ||
                  project?.name?.toLowerCase().includes('tiktok')) && (
                  <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <Flame className="h-3 w-3 ml-1" />
                    קמפיין הוא הלחם והחמאה
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAddStageDialog(true)}>
                <Plus className="h-4 w-4 ml-1" />
                הוסף שלב
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 ml-1" />
                שתף עם לקוח
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="stages" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stages" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              שלבים ומשימות
            </TabsTrigger>
            <TabsTrigger value="client" className="gap-2">
              <Eye className="h-4 w-4" />
              תצוגת לקוח
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <History className="h-4 w-4" />
              פעילות
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <DollarSign className="h-4 w-4" />
              כספים
            </TabsTrigger>
          </TabsList>

          {/* Stages & Tasks Tab */}
          <TabsContent value="stages">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>התקדמות כללית</span>
                  <span className="font-medium">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              {stages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderKanban className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>אין שלבים בפרויקט זה</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setShowAddStageDialog(true)}
                  >
                    <Plus className="h-4 w-4 ml-1" />
                    הוסף שלב ראשון
                  </Button>
                </div>
              ) : (
                <Accordion type="multiple" className="space-y-2">
                  {stages.map((stage: any, index: number) => {
                    const stageTasks = stage.tasks || [];
                    const stageCompleted = stageTasks.filter((t: any) => t.status === "completed").length;
                    const waitingDays = stage.status === "waiting_client" && stage.updated_at
                      ? differenceInDays(new Date(), new Date(stage.updated_at))
                      : null;
                    
                    return (
                      <AccordionItem key={stage.id} value={stage.id} className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center justify-between w-full ml-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground w-5">{index + 1}</span>
                              {stage.status === "completed" ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : stage.status === "waiting_client" ? (
                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                              ) : (
                                <Clock className="h-5 w-5 text-muted-foreground" />
                              )}
                              <span className="font-medium">{stage.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {waitingDays !== null && waitingDays > 0 && (
                                <Badge variant="outline" className="text-xs text-orange-600">
                                  ממתין {waitingDays} ימים
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">
                                {stageCompleted}/{stageTasks.length}
                              </Badge>
                              <Badge className={cn("text-xs", statusColors[stage.status])}>
                                {stageStatusLabels[stage.status] || stage.status}
                              </Badge>
                              {stage.requires_client_approval && (
                                <Badge variant="outline" className="text-xs">
                                  <UserCheck className="h-3 w-3 ml-1" />
                                  דורש אישור
                                </Badge>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="py-2 space-y-3">
                            {/* Stage Actions */}
                            <div className="flex gap-2 pb-2 border-b">
                              {stage.status !== "waiting_client" && stage.status !== "completed" && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => updateStageMutation.mutate({ 
                                    stageId: stage.id, 
                                    status: "waiting_client" 
                                  })}
                                >
                                  {microcopy.buttons.waitingForClient}
                                </Button>
                              )}
                              {stage.requires_client_approval && stage.status !== "approved" && stage.status !== "completed" && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-primary"
                                >
                                  בקש אישור לקוח
                                </Button>
                              )}
                              {stage.status !== "completed" && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-green-600"
                                  onClick={() => updateStageMutation.mutate({ 
                                    stageId: stage.id, 
                                    status: "completed" 
                                  })}
                                >
                                  סמן כהושלם
                                </Button>
                              )}
                            </div>

                            {/* Tasks Preview */}
                            {stageTasks.length === 0 ? (
                              <p className="text-sm text-muted-foreground py-2">אין משימות בשלב זה</p>
                            ) : (
                              <div className="space-y-2">
                                {stageTasks.slice(0, 5).map((task: any) => (
                                  <div
                                    key={task.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                  >
                                    <div className="flex items-center gap-3">
                                      {task.task_tag && taskTagIcons[task.task_tag as keyof typeof taskTagIcons]}
                                      <span className={cn(
                                        "text-sm",
                                        task.status === "completed" && "line-through text-muted-foreground"
                                      )}>
                                        {task.title}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {task.team?.name && (
                                        <span className="text-xs text-muted-foreground">{task.team.name}</span>
                                      )}
                                      {task.due_date && (
                                        <span className="text-xs text-muted-foreground">
                                          {format(new Date(task.due_date), "dd/MM", { locale: he })}
                                        </span>
                                      )}
                                      <Badge className={cn("text-xs", statusColors[task.status])}>
                                        {microcopy.status[task.status as keyof typeof microcopy.status] || task.status}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                                {stageTasks.length > 5 && (
                                  <Button variant="ghost" size="sm" className="w-full">
                                    עוד {stageTasks.length - 5} משימות
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Client View Tab */}
          <TabsContent value="client">
            <ScrollArea className="h-[500px] pr-4">
              <Card className="mb-4 border-dashed border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    תצוגה מקדימה - מה הלקוח רואה
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    הלקוח לא רואה: משימות, צוות, כספים מפורטים, הערות פנימיות
                  </p>
                </CardHeader>
                <CardContent className="pt-2">
                  {/* Client View Header */}
                  <div className="text-center p-4 bg-muted/50 rounded-lg mb-4">
                    <p className="font-medium text-lg">{microcopy.clientPortal.projectStatus}</p>
                    <p className="text-sm text-muted-foreground">{project?.name}</p>
                  </div>
                  
                  <div className="space-y-3">
                    {stages.length === 0 ? (
                      <p className="text-center text-muted-foreground py-6">אין שלבים להצגה</p>
                    ) : (
                      stages.map((stage: any, idx: number) => {
                        const needsApproval = stage.requires_client_approval && 
                                              !stage.approved_by_client && 
                                              stage.status !== "completed";
                        const isWaitingClient = stage.status === "waiting_client";
                        
                        return (
                          <div 
                            key={stage.id} 
                            className={cn(
                              "p-4 border rounded-lg",
                              (needsApproval || isWaitingClient) && "border-warning bg-warning/5"
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{idx + 1}</span>
                                {stage.status === "completed" || stage.approved_by_client ? (
                                  <CheckCircle2 className="h-4 w-4 text-success" />
                                ) : isWaitingClient ? (
                                  <AlertTriangle className="h-4 w-4 text-warning" />
                                ) : (
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className="font-medium">{stage.name}</span>
                              </div>
                              <Badge className={cn("text-xs", statusColors[stage.status])}>
                                {isWaitingClient ? "ממתין לאישור שלך" : stageStatusLabels[stage.status] || stage.status}
                              </Badge>
                            </div>
                            
                            {(needsApproval || isWaitingClient) && (
                              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-warning/30">
                                <Button size="sm" className="gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  {microcopy.buttons.approve}
                                </Button>
                                <Button variant="outline" size="sm">
                                  {microcopy.buttons.iHaveComment}
                                </Button>
                              </div>
                            )}
                            
                            {stage.approved_by_client && (
                              <Badge variant="outline" className="mt-2 text-xs text-success">
                                <CheckCircle2 className="h-3 w-3 ml-1" />
                                אושר על ידי הלקוח
                              </Badge>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </ScrollArea>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {/* Add Note */}
                <div className="space-y-2 pb-4 border-b">
                  <Textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="הוסף הערה פנימית..."
                    rows={3}
                  />
                  <Button 
                    onClick={() => addNoteMutation.mutate()}
                    disabled={!newNote.trim() || addNoteMutation.isPending}
                    size="sm"
                  >
                    {addNoteMutation.isPending && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                    הוסף הערה
                  </Button>
                </div>

                {/* Activity Timeline */}
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <History className="h-4 w-4" />
                    מי שינה מה ומתי
                  </h4>
                  
                  {activityHistory.length === 0 && notes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      אין פעילות להצגה
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {/* Notes */}
                      {notes.map((note: any) => (
                        <Card key={`note-${note.id}`} className="border-r-4 border-r-primary">
                          <CardContent className="py-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm">{note.content}</p>
                                {note.profiles?.display_name && (
                                  <p className="text-xs text-primary mt-1">
                                    {note.profiles.display_name}
                                  </p>
                                )}
                              </div>
                              <Badge variant="outline" className="text-xs">הערה</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(note.created_at), "dd/MM/yyyy HH:mm", { locale: he })}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {/* Activity History */}
                      {activityHistory.map((activity: any) => (
                        <Card key={`activity-${activity.id}`} className={cn(
                          "border-r-4",
                          activity.type === "approval" ? "border-r-success" : "border-r-muted"
                        )}>
                          <CardContent className="py-3">
                            <div className="flex items-start justify-between">
                              <p className="text-sm">{activity.content}</p>
                              <Badge variant="secondary" className="text-xs">
                                {activity.type === "approval" ? "אישור" : "עדכון"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(activity.timestamp), "dd/MM/yyyy HH:mm", { locale: he })}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <ScrollArea className="h-[500px] pr-4">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold">₪{totalBilled.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">סה"כ חויב</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-success">₪{totalPaid.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">שולם</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-warning">₪{(totalBilled - totalPaid).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">פתוח</p>
                  </CardContent>
                </Card>
              </div>

              {billingRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>אין רשומות חיוב</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {billingRecords.map((record: any) => (
                    <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {format(new Date(record.period_start), "MMMM yyyy", { locale: he })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {record.notes || "חיוב חודשי"}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="font-bold">₪{(record.total_amount || 0).toLocaleString()}</p>
                        <Badge variant={record.status === "paid" ? "default" : "secondary"}>
                          {record.status === "paid" ? "שולם" : record.status === "overdue" ? "באיחור" : "ממתין"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Add Stage Dialog */}
        <AddStageDialog
          open={showAddStageDialog}
          onOpenChange={setShowAddStageDialog}
          projectId={projectId}
        />
      </DialogContent>
    </Dialog>
  );
}
