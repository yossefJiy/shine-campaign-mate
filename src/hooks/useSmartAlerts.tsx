import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AlertType = 
  | 'task_overdue' 
  | 'client_delay' 
  | 'payment_overdue' 
  | 'stage_approved' 
  | 'project_stalled' 
  | 'no_income_tasks'
  | 'proposal_approved' 
  | 'proposal_expired' 
  | 'proposal_sent'
  | 'task_assigned'
  | 'task_waiting'
  | 'stage_approval_request'
  | 'retainer_paid'
  | 'work_blocked';

export type AlertPriority = 'low' | 'normal' | 'high' | 'urgent';
export type AlertSeverity = 'info' | 'warn' | 'critical';
export type RecipientType = 'user' | 'client_contact';

export interface SmartAlert {
  id: string;
  to_user_id: string;
  alert_type: AlertType;
  entity_type: string | null;
  entity_id: string | null;
  title: string;
  message: string | null;
  priority: AlertPriority;
  severity: AlertSeverity;
  is_read: boolean;
  created_at: string;
  deliver_by: string | null;
  delivered_at: string | null;
  recipient_type: RecipientType;
  recipient_id: string | null;
  alert_day: string | null;
}

export function useSmartAlerts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const alertsQuery = useQuery({
    queryKey: ["smart-alerts", user?.id],
    queryFn: async (): Promise<SmartAlert[]> => {
      if (!user?.id) return [];

      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from("smart_alerts")
        .select("*")
        .eq("to_user_id", user.id)
        .or(`deliver_by.is.null,deliver_by.lte.${now}`) // Only show if deliver_by is null or past
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as SmartAlert[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60, // 1 minute
  });

  const unreadCount = alertsQuery.data?.filter(a => !a.is_read).length || 0;

  const markAsReadMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from("smart_alerts")
        .update({ is_read: true })
        .eq("id", alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smart-alerts"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;

      const { error } = await supabase
        .from("smart_alerts")
        .update({ is_read: true })
        .eq("to_user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smart-alerts"] });
    },
  });

  return {
    alerts: alertsQuery.data || [],
    unreadCount,
    isLoading: alertsQuery.isLoading,
    error: alertsQuery.error,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    refetch: alertsQuery.refetch,
  };
}
