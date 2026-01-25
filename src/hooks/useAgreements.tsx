import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ClientAgreement {
  id: string;
  client_id: string;
  service_name: string;
  service_description: string | null;
  category: string;
  base_price: number;
  currency: string;
  billing_cycle: string;
  commission_percent: number | null;
  commission_base: string | null;
  start_date: string;
  end_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  clients?: {
    id: string;
    name: string;
    logo_url: string | null;
  };
}

export interface CreateAgreementData {
  client_id: string;
  service_name: string;
  service_description?: string;
  category?: string;
  base_price: number;
  currency?: string;
  billing_cycle?: string;
  commission_percent?: number;
  commission_base?: string;
  start_date: string;
  end_date?: string;
  status?: string;
  notes?: string;
}

export function useAgreements(clientId?: string) {
  const queryClient = useQueryClient();

  const { data: agreements, isLoading } = useQuery({
    queryKey: ["client-agreements", clientId],
    queryFn: async () => {
      let query = supabase
        .from("client_agreements")
        .select("*, clients(id, name, logo_url)")
        .order("start_date", { ascending: false });

      if (clientId) {
        query = query.eq("client_id", clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ClientAgreement[];
    },
  });

  const createAgreement = useMutation({
    mutationFn: async (data: CreateAgreementData) => {
      const { data: result, error } = await supabase
        .from("client_agreements")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-agreements"] });
      toast.success("הסכם נוצר בהצלחה");
    },
    onError: (error) => {
      toast.error("שגיאה ביצירת הסכם: " + error.message);
    },
  });

  const updateAgreement = useMutation({
    mutationFn: async ({ id, ...data }: Partial<ClientAgreement> & { id: string }) => {
      const { error } = await supabase
        .from("client_agreements")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-agreements"] });
      toast.success("הסכם עודכן בהצלחה");
    },
    onError: (error) => {
      toast.error("שגיאה בעדכון הסכם: " + error.message);
    },
  });

  const deleteAgreement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("client_agreements")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-agreements"] });
      toast.success("הסכם נמחק בהצלחה");
    },
    onError: (error) => {
      toast.error("שגיאה במחיקת הסכם: " + error.message);
    },
  });

  // Calculate total expected revenue for a period
  const calculatePeriodTotal = (year: number, month?: number) => {
    if (!agreements) return 0;

    return agreements
      .filter((a) => a.status === "active")
      .reduce((total, agreement) => {
        const startDate = new Date(agreement.start_date);
        const endDate = agreement.end_date ? new Date(agreement.end_date) : null;
        const periodDate = new Date(year, month ? month - 1 : 0);

        // Check if agreement is active in this period
        if (startDate > periodDate) return total;
        if (endDate && endDate < periodDate) return total;

        // Calculate based on billing cycle
        let amount = agreement.base_price;
        if (agreement.billing_cycle === "yearly" && month) {
          amount = agreement.base_price / 12;
        } else if (agreement.billing_cycle === "quarterly" && month) {
          amount = agreement.base_price / 3;
        }

        return total + amount;
      }, 0);
  };

  return {
    agreements,
    isLoading,
    createAgreement,
    updateAgreement,
    deleteAgreement,
    calculatePeriodTotal,
  };
}
