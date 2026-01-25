import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PerformanceFee {
  id: string;
  project_id: string;
  client_id: string;
  month: number;
  year: number;
  revenue_reported: number;
  percentage: number;
  calculated_fee: number;
  status: "pending" | "invoiced" | "paid";
  reported_at: string | null;
  invoiced_at: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
}

export function usePerformanceFees(projectId?: string, clientId?: string) {
  return useQuery({
    queryKey: ["performance-fees", projectId, clientId],
    queryFn: async () => {
      let query = supabase
        .from("performance_fees")
        .select(`
          *,
          projects(name),
          clients(name)
        `)
        .order("year", { ascending: false })
        .order("month", { ascending: false });

      if (projectId) {
        query = query.eq("project_id", projectId);
      }
      if (clientId) {
        query = query.eq("client_id", clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as (PerformanceFee & { projects: { name: string }; clients: { name: string } })[];
    },
  });
}

export function useReportRevenue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      clientId,
      month,
      year,
      revenue,
      percentage,
    }: {
      projectId: string;
      clientId: string;
      month: number;
      year: number;
      revenue: number;
      percentage: number;
    }) => {
      const { data, error } = await supabase
        .from("performance_fees")
        .upsert(
          {
            project_id: projectId,
            client_id: clientId,
            month,
            year,
            revenue_reported: revenue,
            percentage,
            reported_at: new Date().toISOString(),
            status: "pending",
          },
          { onConflict: "project_id,month,year" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-fees"] });
      toast.success("המחזור דווח בהצלחה");
    },
    onError: () => {
      toast.error("שגיאה בדיווח המחזור");
    },
  });
}

export function useUpdateFeeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      feeId,
      status,
    }: {
      feeId: string;
      status: "pending" | "invoiced" | "paid";
    }) => {
      const updates: Record<string, unknown> = { status };
      
      if (status === "invoiced") {
        updates.invoiced_at = new Date().toISOString();
      } else if (status === "paid") {
        updates.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("performance_fees")
        .update(updates)
        .eq("id", feeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-fees"] });
      toast.success("הסטטוס עודכן");
    },
    onError: () => {
      toast.error("שגיאה בעדכון הסטטוס");
    },
  });
}
