-- ========================================
-- Migration: Complete UX Spec Alignment (Fixed)
-- A4: Daily Scheduler support
-- A5: Payment overdue automation
-- Edge Cases: Proposal versioning, cancelled_after_approval
-- ========================================

-- 1. Add missing columns to quotes for edge cases
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS parent_quote_id UUID REFERENCES public.quotes(id),
ADD COLUMN IF NOT EXISTS cancelled_reason TEXT,
ADD COLUMN IF NOT EXISTS client_confirmed_terms BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS client_view_token UUID DEFAULT gen_random_uuid();

-- 2. Add comment for cancelled_after_approval status
COMMENT ON COLUMN public.quotes.proposal_status IS 'draft, sent, approved, cancelled, cancelled_after_approval';

-- 3. Create trigger for A5: Payment overdue automation
CREATE OR REPLACE FUNCTION public.check_payment_overdue()
RETURNS TRIGGER AS $$
BEGIN
  -- If due_date passed and status is still pending, mark as overdue
  IF NEW.due_date < CURRENT_DATE AND NEW.status = 'pending' THEN
    NEW.status := 'overdue';
    
    -- Create alert for admins
    INSERT INTO public.smart_alerts (to_user_id, alert_type, entity_type, entity_id, title, message, priority)
    SELECT au.id, 'payment_overdue', 'billing_record', NEW.id,
           'תשלום באיחור: ' || c.name,
           'תשלום בסך ' || NEW.total_amount || ' ש"ח באיחור',
           'high'
    FROM auth.users au
    JOIN public.user_roles ur ON ur.user_id = au.id
    JOIN public.clients c ON c.id = NEW.client_id
    WHERE ur.role IN ('super_admin', 'admin');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_check_payment_overdue ON public.billing_records;
CREATE TRIGGER trigger_check_payment_overdue
  BEFORE INSERT OR UPDATE ON public.billing_records
  FOR EACH ROW
  EXECUTE FUNCTION public.check_payment_overdue();

-- 4. Create function to check and mark overdue payments (for scheduled runs)
CREATE OR REPLACE FUNCTION public.mark_overdue_payments()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  WITH updated AS (
    UPDATE public.billing_records
    SET status = 'overdue'
    WHERE status = 'pending'
      AND due_date < CURRENT_DATE
    RETURNING id
  )
  SELECT COUNT(*) INTO updated_count FROM updated;
  
  -- Create alerts for newly overdue payments
  INSERT INTO public.smart_alerts (to_user_id, alert_type, entity_type, entity_id, title, message, priority)
  SELECT DISTINCT ur.user_id, 'payment_overdue', 'billing_record', br.id,
         'תשלום באיחור: ' || c.name,
         'תשלום בסך ' || br.total_amount || ' ש"ח באיחור',
         'high'
  FROM public.billing_records br
  JOIN public.clients c ON c.id = br.client_id
  JOIN public.user_roles ur ON ur.role IN ('super_admin', 'admin')
  WHERE br.status = 'overdue'
    AND br.updated_at >= NOW() - INTERVAL '1 minute';
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Create function for daily alerts (A4)
CREATE OR REPLACE FUNCTION public.generate_daily_alerts()
RETURNS JSONB AS $$
DECLARE
  result JSONB := '{}'::JSONB;
  v_overdue_payments INTEGER;
  v_client_delays INTEGER;
  v_stalled_projects INTEGER;
  v_admin_user RECORD;
BEGIN
  -- Mark overdue payments
  SELECT public.mark_overdue_payments() INTO v_overdue_payments;
  
  -- Count client delays (waiting > 3 days)
  SELECT COUNT(*) INTO v_client_delays
  FROM public.tasks
  WHERE status = 'in_progress'
    AND task_tag = 'client_dependent'
    AND waiting_since < CURRENT_DATE - INTERVAL '3 days';
  
  -- Count stalled projects (no activity > 5 days)
  SELECT COUNT(*) INTO v_stalled_projects
  FROM public.projects
  WHERE status = 'active'
    AND last_activity_at < NOW() - INTERVAL '5 days';
  
  -- Create summary alert for admins
  FOR v_admin_user IN 
    SELECT au.id 
    FROM auth.users au
    JOIN public.user_roles ur ON ur.user_id = au.id
    WHERE ur.role IN ('super_admin', 'admin')
  LOOP
    -- Daily summary alert
    INSERT INTO public.smart_alerts (to_user_id, alert_type, entity_type, title, message, priority)
    VALUES (
      v_admin_user.id,
      'daily_summary',
      'system',
      'סיכום יומי',
      format('תשלומים באיחור: %s | עיכובי לקוח: %s | פרויקטים תקועים: %s',
             v_overdue_payments, v_client_delays, v_stalled_projects),
      CASE WHEN v_overdue_payments > 0 OR v_stalled_projects > 0 THEN 'high' ELSE 'normal' END
    );
    
    -- Alert for tasks waiting on client
    IF v_client_delays > 0 THEN
      INSERT INTO public.smart_alerts (to_user_id, alert_type, entity_type, title, message, priority)
      VALUES (
        v_admin_user.id,
        'client_delay',
        'task',
        'משימות ממתינות ללקוח',
        format('%s משימות ממתינות ללקוח יותר מ-3 ימים', v_client_delays),
        'normal'
      );
    END IF;
    
    -- Check if no income tasks today
    IF NOT EXISTS (
      SELECT 1 FROM public.tasks
      WHERE task_tag = 'income_generating'
        AND status NOT IN ('completed', 'blocked')
        AND (due_date IS NULL OR due_date <= CURRENT_DATE + INTERVAL '1 day')
    ) THEN
      INSERT INTO public.smart_alerts (to_user_id, alert_type, entity_type, title, message, priority)
      VALUES (
        v_admin_user.id,
        'no_income_tasks',
        'system',
        'אין משימות כסף היום',
        'אין משימות שמכניסות כסף מתוזמנות להיום/מחר - זה זמן ליזום',
        'high'
      );
    END IF;
  END LOOP;
  
  result := jsonb_build_object(
    'overdue_payments', v_overdue_payments,
    'client_delays', v_client_delays,
    'stalled_projects', v_stalled_projects,
    'generated_at', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Function to create new quote version (edge case: edit after send)
CREATE OR REPLACE FUNCTION public.create_quote_version(p_quote_id UUID)
RETURNS UUID AS $$
DECLARE
  v_new_quote_id UUID;
  v_original RECORD;
BEGIN
  -- Get original quote
  SELECT * INTO v_original FROM public.quotes WHERE id = p_quote_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote not found';
  END IF;
  
  -- Create new version
  INSERT INTO public.quotes (
    client_id, title, description, proposal_status, total_amount,
    valid_until, template_id, version, parent_quote_id
  )
  VALUES (
    v_original.client_id, v_original.title, v_original.description,
    'draft', v_original.total_amount, v_original.valid_until,
    v_original.template_id, v_original.version + 1, p_quote_id
  )
  RETURNING id INTO v_new_quote_id;
  
  -- Copy items
  INSERT INTO public.quote_items (
    quote_id, name, description, quantity, unit_price, total,
    service_id, stage_name, creates_stage, preset_tasks, sort_order
  )
  SELECT 
    v_new_quote_id, name, description, quantity, unit_price, total,
    service_id, stage_name, creates_stage, preset_tasks, sort_order
  FROM public.quote_items
  WHERE quote_id = p_quote_id;
  
  RETURN v_new_quote_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Function to cancel approved quote (edge case)
CREATE OR REPLACE FUNCTION public.cancel_approved_quote(p_quote_id UUID, p_reason TEXT)
RETURNS VOID AS $$
DECLARE
  v_project RECORD;
BEGIN
  -- Update quote status
  UPDATE public.quotes
  SET proposal_status = 'cancelled_after_approval',
      cancelled_reason = p_reason
  WHERE id = p_quote_id;
  
  -- Find and mark related project as on_hold
  SELECT * INTO v_project FROM public.projects WHERE proposal_id = p_quote_id;
  
  IF FOUND THEN
    UPDATE public.projects
    SET status = 'on_hold'
    WHERE id = v_project.id;
    
    -- Alert admins
    INSERT INTO public.smart_alerts (to_user_id, alert_type, entity_type, entity_id, title, message, priority)
    SELECT ur.user_id, 'quote_cancelled', 'quote', p_quote_id,
           'הצעת מחיר בוטלה לאחר אישור',
           'סיבה: ' || p_reason || '. הפרויקט הועבר להמתנה.',
           'high'
    FROM public.user_roles ur
    WHERE ur.role IN ('super_admin', 'admin');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. Add indexes for performance on common queries
CREATE INDEX IF NOT EXISTS idx_tasks_income_due ON public.tasks(due_date, status) 
  WHERE task_tag = 'income_generating';
CREATE INDEX IF NOT EXISTS idx_tasks_waiting_since ON public.tasks(waiting_since) 
  WHERE waiting_since IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_billing_overdue ON public.billing_records(due_date, status) 
  WHERE status IN ('pending', 'overdue');
CREATE INDEX IF NOT EXISTS idx_projects_stalled ON public.projects(last_activity_at) 
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_quotes_client_token ON public.quotes(client_view_token);