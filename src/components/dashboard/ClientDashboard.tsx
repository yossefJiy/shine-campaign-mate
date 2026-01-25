import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckCircle2, 
  Clock, 
  FolderKanban,
  MessageSquare,
  Loader2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/hooks/useClient";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface StageWithProject {
  id: string;
  name: string;
  status: string;
  sort_order: number;
  requires_client_approval: boolean;
  project: {
    id: string;
    name: string;
    status: string;
  };
}

export function ClientDashboard() {
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();
  const [feedbackDialog, setFeedbackDialog] = useState<{ open: boolean; stageId: string; stageName: string }>({ 
    open: false, 
    stageId: "", 
    stageName: "" 
  });
  const [feedbackText, setFeedbackText] = useState("");

  // Fetch client's projects with stages
  const { data: projectsWithStages, isLoading } = useQuery({
    queryKey: ["client-dashboard", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient?.id) return [];
      
      const { data, error } = await supabase
        .from("project_stages")
        .select(`
          id, name, status, sort_order, requires_client_approval,
          projects!inner(id, name, status, client_id)
        `)
        .eq("projects.client_id", selectedClient.id)
        .neq("projects.status", "completed")
        .order("sort_order");
      
      if (error) throw error;
      
      // Group by project
      const grouped: Record<string, { project: any; stages: StageWithProject[] }> = {};
      (data || []).forEach((stage: any) => {
        const projectId = stage.projects.id;
        if (!grouped[projectId]) {
          grouped[projectId] = {
            project: stage.projects,
            stages: []
          };
        }
        grouped[projectId].stages.push({
          ...stage,
          project: stage.projects
        });
      });
      
      return Object.values(grouped);
    },
    enabled: !!selectedClient?.id,
  });

  // Approve stage mutation
  const approveMutation = useMutation({
    mutationFn: async (stageId: string) => {
      const { error } = await supabase
        .from("project_stages")
        .update({ 
          status: "completed" as const,
          completed_at: new Date().toISOString()
        })
        .eq("id", stageId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-dashboard"] });
      toast.success("השלב אושר בהצלחה!");
    },
    onError: () => {
      toast.error("שגיאה באישור השלב");
    },
  });

  // Send feedback mutation - just show toast for now
  const feedbackMutation = useMutation({
    mutationFn: async ({ stageId, message }: { stageId: string; message: string }) => {
      // TODO: In production, create a proper feedback/comment system
      // For now, just log and return success
      console.log("Client feedback for stage:", stageId, message);
      return { stageId, message };
    },
    onSuccess: () => {
      setFeedbackDialog({ open: false, stageId: "", stageName: "" });
      setFeedbackText("");
      toast.success("ההערה נשלחה בהצלחה!");
    },
    onError: () => {
      toast.error("שגיאה בשליחת ההערה");
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">הושלם</Badge>;
      case "in_progress":
        return <Badge className="bg-amber-500">בתהליך</Badge>;
      case "waiting":
        return <Badge className="bg-orange-500">ממתין</Badge>;
      default:
        return <Badge variant="secondary">לא התחיל</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!projectsWithStages || projectsWithStages.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderKanban className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">ברוכים הבאים!</h2>
        <p className="text-muted-foreground">
          אין פרויקטים פעילים כרגע. הצוות יעדכן אותך כשיהיה מה לראות.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold">שלום, {selectedClient?.name}</h2>
        <p className="text-muted-foreground">הנה סטטוס הפרויקטים שלך</p>
      </div>

      {/* Projects */}
      {projectsWithStages.map(({ project, stages }) => (
        <Card key={project.id} className="overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-primary" />
              {project.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {stages.map((stage) => (
                <div
                  key={stage.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border",
                    stage.status === "completed" && "bg-green-50 dark:bg-green-950/20 border-green-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {stage.status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">{stage.name}</p>
                      <div className="mt-1">
                        {getStatusBadge(stage.status)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {stage.requires_client_approval && stage.status !== "completed" && (
                      <Button
                        size="sm"
                        onClick={() => approveMutation.mutate(stage.id)}
                        disabled={approveMutation.isPending}
                      >
                        {approveMutation.isPending && <Loader2 className="h-4 w-4 ml-1 animate-spin" />}
                        אשר שלב
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setFeedbackDialog({ 
                        open: true, 
                        stageId: stage.id, 
                        stageName: stage.name 
                      })}
                    >
                      <MessageSquare className="h-4 w-4 ml-1" />
                      הערה
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Feedback Dialog */}
      <Dialog 
        open={feedbackDialog.open} 
        onOpenChange={(open) => setFeedbackDialog({ ...feedbackDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הערה על "{feedbackDialog.stageName}"</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="כתוב את ההערה שלך כאן..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFeedbackDialog({ open: false, stageId: "", stageName: "" })}
            >
              ביטול
            </Button>
            <Button
              onClick={() => feedbackMutation.mutate({ 
                stageId: feedbackDialog.stageId, 
                message: feedbackText 
              })}
              disabled={!feedbackText.trim() || feedbackMutation.isPending}
            >
              {feedbackMutation.isPending && <Loader2 className="h-4 w-4 ml-1 animate-spin" />}
              שלח הערה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
