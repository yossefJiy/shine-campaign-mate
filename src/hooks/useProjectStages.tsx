import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type StageStatus = 'pending' | 'in_progress' | 'waiting_client' | 'approved' | 'completed';

export interface ProjectStage {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: StageStatus;
  sort_order: number;
  estimated_hours: number | null;
  actual_hours: number | null;
  estimated_cost: number | null;
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  requires_client_approval: boolean;
  client_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StageComment {
  id: string;
  stage_id: string;
  user_id: string | null;
  contact_id: string | null;
  content: string;
  is_internal: boolean;
  created_at: string;
}

export function useProjectStages(projectId: string | null) {
  const queryClient = useQueryClient();

  const { data: stages = [], isLoading } = useQuery({
    queryKey: ["project-stages", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("project_stages")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      return data as ProjectStage[];
    },
    enabled: !!projectId,
  });

  const createStage = useMutation({
    mutationFn: async (stage: { 
      project_id: string; 
      name: string; 
      description?: string;
      estimated_hours?: number;
      estimated_cost?: number;
      due_date?: string;
      requires_client_approval?: boolean;
    }) => {
      const maxOrder = stages.length > 0 
        ? Math.max(...stages.map(s => s.sort_order)) + 1 
        : 0;

      const { data, error } = await supabase
        .from("project_stages")
        .insert({
          ...stage,
          sort_order: maxOrder,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-stages", projectId] });
      toast.success("שלב נוצר בהצלחה");
    },
    onError: () => toast.error("שגיאה ביצירת שלב"),
  });

  const updateStage = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectStage> & { id: string }) => {
      const updateData: Record<string, unknown> = { ...updates };
      
      // Handle status changes
      if (updates.status === "completed" && !updates.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }
      if (updates.status === "approved" && !updates.approved_at) {
        updateData.approved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("project_stages")
        .update(updateData)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-stages", projectId] });
      toast.success("שלב עודכן");
    },
    onError: () => toast.error("שגיאה בעדכון שלב"),
  });

  const deleteStage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_stages")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-stages", projectId] });
      toast.success("שלב נמחק");
    },
    onError: () => toast.error("שגיאה במחיקת שלב"),
  });

  const reorderStages = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await supabase
          .from("project_stages")
          .update({ sort_order: i })
          .eq("id", orderedIds[i]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-stages", projectId] });
    },
  });

  // Stats
  const completedCount = stages.filter(s => s.status === "completed").length;
  const totalCount = stages.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    stages,
    isLoading,
    createStage,
    updateStage,
    deleteStage,
    reorderStages,
    completedCount,
    totalCount,
    progressPercent,
  };
}

// Hook for stage comments
export function useStageComments(stageId: string | null) {
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["stage-comments", stageId],
    queryFn: async () => {
      if (!stageId) return [];
      
      const { data, error } = await supabase
        .from("stage_comments")
        .select("*")
        .eq("stage_id", stageId)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data as StageComment[];
    },
    enabled: !!stageId,
  });

  const addComment = useMutation({
    mutationFn: async (comment: { stage_id: string; content: string; is_internal?: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("stage_comments")
        .insert({
          ...comment,
          user_id: user?.id,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stage-comments", stageId] });
      toast.success("תגובה נוספה");
    },
    onError: () => toast.error("שגיאה בהוספת תגובה"),
  });

  return { comments, isLoading, addComment };
}
