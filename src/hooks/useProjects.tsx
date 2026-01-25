import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useProjectMutations() {
  const queryClient = useQueryClient();

  // Create project
  const createProject = useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      client_id: string;
      status?: string;
      template_type?: string;
      start_date?: string;
      target_date?: string;
    }) => {
      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          ...data,
          status: data.status || "active",
          last_activity_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("פרויקט נוצר בהצלחה");
    },
    onError: (error: Error) => {
      toast.error("שגיאה ביצירת פרויקט: " + error.message);
    },
  });

  // Update project
  const updateProject = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { error } = await supabase
        .from("projects")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-detail"] });
      toast.success("פרויקט עודכן");
    },
    onError: (error: Error) => {
      toast.error("שגיאה בעדכון פרויקט: " + error.message);
    },
  });

  // Delete project (only if no completed work)
  const deleteProject = useMutation({
    mutationFn: async (projectId: string) => {
      // Check if project has completed tasks
      const { data: completedTasks } = await supabase
        .from("tasks")
        .select("id")
        .eq("project_id", projectId)
        .eq("status", "completed")
        .limit(1);

      if (completedTasks && completedTasks.length > 0) {
        throw new Error("לא ניתן למחוק פרויקט עם משימות שהושלמו");
      }

      // Delete related data first
      await supabase.from("project_notes").delete().eq("project_id", projectId);
      await supabase.from("tasks").delete().eq("project_id", projectId);
      await supabase.from("project_stages").delete().eq("project_id", projectId);

      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("פרויקט נמחק");
    },
    onError: (error: Error) => {
      toast.error(error.message || "שגיאה במחיקת פרויקט");
    },
  });

  // Duplicate project (with stages, without tasks)
  const duplicateProject = useMutation({
    mutationFn: async (projectId: string) => {
      // Get original project
      const { data: original, error: fetchError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (fetchError || !original) throw new Error("פרויקט לא נמצא");

      // Create new project
      const { data: newProject, error: createError } = await supabase
        .from("projects")
        .insert({
          name: `${original.name} (עותק)`,
          description: original.description,
          client_id: original.client_id,
          status: "active",
          work_state: "work_ok",
          last_activity_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError || !newProject) throw createError;

      // Copy stages
      const { data: stages } = await supabase
        .from("project_stages")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order");

      if (stages && stages.length > 0) {
        for (const stage of stages) {
          await supabase.from("project_stages").insert({
            project_id: newProject.id,
            name: stage.name,
            description: stage.description,
            sort_order: stage.sort_order,
            status: "pending",
            requires_client_approval: stage.requires_client_approval,
          });
        }
      }

      return newProject;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("פרויקט שוכפל", {
        description: `הפרויקט "${project.name}" נוצר`,
      });
    },
    onError: (error: Error) => {
      toast.error("שגיאה בשכפול פרויקט: " + error.message);
    },
  });

  // Archive project (soft delete alternative)
  const archiveProject = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from("projects")
        .update({ status: "archived" })
        .eq("id", projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("פרויקט הועבר לארכיון");
    },
    onError: (error: Error) => {
      toast.error("שגיאה: " + error.message);
    },
  });

  return {
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
    archiveProject,
  };
}
