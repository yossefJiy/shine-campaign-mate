import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  CheckCircle2, 
  Clock, 
  MessageSquare,
  Loader2,
  AlertCircle,
  FolderKanban
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { microcopy } from "@/lib/microcopy";

interface ClientProjectPortalProps {
  projectId: string;
  isDialog?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const stageStatusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/10 text-primary",
  waiting_client: "bg-warning/20 text-warning",
  approved: "bg-success/20 text-success",
  completed: "bg-success/20 text-success",
};

const stageStatusLabels: Record<string, string> = {
  pending: "ממתין להתחלה",
  in_progress: "בעבודה",
  waiting_client: "ממתין לאישור שלך",
  approved: "אושר",
  completed: "הושלם",
};

export function ClientProjectPortal({ 
  projectId, 
  isDialog = false, 
  open, 
  onOpenChange 
}: ClientProjectPortalProps) {
  const queryClient = useQueryClient();
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  // Fetch project
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["client-project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, status")
        .eq("id", projectId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch stages (no tasks - client doesn't see tasks)
  const { data: stages = [], isLoading: stagesLoading } = useQuery({
    queryKey: ["client-project-stages", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_stages")
        .select("id, name, status, requires_client_approval, approved_by_client, client_notes")
        .eq("project_id", projectId)
        .order("sort_order");
      
      if (error) throw error;
      return data || [];
    },
  });

  // Approve stage mutation
  const approveStage = useMutation({
    mutationFn: async (stageId: string) => {
      const { error } = await supabase
        .from("project_stages")
        .update({ 
          status: "approved",
          approved_by_client: true,
          approved_at: new Date().toISOString(),
        })
        .eq("id", stageId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-project-stages", projectId] });
      toast.success("השלב אושר בהצלחה");
    },
    onError: () => toast.error("שגיאה באישור השלב"),
  });

  // Add comment mutation
  const addComment = useMutation({
    mutationFn: async () => {
      if (!selectedStageId || !comment.trim()) return;
      
      const { error } = await supabase
        .from("stage_comments")
        .insert({
          stage_id: selectedStageId,
          content: comment,
          is_internal: false,
        });
      
      if (error) throw error;

      // Update stage to show there's a response needed
      await supabase
        .from("project_stages")
        .update({ client_notes: comment })
        .eq("id", selectedStageId);
    },
    onSuccess: () => {
      setComment("");
      setCommentDialogOpen(false);
      setSelectedStageId(null);
      queryClient.invalidateQueries({ queryKey: ["client-project-stages", projectId] });
      toast.success("ההערה נשלחה");
    },
    onError: () => toast.error("שגיאה בשליחת ההערה"),
  });

  const isLoading = projectLoading || stagesLoading;

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center pb-4 border-b">
        <FolderKanban className="h-10 w-10 mx-auto mb-2 text-primary" />
        <h2 className="text-xl font-semibold">{microcopy.clientPortal.projectStatus}</h2>
        {project && (
          <p className="text-muted-foreground mt-1">{project.name}</p>
        )}
      </div>

      {/* Stages List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : stages.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>{microcopy.clientPortal.noStages}</p>
        </div>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-3 pr-4">
            {stages.map((stage: any, index: number) => {
              const needsApproval = stage.requires_client_approval && 
                                    !stage.approved_by_client && 
                                    stage.status !== "completed";
              const isWaitingClient = stage.status === "waiting_client";
              
              return (
                <Card 
                  key={stage.id}
                  className={cn(
                    "transition-all",
                    (needsApproval || isWaitingClient) && "border-warning ring-1 ring-warning/20"
                  )}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground font-medium w-5">
                          {index + 1}
                        </span>
                        {stage.status === "completed" || stage.approved_by_client ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : isWaitingClient ? (
                          <AlertCircle className="h-5 w-5 text-warning" />
                        ) : (
                          <Clock className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span className="font-medium">{stage.name}</span>
                      </div>
                      <Badge className={cn("text-xs", stageStatusColors[stage.status])}>
                        {stageStatusLabels[stage.status] || stage.status}
                      </Badge>
                    </div>

                    {/* Waiting for approval indicator */}
                    {(needsApproval || isWaitingClient) && (
                      <div className="bg-warning/10 rounded-lg p-3 mt-3">
                        <p className="text-sm text-warning font-medium mb-3">
                          {microcopy.clientPortal.waitingForYourApproval}
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            onClick={() => approveStage.mutate(stage.id)}
                            disabled={approveStage.isPending}
                            className="gap-1"
                          >
                            {approveStage.isPending && (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            )}
                            <CheckCircle2 className="h-3 w-3" />
                            {microcopy.buttons.approve}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedStageId(stage.id);
                              setCommentDialogOpen(true);
                            }}
                            className="gap-1"
                          >
                            <MessageSquare className="h-3 w-3" />
                            {microcopy.buttons.iHaveComment}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Already approved badge */}
                    {stage.approved_by_client && (
                      <Badge variant="outline" className="mt-2 text-xs text-success">
                        <CheckCircle2 className="h-3 w-3 ml-1" />
                        אושר על ידך
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>הוספת הערה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="כתוב את ההערה שלך כאן..."
              rows={4}
            />
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setCommentDialogOpen(false)}
                className="flex-1"
              >
                ביטול
              </Button>
              <Button 
                onClick={() => addComment.mutate()}
                disabled={!comment.trim() || addComment.isPending}
                className="flex-1"
              >
                {addComment.isPending && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                שלח הערה
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (isDialog) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader className="sr-only">
        <CardTitle>{microcopy.clientPortal.projectStatus}</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {content}
      </CardContent>
    </Card>
  );
}
