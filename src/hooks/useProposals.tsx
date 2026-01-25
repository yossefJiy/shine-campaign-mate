import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProposalTemplates, ProposalTemplate, StageTemplate } from "./useProposalTemplates";

export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'cancelled_after_approval';

export interface ProposalItem {
  id?: string;
  quote_id?: string;
  name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  total: number;
  is_optional: boolean;
  is_selected: boolean;
  creates_stage: boolean;
  stage_name?: string;
  task_tag?: 'income_generating' | 'operational' | 'client_dependent';
  sort_order: number;
}

export interface Proposal {
  id: string;
  client_id: string | null;
  lead_id: string | null;
  quote_number: string;
  title: string;
  status: ProposalStatus;
  valid_until: string | null;
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  accepted_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  public_token: string | null;
  client_view_token?: string | null;
  client_confirmed_terms?: boolean;
  version?: number;
  parent_quote_id?: string | null;
  notes: string | null;
  terms: string | null;
  payment_model?: 'retainer' | 'retainer_plus_percentage' | 'one_time';
  retainer_amount?: number;
  percentage_rate?: number;
  template_id?: string;
  created_at: string;
  updated_at?: string;
  clients?: { id: string; name: string } | null;
  leads?: { id: string; name: string } | null;
  items?: ProposalItem[];
}

export interface CreateProposalDTO {
  client_id?: string;
  lead_id?: string;
  title: string;
  template_id?: string;
  valid_until?: string;
  subtotal: number;
  discount_percent?: number;
  discount_amount?: number;
  tax_rate?: number;
  tax_amount?: number;
  total_amount: number;
  notes?: string;
  terms?: string;
  payment_model?: 'retainer' | 'retainer_plus_percentage' | 'one_time';
  retainer_amount?: number;
  percentage_rate?: number;
  items: Omit<ProposalItem, 'id' | 'quote_id'>[];
}

// Status configuration
export const proposalStatusConfig: Record<ProposalStatus, { 
  label: string; 
  color: string;
  bgColor: string;
}> = {
  draft: { 
    label: "טיוטה", 
    color: "text-muted-foreground",
    bgColor: "bg-muted"
  },
  sent: { 
    label: "נשלחה", 
    color: "text-info",
    bgColor: "bg-info/10"
  },
  viewed: { 
    label: "נצפתה", 
    color: "text-info",
    bgColor: "bg-info/10"
  },
  accepted: { 
    label: "אושרה", 
    color: "text-success",
    bgColor: "bg-success/10"
  },
  rejected: { 
    label: "נדחתה", 
    color: "text-destructive",
    bgColor: "bg-destructive/10"
  },
  expired: { 
    label: "פגה תוקף", 
    color: "text-warning",
    bgColor: "bg-warning/10"
  },
  cancelled_after_approval: { 
    label: "בוטלה לאחר אישור", 
    color: "text-destructive",
    bgColor: "bg-destructive/10"
  },
};

export function useProposals(clientId?: string) {
  const queryClient = useQueryClient();
  const { templates } = useProposalTemplates();

  // Fetch proposals (quotes)
  const proposalsQuery = useQuery({
    queryKey: ["proposals", clientId],
    queryFn: async (): Promise<Proposal[]> => {
      let query = supabase
        .from("quotes")
        .select("*, clients(id, name), leads(id, name)")
        .order("created_at", { ascending: false });

      if (clientId) {
        query = query.eq("client_id", clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as Proposal[];
    },
  });

  // Fetch single proposal with items
  const fetchProposalWithItems = async (proposalId: string): Promise<Proposal | null> => {
    const { data: proposal, error: proposalError } = await supabase
      .from("quotes")
      .select("*, clients(id, name), leads(id, name)")
      .eq("id", proposalId)
      .single();

    if (proposalError) throw proposalError;
    if (!proposal) return null;

    const { data: items, error: itemsError } = await supabase
      .from("quote_items")
      .select("*")
      .eq("quote_id", proposalId)
      .order("sort_order");

    if (itemsError) throw itemsError;

    return {
      ...proposal,
      items: (items || []).map(item => ({
        ...item,
        creates_stage: true, // Default
      })),
    } as unknown as Proposal;
  };

  // Generate quote number
  const generateQuoteNumber = async () => {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from("quotes")
      .select("*", { count: "exact", head: true })
      .gte("created_at", `${year}-01-01`);

    return `QT-${year}-${String((count || 0) + 1).padStart(4, "0")}`;
  };

  // Create proposal
  const createProposalMutation = useMutation({
    mutationFn: async (dto: CreateProposalDTO) => {
      if (!dto.client_id && !dto.lead_id) {
        throw new Error("יש לבחור לקוח או ליד");
      }

      const quoteNumber = await generateQuoteNumber();
      const publicToken = crypto.randomUUID();
      const clientViewToken = crypto.randomUUID();

      const { data: proposal, error: proposalError } = await supabase
        .from("quotes")
        .insert({
          client_id: dto.client_id || null,
          lead_id: dto.lead_id || null,
          quote_number: quoteNumber,
          title: dto.title,
          status: "draft",
          valid_until: dto.valid_until || null,
          subtotal: dto.subtotal,
          discount_percent: dto.discount_percent || 0,
          discount_amount: dto.discount_amount || 0,
          tax_rate: dto.tax_rate || 18,
          tax_amount: dto.tax_amount || 0,
          total_amount: dto.total_amount,
          public_token: publicToken,
          client_view_token: clientViewToken,
          notes: dto.notes || null,
          terms: dto.terms || null,
        })
        .select()
        .single();

      if (proposalError) throw proposalError;

      // Insert items
      if (dto.items && dto.items.length > 0) {
        const items = dto.items.map((item, i) => ({
          quote_id: proposal.id,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percent: item.discount_percent || 0,
          total: item.total,
          is_optional: item.is_optional || false,
          is_selected: item.is_selected ?? true,
          sort_order: i,
        }));

        const { error: itemsError } = await supabase.from("quote_items").insert(items);
        if (itemsError) throw itemsError;
      }

      return proposal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast.success("הצעה נוצרה בהצלחה");
    },
    onError: (error: Error) => {
      toast.error("שגיאה ביצירת הצעה: " + error.message);
    },
  });

  // Update proposal
  const updateProposalMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Proposal> & { id: string }) => {
      const { error } = await supabase
        .from("quotes")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast.success("הצעה עודכנה");
    },
  });

  // Send proposal to client
  const sendProposalMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      const { error } = await supabase
        .from("quotes")
        .update({ 
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", proposalId);

      if (error) throw error;

      // TODO: Trigger email/SMS notification to client
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast.success("ההצעה נשלחה ללקוח", {
        description: "הלקוח יקבל הודעה לצפייה ואישור",
      });
    },
  });

  // Approve proposal (creates project automatically)
  const approveProposalMutation = useMutation({
    mutationFn: async ({ 
      proposalId, 
      confirmedTerms = true 
    }: { 
      proposalId: string; 
      confirmedTerms?: boolean;
    }) => {
      // Get proposal with items
      const proposal = await fetchProposalWithItems(proposalId);
      if (!proposal) throw new Error("הצעה לא נמצאה");

      if (!proposal.client_id) {
        throw new Error("לא ניתן לאשר הצעה ללא לקוח מקושר");
      }

      // Update proposal status
      const { error: updateError } = await supabase
        .from("quotes")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
          client_confirmed_terms: confirmedTerms,
        })
        .eq("id", proposalId);

      if (updateError) throw updateError;

      // Create project with work_state blocked until payment
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          client_id: proposal.client_id,
          name: proposal.title,
          status: "waiting_payment",
          quote_id: proposalId,
          work_state: "blocked_payment",
          payment_status: "pending",
          monthly_retainer_amount: proposal.total_amount,
          retainer_plan: proposal.total_amount >= 4350 ? "package_4350" : "standard",
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Create stages from items that create_stage
      const stageItems = (proposal.items || []).filter(item => 
        item.creates_stage && item.is_selected
      );

      for (let i = 0; i < stageItems.length; i++) {
        const item = stageItems[i];
        
        const { data: stage, error: stageError } = await supabase
          .from("project_stages")
          .insert({
            project_id: project.id,
            name: item.stage_name || item.name,
            sort_order: i,
            status: i === 0 ? "in_progress" : "pending",
            client_approval_required: true,
          })
          .select()
          .single();

        if (stageError) throw stageError;

        // Create default task for this stage
        const { error: taskError } = await supabase
          .from("tasks")
          .insert({
            client_id: proposal.client_id,
            project_id: project.id,
            stage_id: stage.id,
            title: item.name,
            task_tag: item.task_tag || "income_generating",
            status: "not_started",
            priority: "medium",
          });

        if (taskError) throw taskError;
      }

      // Create retainer payment linked to project
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days
      
      const { error: paymentError } = await supabase
        .from("billing_records")
        .insert({
          client_id: proposal.client_id,
          project_id: project.id,
          period_start: new Date().toISOString().split("T")[0],
          period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          base_amount: proposal.total_amount,
          total_amount: proposal.total_amount,
          status: "pending",
          payment_type: "retainer",
          due_date: dueDate.toISOString().split("T")[0],
          notes: `ריטיינר עבור: ${proposal.title}`,
        });

      if (paymentError) console.error("Payment creation error:", paymentError);

      return { proposal, project };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["billing-records"] });

      toast.success("הצעה אושרה — הפרויקט נפתח", {
        description: `הפרויקט "${data.project.name}" נוצר אוטומטית`,
      });
    },
    onError: (error: Error) => {
      toast.error("שגיאה באישור הצעה: " + error.message);
    },
  });

  // Reject proposal
  const rejectProposalMutation = useMutation({
    mutationFn: async ({ 
      proposalId, 
      reason 
    }: { 
      proposalId: string; 
      reason?: string;
    }) => {
      const { error } = await supabase
        .from("quotes")
        .update({
          status: "rejected",
          rejected_at: new Date().toISOString(),
          rejection_reason: reason || null,
        })
        .eq("id", proposalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast.info("הצעה נדחתה");
    },
  });

  // Duplicate proposal (for versioning)
  const duplicateProposalMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      const original = await fetchProposalWithItems(proposalId);
      if (!original) throw new Error("הצעה לא נמצאה");

      const newDto: CreateProposalDTO = {
        client_id: original.client_id || undefined,
        lead_id: original.lead_id || undefined,
        title: `${original.title} (עותק)`,
        valid_until: original.valid_until || undefined,
        subtotal: original.subtotal,
        discount_percent: original.discount_percent,
        discount_amount: original.discount_amount,
        tax_rate: original.tax_rate,
        tax_amount: original.tax_amount,
        total_amount: original.total_amount,
        notes: original.notes || undefined,
        terms: original.terms || undefined,
        items: (original.items || []).map(({ id, quote_id, ...item }) => item),
      };

      return createProposalMutation.mutateAsync(newDto);
    },
    onSuccess: () => {
      toast.success("הצעה שוכפלה");
    },
  });

  // Delete proposal
  const deleteProposalMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      // First delete items
      await supabase.from("quote_items").delete().eq("quote_id", proposalId);
      
      // Then delete proposal
      const { error } = await supabase
        .from("quotes")
        .delete()
        .eq("id", proposalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast.success("הצעה נמחקה");
    },
  });

  // Stats
  const stats = {
    total: proposalsQuery.data?.length || 0,
    drafts: proposalsQuery.data?.filter(p => p.status === "draft").length || 0,
    sent: proposalsQuery.data?.filter(p => p.status === "sent" || p.status === "viewed").length || 0,
    accepted: proposalsQuery.data?.filter(p => p.status === "accepted").length || 0,
    rejected: proposalsQuery.data?.filter(p => p.status === "rejected").length || 0,
    totalValue: proposalsQuery.data?.reduce((sum, p) => sum + p.total_amount, 0) || 0,
    acceptedValue: proposalsQuery.data?.filter(p => p.status === "accepted").reduce((sum, p) => sum + p.total_amount, 0) || 0,
  };

  return {
    proposals: proposalsQuery.data || [],
    isLoading: proposalsQuery.isLoading,
    error: proposalsQuery.error,
    stats,
    templates,
    fetchProposalWithItems,
    createProposal: createProposalMutation.mutate,
    createProposalAsync: createProposalMutation.mutateAsync,
    updateProposal: updateProposalMutation.mutate,
    sendProposal: sendProposalMutation.mutate,
    approveProposal: approveProposalMutation.mutate,
    rejectProposal: rejectProposalMutation.mutate,
    duplicateProposal: duplicateProposalMutation.mutate,
    deleteProposal: deleteProposalMutation.mutate,
    isCreating: createProposalMutation.isPending,
    isSending: sendProposalMutation.isPending,
    isApproving: approveProposalMutation.isPending,
  };
}
