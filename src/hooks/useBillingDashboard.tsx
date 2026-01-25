import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MonthlyBillingView {
  clientId: string;
  clientName: string;
  year: number;
  month: number;
  // Billing record
  billingRecordId?: string;
  invoiceSent: boolean;
  invoiceStatus?: string;
  amountBilled: number;
  amountPaid: number;
  amountWithVat: number;
  dueDate?: string;
  // Commission
  commissionId?: string;
  expectedCommission: number;
  collectedCommission: number;
  commissionStatus?: string;
  adSpend: number;
  commissionPercent: number;
  // Goals
  revenueTarget: number;
  commissionTarget: number;
  // iCount
  icountDocId?: string;
  icountDocUrl?: string;
}

interface BillingGoal {
  id: string;
  client_id: string | null;
  year: number;
  month: number | null;
  revenue_target: number;
  commission_target: number;
  notes: string | null;
}

interface CommissionCollection {
  id: string;
  client_id: string;
  year: number;
  month: number;
  expected_amount: number;
  collected_amount: number;
  commission_percent: number | null;
  ad_spend: number;
  status: string;
  collected_at: string | null;
  icount_doc_id: string | null;
  icount_doc_url: string | null;
  notes: string | null;
}

export function useBillingDashboard(year: number, month?: number) {
  const queryClient = useQueryClient();

  // Fetch monthly billing data
  const { data: billingData, isLoading } = useQuery({
    queryKey: ["billing-dashboard", year, month],
    queryFn: async () => {
      // Get active clients
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("id, name, jiy_commission_percent, is_master_account")
        .eq("is_active", true)
        .eq("is_master_account", false)
        .order("name");

      if (clientsError) throw clientsError;

      // Get billing records for the period
      const billingQuery = supabase
        .from("billing_records")
        .select("*")
        .eq("year", year);
      
      if (month) {
        billingQuery.eq("month", month);
      }
      
      const { data: billingRecords, error: billingError } = await billingQuery;
      if (billingError) throw billingError;

      // Get commission collections
      const commissionQuery = supabase
        .from("commission_collections")
        .select("*")
        .eq("year", year);
      
      if (month) {
        commissionQuery.eq("month", month);
      }
      
      const { data: commissions, error: commError } = await commissionQuery;
      if (commError) throw commError;

      // Get billing goals
      const goalsQuery = supabase
        .from("billing_goals")
        .select("*")
        .eq("year", year);
      
      if (month) {
        goalsQuery.eq("month", month);
      }
      
      const { data: goals, error: goalsError } = await goalsQuery;
      if (goalsError) throw goalsError;

      // Build the view
      const VAT_RATE = 1.18;
      const monthsToProcess = month ? [month] : Array.from({ length: 12 }, (_, i) => i + 1);
      const result: MonthlyBillingView[] = [];

      for (const client of clients || []) {
        for (const m of monthsToProcess) {
          const billing = (billingRecords || []).find(
            (b) => b.client_id === client.id && b.month === m
          );
          const commission = (commissions || []).find(
            (c) => c.client_id === client.id && c.month === m
          );
          const goal = (goals || []).find(
            (g) => g.client_id === client.id && g.month === m
          );
          const agencyGoal = (goals || []).find(
            (g) => g.client_id === null && g.month === m
          );

          result.push({
            clientId: client.id,
            clientName: client.name,
            year,
            month: m,
            // Billing
            billingRecordId: billing?.id,
            invoiceSent: !!billing?.icount_doc_id,
            invoiceStatus: billing?.status || "pending",
            amountBilled: billing?.amount_billed || 0,
            amountPaid: billing?.amount_paid || 0,
            amountWithVat: (billing?.total_amount || 0) * VAT_RATE,
            dueDate: billing?.due_date,
            // Commission
            commissionId: commission?.id,
            expectedCommission: commission?.expected_amount || 0,
            collectedCommission: commission?.collected_amount || 0,
            commissionStatus: commission?.status || "pending",
            adSpend: commission?.ad_spend || 0,
            commissionPercent: commission?.commission_percent || client.jiy_commission_percent || 0,
            // Goals
            revenueTarget: goal?.revenue_target || 0,
            commissionTarget: goal?.commission_target || 0,
            // iCount
            icountDocId: billing?.icount_doc_id || commission?.icount_doc_id,
            icountDocUrl: billing?.icount_doc_url || commission?.icount_doc_url,
          });
        }
      }

      return result;
    },
  });

  // Agency-wide goals
  const { data: agencyGoals } = useQuery({
    queryKey: ["agency-goals", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("billing_goals")
        .select("*")
        .is("client_id", null)
        .eq("year", year);
      
      if (error) throw error;
      return data as BillingGoal[];
    },
  });

  // Update commission collection
  const updateCommission = useMutation({
    mutationFn: async (data: Partial<CommissionCollection> & { client_id: string; year: number; month: number }) => {
      const { data: existing } = await supabase
        .from("commission_collections")
        .select("id")
        .eq("client_id", data.client_id)
        .eq("year", data.year)
        .eq("month", data.month)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("commission_collections")
          .update(data)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("commission_collections")
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-dashboard"] });
    },
  });

  // Update billing goal
  const updateGoal = useMutation({
    mutationFn: async (data: { client_id: string | null; year: number; month: number; revenue_target?: number; commission_target?: number }) => {
      let existingQuery = supabase
        .from("billing_goals")
        .select("id")
        .eq("year", data.year)
        .eq("month", data.month);
      
      if (data.client_id === null) {
        existingQuery = existingQuery.is("client_id", null);
      } else {
        existingQuery = existingQuery.eq("client_id", data.client_id);
      }
      
      const { data: existing } = await existingQuery.maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("billing_goals")
          .update(data)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("billing_goals")
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["agency-goals"] });
    },
  });

  // Calculate totals
  const totals = billingData?.reduce(
    (acc, item) => ({
      totalBilled: acc.totalBilled + item.amountBilled,
      totalPaid: acc.totalPaid + item.amountPaid,
      totalWithVat: acc.totalWithVat + item.amountWithVat,
      totalExpectedCommission: acc.totalExpectedCommission + item.expectedCommission,
      totalCollectedCommission: acc.totalCollectedCommission + item.collectedCommission,
    }),
    { totalBilled: 0, totalPaid: 0, totalWithVat: 0, totalExpectedCommission: 0, totalCollectedCommission: 0 }
  );

  return {
    billingData,
    agencyGoals,
    totals,
    isLoading,
    updateCommission,
    updateGoal,
  };
}
