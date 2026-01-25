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
  Play,
  Loader2,
  Flame,
  Settings,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { microcopy } from "@/lib/microcopy";
import { format } from "date-fns";
import { he } from "date-fns/locale";

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

const statusColors = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-amber-500/20 text-amber-700",
  completed: "bg-green-500/20 text-green-700",
  waiting: "bg-orange-500/20 text-orange-700",
};

export function ProjectDetailDialog({ open, onOpenChange, projectId }: ProjectDetailDialogProps) {
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");

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

      // Fetch tasks for each stage
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select(`
          id, title, status, priority, due_date, task_tag, income_value, 
          is_client_visible, assignee,
          team:assignee(name)
        `)
        .eq("project_id", projectId)
        .order("created_at");
      
      if (tasksError) throw tasksError;

      // Group tasks by stage
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

  // Notes stored locally for now (project_notes table to be created)
  const [localNotes, setLocalNotes] = useState<Array<{ id: string; content: string; created_at: string }>>([]);
  
  const notes = localNotes;

  // Add note handler (local for now)
  const addNoteMutation = {
    mutate: () => {
      if (!newNote.trim()) return;
      const note = {
        id: crypto.randomUUID(),
        content: newNote,
        created_at: new Date().toISOString(),
      };
      setLocalNotes((prev) => [note, ...prev]);
      setNewNote("");
      toast.success("ההערה נוספה");
    },
    isPending: false,
  };

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
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FolderKanban className="h-6 w-6" style={{ color: project?.color }} />
            <div>
              <span className="text-xl">{project?.name}</span>
              {project?.clients?.name && (
                <Badge variant="outline" className="mr-3 text-xs">
                  {project.clients.name}
                </Badge>
              )}
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
            <TabsTrigger value="billing" className="gap-2">
              <DollarSign className="h-4 w-4" />
              כספים
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              הערות
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
                </div>
              ) : (
                <Accordion type="multiple" className="space-y-2">
                  {stages.map((stage: any) => {
                    const stageTasks = stage.tasks || [];
                    const stageCompleted = stageTasks.filter((t: any) => t.status === "completed").length;
                    
                    return (
                      <AccordionItem key={stage.id} value={stage.id} className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center justify-between w-full ml-4">
                            <div className="flex items-center gap-3">
                              {stage.status === "completed" ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : (
                                <Clock className="h-5 w-5 text-muted-foreground" />
                              )}
                              <span className="font-medium">{stage.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {stageCompleted}/{stageTasks.length}
                              </Badge>
                              {stage.requires_client_approval && (
                                <Badge variant="outline" className="text-xs">דורש אישור</Badge>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          {stageTasks.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2">אין משימות בשלב זה</p>
                          ) : (
                            <div className="space-y-2 py-2">
                              {stageTasks.map((task: any) => (
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
                                    <Badge className={cn("text-xs", statusColors[task.status as keyof typeof statusColors])}>
                                      {microcopy.status[task.status as keyof typeof microcopy.status] || task.status}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
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
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="text-base">מה הלקוח רואה</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    הלקוח רואה רק את השלבים ומשימות שסומנו כ"גלוי ללקוח"
                  </p>
                  
                  <div className="space-y-3">
                    {stages.map((stage: any) => {
                      const visibleTasks = (stage.tasks || []).filter((t: any) => t.is_client_visible);
                      
                      return (
                        <div key={stage.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{stage.name}</span>
                            <Badge variant={stage.status === "completed" ? "default" : "secondary"}>
                              {microcopy.status[stage.status as keyof typeof microcopy.status] || stage.status}
                            </Badge>
                          </div>
                          
                          {visibleTasks.length > 0 && (
                            <div className="space-y-1 mt-2 pt-2 border-t">
                              {visibleTasks.map((task: any) => (
                                <div key={task.id} className="text-sm flex items-center gap-2">
                                  {task.status === "completed" ? (
                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                  )}
                                  <span className={task.status === "completed" ? "text-muted-foreground line-through" : ""}>
                                    {task.title}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {stage.requires_client_approval && stage.status !== "completed" && (
                            <Badge variant="outline" className="mt-2 text-xs">
                              ממתין לאישור לקוח
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
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
                    <p className="text-2xl font-bold text-green-600">₪{totalPaid.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">שולם</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-amber-600">₪{(totalBilled - totalPaid).toLocaleString()}</p>
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

          {/* Notes Tab */}
          <TabsContent value="notes">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="הוסף הערה פנימית..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={2}
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => addNoteMutation.mutate()}
                    disabled={!newNote.trim() || addNoteMutation.isPending}
                  >
                    {addNoteMutation.isPending && <Loader2 className="h-4 w-4 ml-1 animate-spin" />}
                    שלח
                  </Button>
                </div>

                <div className="space-y-3">
                  {notes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>אין הערות פנימיות</p>
                    </div>
                  ) : (
                    notes.map((note: any) => (
                      <Card key={note.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-sm font-medium">{note.team?.name || "צוות"}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(note.created_at), "dd/MM/yyyy HH:mm", { locale: he })}
                            </span>
                          </div>
                          <p className="text-sm">{note.content}</p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
