import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AgencySettings {
  id: string;
  timezone: string;
  work_hours_start: string;
  work_hours_end: string;
  work_days: number[];
  client_delay_threshold_days: number;
  project_stalled_threshold_days: number;
  payment_overdue_grace_days: number;
  created_at: string;
  updated_at: string;
}

export function useAgencySettings() {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ["agency-settings"],
    queryFn: async (): Promise<AgencySettings | null> => {
      const { data, error } = await supabase
        .from("agency_settings")
        .select("*")
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, return null
          return null;
        }
        throw error;
      }
      return data as AgencySettings;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<AgencySettings>) => {
      const { data: existing } = await supabase
        .from("agency_settings")
        .select("id")
        .limit(1)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("agency_settings")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("agency_settings")
          .insert(updates);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-settings"] });
      toast.success("הגדרות הסוכנות נשמרו");
    },
    onError: (error) => {
      toast.error("שגיאה בשמירת ההגדרות");
      console.error("Error updating agency settings:", error);
    },
  });

  return {
    settings: settingsQuery.data,
    isLoading: settingsQuery.isLoading,
    error: settingsQuery.error,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}
