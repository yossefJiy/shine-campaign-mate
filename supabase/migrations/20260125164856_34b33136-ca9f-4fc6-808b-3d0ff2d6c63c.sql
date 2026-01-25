-- ===========================================
-- STEP 1: Database Schema Extensions
-- ===========================================

-- 1.1 Create proposal_templates table
CREATE TABLE public.proposal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL DEFAULT 'custom', -- 'branding', 'website', 'campaign', 'ecommerce', 'custom'
  stages_json JSONB NOT NULL DEFAULT '[]',
  -- stages_json structure: [{name, description, order, estimated_hours, preset_tasks: [{title, task_tag, priority}]}]
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.2 Create smart_alerts table for intelligent notifications
CREATE TABLE public.smart_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_user_id UUID NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'task_overdue', 'client_delay', 'payment_overdue', 
    'stage_approved', 'project_stalled', 'no_income_tasks',
    'proposal_approved', 'proposal_expired', 'task_assigned'
  )),
  entity_type TEXT, -- 'task', 'project', 'stage', 'billing_record', 'quote'
  entity_id UUID,
  title TEXT NOT NULL,
  message TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.3 Add columns to quote_items for stage/task automation
ALTER TABLE public.quote_items 
  ADD COLUMN IF NOT EXISTS creates_stage BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS stage_name TEXT,
  ADD COLUMN IF NOT EXISTS preset_tasks JSONB DEFAULT '[]';

-- 1.4 Add columns to projects for proposal linking and activity tracking
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES quotes(id),
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT now();

-- 1.5 Add columns to tasks for smart dashboard features
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS waiting_since DATE,
  ADD COLUMN IF NOT EXISTS is_blocking BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_client_visible BOOLEAN DEFAULT false;

-- 1.6 Add columns to quotes for templates and versioning
ALTER TABLE public.quotes 
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES proposal_templates(id),
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS client_confirmed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirmation_text TEXT;

-- ===========================================
-- STEP 2: Enable RLS on new tables
-- ===========================================

ALTER TABLE public.proposal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_alerts ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- STEP 3: RLS Policies for proposal_templates
-- ===========================================

-- Admin/Manager can do everything
CREATE POLICY "admin_manage_templates" ON public.proposal_templates
FOR ALL TO authenticated
USING (public.has_role_level(auth.uid(), 'agency_manager'::app_role));

-- Team can view active templates
CREATE POLICY "team_view_templates" ON public.proposal_templates
FOR SELECT TO authenticated
USING (is_active = true AND public.has_role_level(auth.uid(), 'employee'::app_role));

-- ===========================================
-- STEP 4: RLS Policies for smart_alerts
-- ===========================================

-- Users can only see their own alerts
CREATE POLICY "users_own_alerts" ON public.smart_alerts
FOR SELECT TO authenticated
USING (to_user_id = auth.uid());

-- Users can update (mark as read) their own alerts
CREATE POLICY "users_update_alerts" ON public.smart_alerts
FOR UPDATE TO authenticated
USING (to_user_id = auth.uid());

-- Admin can create alerts for anyone
CREATE POLICY "admin_create_alerts" ON public.smart_alerts
FOR INSERT TO authenticated
WITH CHECK (public.has_role_level(auth.uid(), 'employee'::app_role));

-- ===========================================
-- STEP 5: Indexes for performance
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_smart_alerts_user ON public.smart_alerts(to_user_id);
CREATE INDEX IF NOT EXISTS idx_smart_alerts_unread ON public.smart_alerts(to_user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_tasks_waiting ON public.tasks(waiting_since) WHERE waiting_since IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_income ON public.tasks(task_tag, status) WHERE task_tag = 'income_generating';
CREATE INDEX IF NOT EXISTS idx_projects_activity ON public.projects(last_activity_at);

-- ===========================================
-- STEP 6: Update triggers for timestamps
-- ===========================================

CREATE TRIGGER update_proposal_templates_updated_at
  BEFORE UPDATE ON public.proposal_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- STEP 7: Database Function - Task Status Change Handler
-- ===========================================

CREATE OR REPLACE FUNCTION public.on_task_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Set waiting_since when task becomes client_dependent and in_progress
  IF NEW.status = 'in_progress' AND NEW.task_tag = 'client_dependent' AND NEW.waiting_since IS NULL THEN
    NEW.waiting_since := CURRENT_DATE;
  ELSIF NEW.status != 'in_progress' OR NEW.task_tag != 'client_dependent' THEN
    NEW.waiting_since := NULL;
  END IF;
  
  -- Update last_activity_at on project
  IF NEW.project_id IS NOT NULL THEN
    UPDATE public.projects SET last_activity_at = now(), updated_at = now()
    WHERE id = NEW.project_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_task_status_change
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.task_tag IS DISTINCT FROM NEW.task_tag)
  EXECUTE FUNCTION public.on_task_status_change();

-- ===========================================
-- STEP 8: Database Function - Stage Approved Handler
-- ===========================================

CREATE OR REPLACE FUNCTION public.on_stage_client_approved()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed to approved
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    
    -- Unlock blocked tasks in this stage
    UPDATE public.tasks 
    SET status = 'todo'
    WHERE stage_id = NEW.id AND status = 'blocked';
    
    -- Update last_activity_at on project
    UPDATE public.projects SET last_activity_at = now(), updated_at = now() 
    WHERE id = NEW.project_id;
    
    -- Create alert for admin
    INSERT INTO public.smart_alerts (to_user_id, alert_type, entity_type, entity_id, title, message, priority)
    SELECT au.id, 'stage_approved', 'stage', NEW.id,
           'שלב אושר: ' || NEW.name,
           'הלקוח אישר את השלב - המשימות נפתחו לעבודה',
           'normal'
    FROM auth.users au
    JOIN public.user_roles ur ON ur.user_id = au.id
    WHERE ur.role IN ('super_admin', 'admin');
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_stage_approved
  AFTER UPDATE ON public.project_stages
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.on_stage_client_approved();

-- ===========================================
-- STEP 9: Database Function - Quote Approved -> Create Project
-- ===========================================

CREATE OR REPLACE FUNCTION public.create_project_from_approved_quote()
RETURNS TRIGGER AS $$
DECLARE
  v_project_id UUID;
  v_stage_id UUID;
  v_item RECORD;
  v_task JSONB;
  v_sort_order INT := 0;
BEGIN
  -- Only if status changed to approved
  IF NEW.proposal_status = 'approved' AND OLD.proposal_status != 'approved' THEN
    
    -- Create project
    INSERT INTO public.projects (name, client_id, status, start_date, last_activity_at, proposal_id)
    VALUES (NEW.title, NEW.client_id, 'active', CURRENT_DATE, now(), NEW.id)
    RETURNING id INTO v_project_id;
    
    -- Create stages from quote items
    FOR v_item IN 
      SELECT * FROM public.quote_items 
      WHERE quote_id = NEW.id AND creates_stage = true 
      ORDER BY sort_order
    LOOP
      INSERT INTO public.project_stages (
        project_id, name, description, sort_order, 
        estimated_cost, requires_client_approval
      )
      VALUES (
        v_project_id, 
        COALESCE(v_item.stage_name, v_item.name), 
        v_item.description, 
        v_sort_order, 
        v_item.total,
        true
      )
      RETURNING id INTO v_stage_id;
      
      -- Create preset tasks
      IF v_item.preset_tasks IS NOT NULL AND jsonb_array_length(v_item.preset_tasks) > 0 THEN
        FOR v_task IN SELECT * FROM jsonb_array_elements(v_item.preset_tasks)
        LOOP
          INSERT INTO public.tasks (
            project_id, stage_id, title, 
            task_tag, status, priority, client_id
          ) VALUES (
            v_project_id, v_stage_id, v_task->>'title',
            COALESCE(v_task->>'task_tag', 'operational')::TEXT, 
            'todo', 
            COALESCE(v_task->>'priority', 'medium')::TEXT, 
            NEW.client_id
          );
        END LOOP;
      END IF;
      
      v_sort_order := v_sort_order + 1;
    END LOOP;
    
    -- Create default billing record
    INSERT INTO public.billing_records (
      client_id, period_start, period_end, year, 
      total_amount, status, due_date
    )
    VALUES (
      NEW.client_id, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days',
      EXTRACT(YEAR FROM CURRENT_DATE)::INT,
      NEW.total_amount, 'pending', CURRENT_DATE + INTERVAL '30 days'
    );
    
    -- Create alert for admin
    INSERT INTO public.smart_alerts (to_user_id, alert_type, entity_type, entity_id, title, message, priority)
    SELECT au.id, 'proposal_approved', 'quote', NEW.id, 
           'הצעת מחיר אושרה - פרויקט חדש: ' || NEW.title,
           'הפרויקט נוצר אוטומטית עם ' || v_sort_order || ' שלבים',
           'high'
    FROM auth.users au
    JOIN public.user_roles ur ON ur.user_id = au.id
    WHERE ur.role IN ('super_admin', 'admin');
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_quote_approved
  AFTER UPDATE ON public.quotes
  FOR EACH ROW
  WHEN (OLD.proposal_status IS DISTINCT FROM NEW.proposal_status)
  EXECUTE FUNCTION public.create_project_from_approved_quote();