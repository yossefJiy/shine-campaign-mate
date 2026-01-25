-- ==========================================
-- 1. SERVICES TABLE (מחירון שירותים)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  base_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  pricing_type TEXT NOT NULL DEFAULT 'fixed' CHECK (pricing_type IN ('fixed', 'hourly', 'package', 'retainer', 'commission')),
  unit TEXT DEFAULT 'unit',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 2. BILLING GOALS (יעדים)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.billing_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER CHECK (month >= 1 AND month <= 12),
  revenue_target NUMERIC(12,2) DEFAULT 0,
  commission_target NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_billing_goals_agency ON public.billing_goals(year, month) WHERE client_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_billing_goals_client ON public.billing_goals(client_id, year, month);

-- ==========================================
-- 3. COMMISSION COLLECTIONS (גביית אחוזים - נפרד)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.commission_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  expected_amount NUMERIC(12,2) DEFAULT 0,
  collected_amount NUMERIC(12,2) DEFAULT 0,
  commission_percent NUMERIC(5,2),
  ad_spend NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'collected', 'overdue')),
  collected_at TIMESTAMPTZ,
  icount_doc_id TEXT,
  icount_doc_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_commission_collections_period ON public.commission_collections(year, month);
CREATE INDEX IF NOT EXISTS idx_commission_collections_status ON public.commission_collections(status);

-- ==========================================
-- 4. COMMISSION UPDATE REQUESTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.commission_update_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  ad_spend_reported NUMERIC(12,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'responded', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 5. RLS POLICIES
-- ==========================================
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_update_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Services viewable by authenticated" ON public.services
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Services manageable by admins" ON public.services
  FOR ALL TO authenticated
  USING (public.has_role_level(auth.uid(), 'admin'));

CREATE POLICY "Billing goals viewable by team" ON public.billing_goals
  FOR SELECT TO authenticated
  USING (public.has_role_level(auth.uid(), 'employee') OR client_id IS NULL OR public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Billing goals manageable by admins" ON public.billing_goals
  FOR ALL TO authenticated
  USING (public.has_role_level(auth.uid(), 'admin'));

CREATE POLICY "Commission collections viewable by team" ON public.commission_collections
  FOR SELECT TO authenticated
  USING (public.has_role_level(auth.uid(), 'employee') OR public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Commission collections manageable by admins" ON public.commission_collections
  FOR ALL TO authenticated
  USING (public.has_role_level(auth.uid(), 'admin'));

CREATE POLICY "Commission requests viewable by team" ON public.commission_update_requests
  FOR SELECT TO authenticated
  USING (public.has_role_level(auth.uid(), 'employee') OR public.has_client_access(auth.uid(), client_id));

CREATE POLICY "Commission requests manageable by admins" ON public.commission_update_requests
  FOR ALL TO authenticated
  USING (public.has_role_level(auth.uid(), 'admin'));

-- ==========================================
-- 6. TRIGGERS
-- ==========================================
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_billing_goals_updated_at
  BEFORE UPDATE ON public.billing_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commission_collections_updated_at
  BEFORE UPDATE ON public.commission_collections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();