-- =============================================
-- PROJECT STAGES SYSTEM
-- =============================================

-- Project Stages table (between projects and tasks)
CREATE TABLE IF NOT EXISTS public.project_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'waiting_client', 'approved', 'completed')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  estimated_hours NUMERIC(10,2),
  actual_hours NUMERIC(10,2),
  estimated_cost NUMERIC(12,2),
  start_date DATE,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  requires_client_approval BOOLEAN DEFAULT false,
  client_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add stage_id to tasks
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES public.project_stages(id) ON DELETE SET NULL;

-- Add task classification tag
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS task_tag TEXT DEFAULT 'operational' 
CHECK (task_tag IN ('income_generating', 'operational', 'client_dependent'));

-- Add income_value for income-generating tasks
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS income_value NUMERIC(12,2);

-- =============================================
-- PROPOSAL TO PROJECT FLOW
-- =============================================

-- Enhance quotes table to act as proposals
ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS proposal_status TEXT DEFAULT 'draft' 
CHECK (proposal_status IN ('draft', 'sent', 'viewed', 'approved', 'rejected', 'expired'));

ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS approved_by UUID;

ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS created_project_id UUID REFERENCES public.projects(id);

-- Quote/Proposal items (will become stages)
CREATE TABLE IF NOT EXISTS public.quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL,
  total_price NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  sort_order INTEGER DEFAULT 0,
  creates_stage BOOLEAN DEFAULT true,
  preset_tasks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- CLIENT PORTAL ACCESS
-- =============================================

-- Stage comments from clients
CREATE TABLE IF NOT EXISTS public.stage_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID NOT NULL REFERENCES public.project_stages(id) ON DELETE CASCADE,
  user_id UUID,
  contact_id UUID REFERENCES public.client_contacts(id),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Stage approval history
CREATE TABLE IF NOT EXISTS public.stage_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID NOT NULL REFERENCES public.project_stages(id) ON DELETE CASCADE,
  approved_by_user UUID,
  approved_by_contact UUID REFERENCES public.client_contacts(id),
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected', 'revision_requested')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ENABLE RLS
-- =============================================

ALTER TABLE public.project_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_stages
CREATE POLICY "Admin full access to stages"
ON public.project_stages FOR ALL
TO authenticated
USING (public.has_role_level(auth.uid(), 'admin'::app_role));

CREATE POLICY "Team members view assigned project stages"
ON public.project_stages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id 
    AND public.has_client_access(auth.uid(), p.client_id)
  )
);

-- RLS Policies for quote_items
CREATE POLICY "Admin full access to quote items"
ON public.quote_items FOR ALL
TO authenticated
USING (public.has_role_level(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view client quote items"
ON public.quote_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quotes q 
    WHERE q.id = quote_id 
    AND public.has_client_access(auth.uid(), q.client_id)
  )
);

-- RLS Policies for stage_comments
CREATE POLICY "Admin full access to stage comments"
ON public.stage_comments FOR ALL
TO authenticated
USING (public.has_role_level(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users manage own comments"
ON public.stage_comments FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for stage_approvals
CREATE POLICY "Admin full access to approvals"
ON public.stage_approvals FOR ALL
TO authenticated
USING (public.has_role_level(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view project approvals"
ON public.stage_approvals FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.project_stages ps
    JOIN public.projects p ON p.id = ps.project_id
    WHERE ps.id = stage_id
    AND public.has_client_access(auth.uid(), p.client_id)
  )
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_project_stages_project ON public.project_stages(project_id);
CREATE INDEX IF NOT EXISTS idx_project_stages_status ON public.project_stages(status);
CREATE INDEX IF NOT EXISTS idx_tasks_stage ON public.tasks(stage_id);
CREATE INDEX IF NOT EXISTS idx_tasks_tag ON public.tasks(task_tag);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote ON public.quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_stage_comments_stage ON public.stage_comments(stage_id);

-- =============================================
-- TRIGGER: Update timestamps
-- =============================================

CREATE TRIGGER update_project_stages_updated_at
  BEFORE UPDATE ON public.project_stages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- MIGRATE EXISTING TASKS TO DEFAULT STAGE
-- =============================================

-- Create default stage for each project with tasks
INSERT INTO public.project_stages (project_id, name, description, status, sort_order)
SELECT DISTINCT 
  t.campaign_id,
  'שלב כללי',
  'משימות קיימות שהועברו אוטומטית',
  'in_progress',
  0
FROM public.tasks t
WHERE t.campaign_id IS NOT NULL
AND t.stage_id IS NULL
AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = t.campaign_id)
ON CONFLICT DO NOTHING;

-- Link existing tasks to default stage
UPDATE public.tasks t
SET stage_id = ps.id
FROM public.project_stages ps
WHERE t.campaign_id = ps.project_id
AND t.stage_id IS NULL
AND ps.name = 'שלב כללי';