
-- ============================================
-- DATA CONTRACT FIXES: Complete Flow Implementation
-- ============================================

-- 1. Add at_risk field to projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS at_risk BOOLEAN DEFAULT false;

-- 2. Add project_id to billing_records if missing (for proper work gating)
-- Already exists from schema check

-- ============================================
-- FIX R1: Proposal → Project with proper work_state
-- ============================================

CREATE OR REPLACE FUNCTION public.create_project_from_approved_quote()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_project_id UUID;
  v_stage_id UUID;
  v_item RECORD;
  v_task JSONB;
  v_sort_order INT := 0;
  v_billing_id UUID;
BEGIN
  -- Only if status changed to approved
  IF NEW.proposal_status = 'approved' AND OLD.proposal_status != 'approved' THEN
    
    -- Create project with BLOCKED work_state until payment
    INSERT INTO public.projects (
      name, client_id, status, work_state, 
      start_date, last_activity_at, proposal_id
    )
    VALUES (
      NEW.title, NEW.client_id, 
      'waiting_payment',  -- Status: waiting for payment
      'blocked_payment',  -- Work state: cannot start
      CURRENT_DATE, now(), NEW.id
    )
    RETURNING id INTO v_project_id;
    
    -- Create stages from quote items
    FOR v_item IN 
      SELECT * FROM public.quote_items 
      WHERE quote_id = NEW.id AND creates_stage = true 
      ORDER BY sort_order
    LOOP
      INSERT INTO public.project_stages (
        project_id, name, description, sort_order, 
        estimated_cost, requires_client_approval, status
      )
      VALUES (
        v_project_id, 
        COALESCE(v_item.stage_name, v_item.name), 
        v_item.description, 
        v_sort_order, 
        v_item.total,
        true,
        'pending'  -- All stages start as pending
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
    
    -- Create retainer billing record LINKED to project
    INSERT INTO public.billing_records (
      client_id, project_id, period_start, period_end, year, 
      total_amount, status, due_date, payment_type
    )
    VALUES (
      NEW.client_id, v_project_id, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days',
      EXTRACT(YEAR FROM CURRENT_DATE)::INT,
      NEW.total_amount, 'pending', CURRENT_DATE + INTERVAL '7 days', 'retainer'
    )
    RETURNING id INTO v_billing_id;
    
    -- Create alert for admin
    INSERT INTO public.smart_alerts (to_user_id, alert_type, entity_type, entity_id, title, message, priority)
    SELECT au.id, 'proposal_approved', 'quote', NEW.id, 
           'הצעת מחיר אושרה - ממתין לתשלום: ' || NEW.title,
           'פרויקט חסום עד לתשלום ריטיינר. ' || v_sort_order || ' שלבים נוצרו.',
           'high'
    FROM auth.users au
    JOIN public.user_roles ur ON ur.user_id = au.id
    WHERE ur.role IN ('super_admin', 'admin');
    
  END IF;
  
  RETURN NEW;
END;
$function$;

-- ============================================
-- FIX R4: Task waiting status (any status='waiting', not just client_dependent)
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_task_waiting_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- When status changes to 'waiting', set waiting_since
  IF NEW.status = 'waiting' AND (OLD.status IS NULL OR OLD.status != 'waiting') THEN
    NEW.waiting_since = CURRENT_DATE;
    
    -- Update project to waiting_client if not blocked by payment
    IF NEW.project_id IS NOT NULL THEN
      UPDATE public.projects 
      SET status = CASE 
            WHEN work_state = 'blocked_payment' THEN status  -- Don't override payment block
            ELSE 'waiting_client' 
          END,
          updated_at = now()
      WHERE id = NEW.project_id;
    END IF;
  END IF;
  
  -- When status changes from 'waiting' to something else, clear waiting_since
  IF OLD.status = 'waiting' AND NEW.status != 'waiting' THEN
    NEW.waiting_since = NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- ============================================
-- FIX R5/R6: Daily scheduler with at_risk detection
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_daily_alerts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB := '{}'::JSONB;
  v_overdue_payments INTEGER;
  v_client_delays INTEGER;
  v_stalled_projects INTEGER;
  v_at_risk_count INTEGER;
  v_admin_user RECORD;
BEGIN
  -- Mark overdue payments
  SELECT public.mark_overdue_payments() INTO v_overdue_payments;
  
  -- Block projects with overdue retainer payments
  PERFORM public.mark_projects_blocked_by_payment();
  
  -- Mark projects as at_risk (no activity > 4 days)
  UPDATE public.projects
  SET at_risk = true, updated_at = now()
  WHERE status = 'active'
    AND work_state = 'work_ok'
    AND last_activity_at < NOW() - INTERVAL '4 days'
    AND at_risk = false;
  GET DIAGNOSTICS v_at_risk_count = ROW_COUNT;
  
  -- Clear at_risk for projects with recent activity
  UPDATE public.projects
  SET at_risk = false, updated_at = now()
  WHERE at_risk = true
    AND last_activity_at >= NOW() - INTERVAL '4 days';
  
  -- Count client delays (waiting > 3 days)
  SELECT COUNT(*) INTO v_client_delays
  FROM public.tasks
  WHERE status = 'waiting'
    AND waiting_since < CURRENT_DATE - INTERVAL '3 days';
  
  -- Count stalled projects
  SELECT COUNT(*) INTO v_stalled_projects
  FROM public.projects
  WHERE at_risk = true;
  
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
      format('תשלומים באיחור: %s | עיכובי לקוח: %s | פרויקטים בסיכון: %s',
             v_overdue_payments, v_client_delays, v_stalled_projects),
      CASE WHEN v_overdue_payments > 0 OR v_stalled_projects > 0 THEN 'high' ELSE 'normal' END
    );
    
    -- Alert for tasks waiting on client > 4 days
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
    
    -- Alert for newly at-risk projects
    IF v_at_risk_count > 0 THEN
      INSERT INTO public.smart_alerts (to_user_id, alert_type, entity_type, title, message, priority)
      VALUES (
        v_admin_user.id,
        'project_at_risk',
        'project',
        'פרויקטים בסיכון',
        format('%s פרויקטים ללא תזוזה 4+ ימים', v_at_risk_count),
        'high'
      );
    END IF;
    
    -- Check if no income tasks today
    IF NOT EXISTS (
      SELECT 1 FROM public.tasks
      WHERE task_tag = 'income_generating'
        AND status NOT IN ('completed', 'blocked', 'waiting')
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
    'at_risk_marked', v_at_risk_count,
    'generated_at', NOW()
  );
  
  RETURN result;
END;
$function$;

-- ============================================
-- FIX: on_task_status_change to also update project activity
-- ============================================

CREATE OR REPLACE FUNCTION public.on_task_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update last_activity_at on project (clears at_risk)
  IF NEW.project_id IS NOT NULL THEN
    UPDATE public.projects 
    SET last_activity_at = now(), 
        updated_at = now(),
        at_risk = false  -- Activity clears at_risk
    WHERE id = NEW.project_id;
  END IF;
  
  -- Set waiting_since for client_dependent tasks that become in_progress
  IF NEW.status = 'in_progress' AND NEW.task_tag = 'client_dependent' AND NEW.waiting_since IS NULL THEN
    NEW.waiting_since := CURRENT_DATE;
  END IF;
  
  -- Clear waiting_since when task is no longer waiting/client_dependent
  IF NEW.status NOT IN ('waiting', 'in_progress') OR 
     (NEW.status = 'in_progress' AND NEW.task_tag != 'client_dependent') THEN
    NEW.waiting_since := NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- ============================================
-- FIX: Stage status change updates project activity
-- ============================================

CREATE OR REPLACE FUNCTION public.on_stage_client_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- If status changed to approved
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    
    -- Set approved_by_client and timestamp
    NEW.approved_by_client := true;
    NEW.client_approved_at := now();
    
    -- Unlock blocked tasks in this stage
    UPDATE public.tasks 
    SET status = 'todo'
    WHERE stage_id = NEW.id AND status = 'blocked';
    
    -- Update project: clear at_risk, update activity
    UPDATE public.projects 
    SET last_activity_at = now(), 
        updated_at = now(),
        at_risk = false
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
$function$;
