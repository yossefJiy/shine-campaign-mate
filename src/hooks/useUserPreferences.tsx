import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface UserPreferences {
  id: string;
  user_id: string;
  email_task_assigned: boolean;
  email_task_due_reminder: boolean;
  email_task_completed: boolean;
  email_daily_summary: boolean;
  email_weekly_report: boolean;
  push_enabled: boolean;
  push_mentions: boolean;
  push_task_updates: boolean;
  reminder_hours_before: number;
  reminder_time: string;
  default_view: 'list' | 'kanban' | 'calendar';
  sidebar_collapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  created_at: string;
  updated_at: string;
}

export function useUserPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading, error } = useQuery({
    queryKey: ["user-preferences", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      // If no preferences exist, create default ones
      if (!data) {
        const { data: newPrefs, error: insertError } = await supabase
          .from("user_preferences")
          .insert({ user_id: user.id })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newPrefs as UserPreferences;
      }
      
      return data as UserPreferences;
    },
    enabled: !!user?.id,
  });

  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<UserPreferences>) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from("user_preferences")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-preferences", user?.id] });
      toast({
        title: "ההעדפות נשמרו",
        description: "השינויים עודכנו בהצלחה",
      });
    },
    onError: (error) => {
      console.error("Error updating preferences:", error);
      toast({
        title: "שגיאה בשמירה",
        description: "לא הצלחנו לשמור את ההעדפות",
        variant: "destructive",
      });
    },
  });

  return { 
    preferences, 
    isLoading, 
    error,
    updatePreferences: updatePreferences.mutate,
    isUpdating: updatePreferences.isPending,
  };
}
