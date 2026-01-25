import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Invoice {
  id: string;
  client_id: string;
  invoice_number: string;
  type: 'invoice' | 'receipt' | 'proforma' | 'credit_note';
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  paid_at: string | null;
  payment_method: string | null;
  notes: string | null;
  terms: string | null;
  created_at: string;
  clients?: { name: string; logo_url: string | null };
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  service_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  total: number;
  sort_order: number;
}

export interface Quote {
  id: string;
  client_id: string | null;
  lead_id: string | null;
  quote_number: string;
  title: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
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
  notes: string | null;
  terms: string | null;
  created_at: string;
  clients?: { name: string } | null;
  leads?: { name: string } | null;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  service_id: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  total: number;
  is_optional: boolean;
  is_selected: boolean;
  sort_order: number;
}

export interface ClientService {
  id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  price: number;
  billing_cycle: 'one-time' | 'monthly' | 'quarterly' | 'yearly';
  is_active: boolean;
  category: string | null;
}

export function useBilling(clientId?: string) {
  const queryClient = useQueryClient();

  // Fetch invoices
  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["invoices", clientId],
    queryFn: async () => {
      let query = supabase
        .from("invoices")
        .select("*, clients(name, logo_url)")
        .order("created_at", { ascending: false });
      
      if (clientId) {
        query = query.eq("client_id", clientId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Invoice[];
    },
  });

  // Fetch quotes
  const { data: quotes = [], isLoading: isLoadingQuotes } = useQuery({
    queryKey: ["quotes", clientId],
    queryFn: async () => {
      let query = supabase
        .from("quotes")
        .select("*, clients(name), leads(name)")
        .order("created_at", { ascending: false });
      
      if (clientId) {
        query = query.eq("client_id", clientId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Quote[];
    },
  });

  // Fetch services
  const { data: services = [], isLoading: isLoadingServices } = useQuery({
    queryKey: ["client-services", clientId],
    queryFn: async () => {
      let query = supabase
        .from("client_services")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      
      if (clientId) {
        query = query.or(`client_id.is.null,client_id.eq.${clientId}`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ClientService[];
    },
  });

  // Generate invoice number
  const generateInvoiceNumber = async () => {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .gte("created_at", `${year}-01-01`);
    
    return `INV-${year}-${String((count || 0) + 1).padStart(4, "0")}`;
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

  // Create invoice
  const createInvoiceMutation = useMutation({
    mutationFn: async (invoice: Partial<Invoice> & { items?: Partial<InvoiceItem>[] }) => {
      const invoiceNumber = await generateInvoiceNumber();
      
      const { data, error } = await supabase
        .from("invoices")
        .insert({
          client_id: invoice.client_id,
          invoice_number: invoiceNumber,
          type: invoice.type || "invoice",
          status: "draft",
          issue_date: invoice.issue_date || new Date().toISOString().split("T")[0],
          due_date: invoice.due_date,
          subtotal: invoice.subtotal || 0,
          tax_rate: invoice.tax_rate || 18,
          tax_amount: invoice.tax_amount || 0,
          total_amount: invoice.total_amount || 0,
          notes: invoice.notes,
          terms: invoice.terms,
        })
        .select()
        .single();
      
      if (error) throw error;

      // Add items
      if (invoice.items && invoice.items.length > 0) {
        const items = invoice.items.map((item, i) => ({
          invoice_id: data.id,
          description: item.description || "",
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          discount_percent: item.discount_percent || 0,
          total: item.total || 0,
          sort_order: i,
        }));

        await supabase.from("invoice_items").insert(items);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("חשבונית נוצרה בהצלחה");
    },
    onError: (error) => {
      toast.error("שגיאה ביצירת חשבונית");
      console.error(error);
    },
  });

  // Create quote
  const createQuoteMutation = useMutation({
    mutationFn: async (quote: Partial<Quote> & { items?: Partial<QuoteItem>[] }) => {
      const quoteNumber = await generateQuoteNumber();
      const publicToken = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from("quotes")
        .insert({
          client_id: quote.client_id,
          lead_id: quote.lead_id,
          quote_number: quoteNumber,
          title: quote.title || "הצעת מחיר",
          status: "draft",
          valid_until: quote.valid_until,
          subtotal: quote.subtotal || 0,
          discount_percent: quote.discount_percent || 0,
          discount_amount: quote.discount_amount || 0,
          tax_rate: quote.tax_rate || 18,
          tax_amount: quote.tax_amount || 0,
          total_amount: quote.total_amount || 0,
          public_token: publicToken,
          notes: quote.notes,
          terms: quote.terms,
        })
        .select()
        .single();
      
      if (error) throw error;

      // Add items
      if (quote.items && quote.items.length > 0) {
        const items = quote.items.map((item, i) => ({
          quote_id: data.id,
          name: item.name || "",
          description: item.description,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          discount_percent: item.discount_percent || 0,
          total: item.total || 0,
          is_optional: item.is_optional || false,
          is_selected: item.is_selected ?? true,
          sort_order: i,
        }));

        await supabase.from("quote_items").insert(items);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("הצעת מחיר נוצרה בהצלחה");
    },
    onError: (error) => {
      toast.error("שגיאה ביצירת הצעת מחיר");
      console.error(error);
    },
  });

  // Update invoice status
  const updateInvoiceStatusMutation = useMutation({
    mutationFn: async ({ id, status, paidAmount, paymentMethod }: { 
      id: string; 
      status: Invoice["status"]; 
      paidAmount?: number;
      paymentMethod?: string;
    }) => {
      const updates: Partial<Invoice> = { status };
      
      if (status === "paid") {
        updates.paid_at = new Date().toISOString();
        updates.paid_amount = paidAmount;
        updates.payment_method = paymentMethod;
      }

      const { error } = await supabase
        .from("invoices")
        .update(updates)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("סטטוס עודכן");
    },
  });

  // Update quote status
  const updateQuoteStatusMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }: { 
      id: string; 
      status: Quote["status"]; 
      rejectionReason?: string;
    }) => {
      const updates: Partial<Quote> = { status };
      
      if (status === "accepted") {
        updates.accepted_at = new Date().toISOString();
      } else if (status === "rejected") {
        updates.rejected_at = new Date().toISOString();
        updates.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from("quotes")
        .update(updates)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("סטטוס עודכן");
    },
  });

  // Stats
  const stats = {
    totalInvoices: invoices.length,
    totalPaid: invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + i.total_amount, 0),
    totalPending: invoices.filter(i => ["draft", "sent", "viewed"].includes(i.status)).reduce((sum, i) => sum + i.total_amount, 0),
    totalOverdue: invoices.filter(i => i.status === "overdue").reduce((sum, i) => sum + i.total_amount, 0),
    quotesAccepted: quotes.filter(q => q.status === "accepted").length,
    quotesPending: quotes.filter(q => ["draft", "sent", "viewed"].includes(q.status)).length,
  };

  return {
    invoices,
    quotes,
    services,
    stats,
    isLoading: isLoadingInvoices || isLoadingQuotes || isLoadingServices,
    createInvoice: createInvoiceMutation.mutate,
    createQuote: createQuoteMutation.mutate,
    updateInvoiceStatus: updateInvoiceStatusMutation.mutate,
    updateQuoteStatus: updateQuoteStatusMutation.mutate,
  };
}
