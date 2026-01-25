-- Create client_agreements table for service contracts
CREATE TABLE public.client_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Service details
  service_name TEXT NOT NULL,
  service_description TEXT,
  category TEXT DEFAULT 'retainer', -- 'retainer', 'project', 'commission', 'media', 'custom'
  
  -- Pricing
  base_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'ILS',
  billing_cycle TEXT DEFAULT 'monthly', -- 'one-time', 'monthly', 'quarterly', 'yearly'
  
  -- Commission/percentage
  commission_percent NUMERIC(5,2),
  commission_base TEXT, -- 'media_spend', 'revenue', 'profit'
  
  -- Period
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  
  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'paused', 'ended', 'pending'
  
  -- Meta
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create billing_records table for tracking invoices and payments
CREATE TABLE public.billing_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  agreement_id UUID REFERENCES public.client_agreements(id) ON DELETE SET NULL,
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  month INTEGER,
  
  -- Amounts
  base_amount NUMERIC(12,2) DEFAULT 0,
  commission_amount NUMERIC(12,2) DEFAULT 0,
  additional_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) GENERATED ALWAYS AS (base_amount + COALESCE(commission_amount, 0) + COALESCE(additional_amount, 0)) STORED,
  
  -- Collection
  amount_billed NUMERIC(12,2) DEFAULT 0,
  amount_paid NUMERIC(12,2) DEFAULT 0,
  
  -- iCount integration
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  icount_doc_id TEXT,
  icount_doc_type TEXT,
  icount_doc_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'invoiced', 'partial', 'paid', 'overdue'
  due_date DATE,
  paid_at TIMESTAMPTZ,
  
  -- Meta
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_agreements
CREATE POLICY "Admins can manage all agreements"
  ON public.client_agreements FOR ALL
  USING (public.has_role_level(auth.uid(), 'admin'::app_role));

CREATE POLICY "Team managers can view agreements"
  ON public.client_agreements FOR SELECT
  USING (public.has_role_level(auth.uid(), 'team_manager'::app_role));

CREATE POLICY "Clients can view their own agreements"
  ON public.client_agreements FOR SELECT
  USING (public.has_client_access(auth.uid(), client_id));

-- RLS Policies for billing_records
CREATE POLICY "Admins can manage all billing records"
  ON public.billing_records FOR ALL
  USING (public.has_role_level(auth.uid(), 'admin'::app_role));

CREATE POLICY "Team managers can view billing records"
  ON public.billing_records FOR SELECT
  USING (public.has_role_level(auth.uid(), 'team_manager'::app_role));

CREATE POLICY "Clients can view their own billing records"
  ON public.billing_records FOR SELECT
  USING (public.has_client_access(auth.uid(), client_id));

-- Indexes for performance
CREATE INDEX idx_agreements_client ON public.client_agreements(client_id);
CREATE INDEX idx_agreements_status ON public.client_agreements(status);
CREATE INDEX idx_billing_records_client ON public.billing_records(client_id);
CREATE INDEX idx_billing_records_year ON public.billing_records(year);
CREATE INDEX idx_billing_records_status ON public.billing_records(status);
CREATE INDEX idx_billing_records_icount ON public.billing_records(icount_doc_id);

-- Trigger for updated_at
CREATE TRIGGER update_client_agreements_updated_at
  BEFORE UPDATE ON public.client_agreements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_billing_records_updated_at
  BEFORE UPDATE ON public.billing_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();