import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BillingRecord {
  id: string;
  client_id: string;
  agreement_id: string | null;
  period_start: string;
  period_end: string;
  year: number;
  month: number | null;
  base_amount: number;
  commission_amount: number | null;
  additional_amount: number | null;
  total_amount: number;
  amount_billed: number;
  amount_paid: number;
  invoice_id: string | null;
  icount_doc_id: string | null;
  icount_doc_type: string | null;
  icount_doc_url: string | null;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  clients?: {
    id: string;
    name: string;
    logo_url: string | null;
  };
  client_agreements?: {
    id: string;
    service_name: string;
  };
}

export interface BillingStats {
  totalRevenue: number;
  pendingAmount: number;
  overdueAmount: number;
  paidAmount: number;
  recordCount: number;
}

export function useBillingRecords(filters?: {
  clientId?: string;
  year?: number;
  status?: string;
}) {
  const queryClient = useQueryClient();

  const { data: records, isLoading } = useQuery({
    queryKey: ["billing-records", filters],
    queryFn: async () => {
      let query = supabase
        .from("billing_records")
        .select("*, clients(id, name, logo_url), client_agreements(id, service_name)")
        .order("period_start", { ascending: false });

      if (filters?.clientId) {
        query = query.eq("client_id", filters.clientId);
      }
      if (filters?.year) {
        query = query.eq("year", filters.year);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BillingRecord[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["billing-stats", filters?.year],
    queryFn: async () => {
      const year = filters?.year || new Date().getFullYear();
      
      const { data, error } = await supabase
        .from("billing_records")
        .select("total_amount, amount_paid, status")
        .eq("year", year);

      if (error) throw error;

      const stats: BillingStats = {
        totalRevenue: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        paidAmount: 0,
        recordCount: data?.length || 0,
      };

      data?.forEach((record) => {
        stats.totalRevenue += Number(record.total_amount) || 0;
        stats.paidAmount += Number(record.amount_paid) || 0;
        
        const pending = (Number(record.total_amount) || 0) - (Number(record.amount_paid) || 0);
        if (record.status === "overdue") {
          stats.overdueAmount += pending;
        } else if (record.status !== "paid") {
          stats.pendingAmount += pending;
        }
      });

      return stats;
    },
  });

  const createRecord = useMutation({
    mutationFn: async (data: {
      client_id: string;
      period_start: string;
      period_end: string;
      year: number;
      month?: number | null;
      agreement_id?: string | null;
      base_amount?: number;
      commission_amount?: number | null;
      additional_amount?: number | null;
      amount_billed?: number;
      amount_paid?: number;
      status?: string;
      due_date?: string | null;
      notes?: string | null;
    }) => {
      const { data: result, error } = await supabase
        .from("billing_records")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-records"] });
      queryClient.invalidateQueries({ queryKey: ["billing-stats"] });
      toast.success("רשומת חיוב נוצרה בהצלחה");
    },
    onError: (error) => {
      toast.error("שגיאה ביצירת רשומה: " + error.message);
    },
  });

  const updateRecord = useMutation({
    mutationFn: async ({ id, ...data }: Partial<BillingRecord> & { id: string }) => {
      const { error } = await supabase
        .from("billing_records")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-records"] });
      queryClient.invalidateQueries({ queryKey: ["billing-stats"] });
      toast.success("רשומה עודכנה בהצלחה");
    },
    onError: (error) => {
      toast.error("שגיאה בעדכון רשומה: " + error.message);
    },
  });

  const markAsPaid = useMutation({
    mutationFn: async (id: string) => {
      const record = records?.find((r) => r.id === id);
      if (!record) throw new Error("Record not found");

      const { error } = await supabase
        .from("billing_records")
        .update({
          amount_paid: record.total_amount,
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;

      // If this is a retainer payment, the trigger will automatically update project work_state
      // But we should also invalidate projects cache
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-records"] });
      queryClient.invalidateQueries({ queryKey: ["billing-stats"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-detail"] });
      toast.success("סומן כשולם - הפרויקט שוחרר לעבודה");
    },
    onError: (error) => {
      toast.error("שגיאה: " + error.message);
    },
  });

  return {
    records,
    stats,
    isLoading,
    createRecord,
    updateRecord,
    markAsPaid,
  };
}
