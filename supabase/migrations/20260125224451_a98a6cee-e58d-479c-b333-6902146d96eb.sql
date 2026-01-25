-- =====================================================
-- NOTIFICATION SYSTEM ARCHITECTURE MIGRATION (FIXED)
-- Rules create records → Delivery decides when to show
-- =====================================================

-- A0) Data Contract - Agency Settings Table
CREATE TABLE IF NOT EXISTS public.agency_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timezone text NOT NULL DEFAULT 'Asia/Jerusalem',
  work_hours_start time NOT NULL DEFAULT '09:00',
  work_hours_end time NOT NULL DEFAULT '18:00',
  work_days integer[] NOT NULL DEFAULT ARRAY[0,1,2,3,4], -- Sunday-Thursday (Israel)
  client_delay_threshold_days integer NOT NULL DEFAULT 4,
  project_stalled_threshold_days integer NOT NULL DEFAULT 4,
  payment_overdue_grace_days integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default agency settings
INSERT INTO public.agency_settings (id, timezone, work_hours_start, work_hours_end, work_days)
VALUES (gen_random_uuid(), 'Asia/Jerusalem', '09:00', '18:00', ARRAY[0,1,2,3,4])
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.agency_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view/edit agency settings
DROP POLICY IF EXISTS "Admins can manage agency settings" ON public.agency_settings;
CREATE POLICY "Admins can manage agency settings"
  ON public.agency_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- A0) Data Contract - Add notification policy fields to profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferred_timezone') THEN
    ALTER TABLE public.profiles ADD COLUMN preferred_timezone text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'notification_policy') THEN
    ALTER TABLE public.profiles ADD COLUMN notification_policy text DEFAULT 'agency_hours';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'work_hours_start') THEN
    ALTER TABLE public.profiles ADD COLUMN work_hours_start time;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'work_hours_end') THEN
    ALTER TABLE public.profiles ADD COLUMN work_hours_end time;
  END IF;
END $$;

-- A0) Data Contract - Add notification fields to client_contacts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_contacts' AND column_name = 'preferred_timezone') THEN
    ALTER TABLE public.client_contacts ADD COLUMN preferred_timezone text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_contacts' AND column_name = 'notification_policy') THEN
    ALTER TABLE public.client_contacts ADD COLUMN notification_policy text DEFAULT 'agency_hours';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_contacts' AND column_name = 'work_hours_start') THEN
    ALTER TABLE public.client_contacts ADD COLUMN work_hours_start time;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_contacts' AND column_name = 'work_hours_end') THEN
    ALTER TABLE public.client_contacts ADD COLUMN work_hours_end time;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_contacts' AND column_name = 'notify') THEN
    ALTER TABLE public.client_contacts ADD COLUMN notify boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_contacts' AND column_name = 'can_approve') THEN
    ALTER TABLE public.client_contacts ADD COLUMN can_approve boolean DEFAULT false;
  END IF;
END $$;

-- A0) Data Contract - Enhance smart_alerts table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'smart_alerts' AND column_name = 'severity') THEN
    ALTER TABLE public.smart_alerts ADD COLUMN severity text DEFAULT 'info';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'smart_alerts' AND column_name = 'deliver_by') THEN
    ALTER TABLE public.smart_alerts ADD COLUMN deliver_by timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'smart_alerts' AND column_name = 'delivered_at') THEN
    ALTER TABLE public.smart_alerts ADD COLUMN delivered_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'smart_alerts' AND column_name = 'recipient_type') THEN
    ALTER TABLE public.smart_alerts ADD COLUMN recipient_type text DEFAULT 'user';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'smart_alerts' AND column_name = 'recipient_id') THEN
    ALTER TABLE public.smart_alerts ADD COLUMN recipient_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'smart_alerts' AND column_name = 'alert_day') THEN
    ALTER TABLE public.smart_alerts ADD COLUMN alert_day date DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- Create unique index for idempotency (prevent duplicate alerts)
CREATE UNIQUE INDEX IF NOT EXISTS smart_alerts_idempotent_idx 
  ON public.smart_alerts (alert_type, entity_type, entity_id, alert_day, recipient_type, recipient_id)
  WHERE entity_id IS NOT NULL AND recipient_id IS NOT NULL;

-- Partial index for alerts without entity_id
CREATE UNIQUE INDEX IF NOT EXISTS smart_alerts_no_entity_idx
  ON public.smart_alerts (alert_type, alert_day, recipient_type, recipient_id)
  WHERE entity_id IS NULL AND recipient_id IS NOT NULL;

-- =====================================================
-- B) DELIVERY LOGIC - Calculate deliver_by timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION public.calc_delivery_time(
  p_recipient_type text,
  p_recipient_id uuid,
  p_severity text DEFAULT 'info'
)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_policy text;
  v_timezone text;
  v_work_start time;
  v_work_end time;
  v_work_days integer[];
  v_now timestamptz := now();
  v_local_now timestamp;
  v_local_time time;
  v_local_dow integer;
  v_next_window timestamptz;
BEGIN
  -- Critical severity always returns now (immediate)
  IF p_severity = 'critical' THEN
    RETURN v_now;
  END IF;
  
  -- Get recipient notification policy
  IF p_recipient_type = 'user' THEN
    SELECT 
      COALESCE(p.notification_policy, 'agency_hours'),
      p.preferred_timezone,
      p.work_hours_start,
      p.work_hours_end
    INTO v_policy, v_timezone, v_work_start, v_work_end
    FROM profiles p
    WHERE p.id = p_recipient_id;
  ELSIF p_recipient_type = 'client_contact' THEN
    SELECT 
      COALESCE(cc.notification_policy, 'agency_hours'),
      cc.preferred_timezone,
      cc.work_hours_start,
      cc.work_hours_end
    INTO v_policy, v_timezone, v_work_start, v_work_end
    FROM client_contacts cc
    WHERE cc.id = p_recipient_id;
  END IF;
  
  -- Default to agency_hours if not found
  v_policy := COALESCE(v_policy, 'agency_hours');
  
  -- Handle immediate_only policy
  IF v_policy = 'immediate_only' THEN
    IF p_severity = 'critical' THEN
      RETURN v_now;
    ELSE
      RETURN NULL;
    END IF;
  END IF;
  
  -- Get agency settings for agency_hours policy or as fallback
  IF v_policy = 'agency_hours' OR v_timezone IS NULL THEN
    SELECT 
      a.timezone, a.work_hours_start, a.work_hours_end, a.work_days
    INTO v_timezone, v_work_start, v_work_end, v_work_days
    FROM agency_settings a
    LIMIT 1;
  END IF;
  
  -- Default fallbacks
  v_timezone := COALESCE(v_timezone, 'Asia/Jerusalem');
  v_work_start := COALESCE(v_work_start, '09:00'::time);
  v_work_end := COALESCE(v_work_end, '18:00'::time);
  v_work_days := COALESCE(v_work_days, ARRAY[0,1,2,3,4]);
  
  -- Calculate local time
  v_local_now := v_now AT TIME ZONE v_timezone;
  v_local_time := v_local_now::time;
  v_local_dow := EXTRACT(DOW FROM v_local_now)::integer;
  
  -- Check if we're in a work window
  IF v_local_dow = ANY(v_work_days) 
     AND v_local_time >= v_work_start 
     AND v_local_time <= v_work_end THEN
    RETURN v_now;
  END IF;
  
  -- Calculate next window start
  FOR i IN 0..7 LOOP
    DECLARE
      v_check_dow integer := ((v_local_dow + i) % 7);
      v_check_date date := (v_local_now::date + i);
    BEGIN
      IF v_check_dow = ANY(v_work_days) THEN
        IF i = 0 AND v_local_time < v_work_start THEN
          v_next_window := (v_check_date || ' ' || v_work_start::text)::timestamp AT TIME ZONE v_timezone;
          RETURN v_next_window;
        ELSIF i > 0 THEN
          v_next_window := (v_check_date || ' ' || v_work_start::text)::timestamp AT TIME ZONE v_timezone;
          RETURN v_next_window;
        END IF;
      END IF;
    END;
  END LOOP;
  
  RETURN v_now;
END;
$$;

-- =====================================================
-- A1) EVENT RULES - Create Notification Records
-- =====================================================

-- N1/N2: Proposal status changes (sent/approved)
CREATE OR REPLACE FUNCTION public.notify_proposal_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin record;
  v_title text;
  v_message text;
  v_alert_type text;
  v_severity text := 'info';
  v_client_name text;
BEGIN
  SELECT c.name INTO v_client_name FROM clients c WHERE c.id = NEW.client_id;
  
  IF NEW.proposal_status = 'sent' AND (OLD.proposal_status IS NULL OR OLD.proposal_status != 'sent') THEN
    v_alert_type := 'proposal_sent';
    v_title := 'הצעה נשלחה: ' || COALESCE(NEW.title, 'ללא כותרת');
    v_message := 'לקוח: ' || COALESCE(v_client_name, 'לא ידוע');
  ELSIF NEW.proposal_status = 'approved' AND OLD.proposal_status != 'approved' THEN
    v_alert_type := 'proposal_approved';
    v_title := 'הצעה אושרה! ' || COALESCE(NEW.title, 'ללא כותרת');
    v_message := 'לקוח: ' || COALESCE(v_client_name, 'לא ידוע') || ' - ניתן להתחיל בעבודה';
    v_severity := 'critical';
  ELSE
    RETURN NEW;
  END IF;
  
  FOR v_admin IN 
    SELECT ur.user_id, p.id as profile_id
    FROM user_roles ur
    LEFT JOIN profiles p ON p.id = ur.user_id
    WHERE ur.role IN ('super_admin', 'admin')
  LOOP
    INSERT INTO smart_alerts (
      to_user_id, alert_type, entity_type, entity_id, 
      title, message, priority, severity,
      recipient_type, recipient_id, alert_day, deliver_by
    ) VALUES (
      v_admin.user_id, v_alert_type, 'proposal', NEW.id,
      v_title, v_message, 
      CASE WHEN v_severity = 'critical' THEN 'urgent' ELSE 'normal' END,
      v_severity, 'user', v_admin.user_id, CURRENT_DATE,
      calc_delivery_time('user', v_admin.user_id, v_severity)
    )
    ON CONFLICT (alert_type, entity_type, entity_id, alert_day, recipient_type, recipient_id) 
    WHERE entity_id IS NOT NULL AND recipient_id IS NOT NULL
    DO UPDATE SET title = EXCLUDED.title, message = EXCLUDED.message, updated_at = now();
  END LOOP;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_proposal_status ON public.quotes;
CREATE TRIGGER trigger_notify_proposal_status
  AFTER UPDATE OF proposal_status ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION notify_proposal_status_change();

-- N3: Stage approval requested (notify client contacts) - FIXED field name
CREATE OR REPLACE FUNCTION public.notify_stage_approval_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact record;
  v_project record;
BEGIN
  IF NEW.requires_client_approval = true AND 
     (OLD.requires_client_approval IS NULL OR OLD.requires_client_approval = false) THEN
    
    SELECT p.*, c.name as client_name INTO v_project
    FROM projects p JOIN clients c ON c.id = p.client_id
    WHERE p.id = NEW.project_id;
    
    FOR v_contact IN 
      SELECT cc.id, cc.email, cc.name
      FROM client_contacts cc
      WHERE cc.client_id = v_project.client_id
      AND cc.notify = true AND cc.can_approve = true
    LOOP
      INSERT INTO smart_alerts (
        to_user_id, alert_type, entity_type, entity_id,
        title, message, priority, severity,
        recipient_type, recipient_id, alert_day, deliver_by
      ) VALUES (
        NULL, 'stage_approval_request', 'stage', NEW.id,
        'נדרש אישור: ' || COALESCE(NEW.name, 'שלב'),
        'פרויקט: ' || COALESCE(v_project.name, 'לא ידוע'),
        'high', 'warn', 'client_contact', v_contact.id, CURRENT_DATE,
        calc_delivery_time('client_contact', v_contact.id, 'warn')
      )
      ON CONFLICT (alert_type, entity_type, entity_id, alert_day, recipient_type, recipient_id)
      WHERE entity_id IS NOT NULL AND recipient_id IS NOT NULL
      DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_stage_approval_request ON public.project_stages;
CREATE TRIGGER trigger_notify_stage_approval_request
  AFTER UPDATE OF requires_client_approval ON public.project_stages
  FOR EACH ROW
  EXECUTE FUNCTION notify_stage_approval_request();

-- N4: Stage approved by client
CREATE OR REPLACE FUNCTION public.notify_stage_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin record;
  v_project record;
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    SELECT p.*, c.name as client_name INTO v_project
    FROM projects p JOIN clients c ON c.id = p.client_id
    WHERE p.id = NEW.project_id;
    
    FOR v_admin IN 
      SELECT ur.user_id FROM user_roles ur WHERE ur.role IN ('super_admin', 'admin')
    LOOP
      INSERT INTO smart_alerts (
        to_user_id, alert_type, entity_type, entity_id,
        title, message, priority, severity,
        recipient_type, recipient_id, alert_day, deliver_by
      ) VALUES (
        v_admin.user_id, 'stage_approved', 'stage', NEW.id,
        'שלב אושר: ' || COALESCE(NEW.name, 'שלב'),
        'פרויקט: ' || COALESCE(v_project.name, 'לא ידוע') || ' - ' || COALESCE(v_project.client_name, ''),
        'normal', 'info', 'user', v_admin.user_id, CURRENT_DATE, now()
      )
      ON CONFLICT (alert_type, entity_type, entity_id, alert_day, recipient_type, recipient_id)
      WHERE entity_id IS NOT NULL AND recipient_id IS NOT NULL
      DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_stage_approved ON public.project_stages;
CREATE TRIGGER trigger_notify_stage_approved
  AFTER UPDATE OF status ON public.project_stages
  FOR EACH ROW
  EXECUTE FUNCTION notify_stage_approved();

-- N5: Task assigned to owner
CREATE OR REPLACE FUNCTION public.notify_task_assigned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_name text;
BEGIN
  IF NEW.assignee IS NOT NULL AND 
     (OLD.assignee IS NULL OR OLD.assignee != NEW.assignee) THEN
    
    SELECT c.name INTO v_client_name FROM clients c WHERE c.id = NEW.client_id;
    
    INSERT INTO smart_alerts (
      to_user_id, alert_type, entity_type, entity_id,
      title, message, priority, severity,
      recipient_type, recipient_id, alert_day, deliver_by
    ) VALUES (
      NEW.assignee, 'task_assigned', 'task', NEW.id,
      'משימה חדשה: ' || COALESCE(NEW.title, 'ללא כותרת'),
      'לקוח: ' || COALESCE(v_client_name, 'לא ידוע'),
      'normal', 'info', 'user', NEW.assignee, CURRENT_DATE,
      calc_delivery_time('user', NEW.assignee, 'info')
    )
    ON CONFLICT (alert_type, entity_type, entity_id, alert_day, recipient_type, recipient_id)
    WHERE entity_id IS NOT NULL AND recipient_id IS NOT NULL
    DO UPDATE SET title = EXCLUDED.title, message = EXCLUDED.message;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_task_assigned ON public.tasks;
CREATE TRIGGER trigger_notify_task_assigned
  AFTER UPDATE OF assignee ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assigned();

DROP TRIGGER IF EXISTS trigger_notify_task_assigned_insert ON public.tasks;
CREATE TRIGGER trigger_notify_task_assigned_insert
  AFTER INSERT ON public.tasks
  FOR EACH ROW
  WHEN (NEW.assignee IS NOT NULL)
  EXECUTE FUNCTION notify_task_assigned();

-- N6: Task set to waiting
CREATE OR REPLACE FUNCTION public.notify_task_waiting()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin record;
  v_client_name text;
BEGIN
  IF NEW.status IN ('waiting', 'blocked') AND 
     (OLD.status IS NULL OR OLD.status NOT IN ('waiting', 'blocked')) THEN
    
    SELECT c.name INTO v_client_name FROM clients c WHERE c.id = NEW.client_id;
    
    IF NEW.assignee IS NOT NULL THEN
      INSERT INTO smart_alerts (
        to_user_id, alert_type, entity_type, entity_id,
        title, message, priority, severity,
        recipient_type, recipient_id, alert_day, deliver_by
      ) VALUES (
        NEW.assignee, 'task_waiting', 'task', NEW.id,
        'ממתין ללקוח: ' || COALESCE(NEW.title, 'משימה'),
        'לקוח: ' || COALESCE(v_client_name, 'לא ידוע'),
        'normal', 'warn', 'user', NEW.assignee, CURRENT_DATE,
        calc_delivery_time('user', NEW.assignee, 'warn')
      )
      ON CONFLICT (alert_type, entity_type, entity_id, alert_day, recipient_type, recipient_id)
      WHERE entity_id IS NOT NULL AND recipient_id IS NOT NULL
      DO NOTHING;
    END IF;
    
    FOR v_admin IN 
      SELECT ur.user_id FROM user_roles ur
      WHERE ur.role IN ('super_admin', 'admin')
      AND ur.user_id != COALESCE(NEW.assignee, '00000000-0000-0000-0000-000000000000'::uuid)
    LOOP
      INSERT INTO smart_alerts (
        to_user_id, alert_type, entity_type, entity_id,
        title, message, priority, severity,
        recipient_type, recipient_id, alert_day, deliver_by
      ) VALUES (
        v_admin.user_id, 'task_waiting', 'task', NEW.id,
        'ממתין ללקוח: ' || COALESCE(NEW.title, 'משימה'),
        'לקוח: ' || COALESCE(v_client_name, 'לא ידוע'),
        'normal', 'warn', 'user', v_admin.user_id, CURRENT_DATE,
        calc_delivery_time('user', v_admin.user_id, 'warn')
      )
      ON CONFLICT (alert_type, entity_type, entity_id, alert_day, recipient_type, recipient_id)
      WHERE entity_id IS NOT NULL AND recipient_id IS NOT NULL
      DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_task_waiting ON public.tasks;
CREATE TRIGGER trigger_notify_task_waiting
  AFTER UPDATE OF status ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_waiting();

-- N7: Retainer marked paid
CREATE OR REPLACE FUNCTION public.notify_retainer_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin record;
  v_client_name text;
BEGIN
  IF NEW.status = 'paid' AND OLD.status != 'paid' AND NEW.payment_type = 'retainer' THEN
    
    SELECT c.name INTO v_client_name FROM clients c WHERE c.id = NEW.client_id;
    
    FOR v_admin IN 
      SELECT ur.user_id FROM user_roles ur WHERE ur.role IN ('super_admin', 'admin')
    LOOP
      INSERT INTO smart_alerts (
        to_user_id, alert_type, entity_type, entity_id,
        title, message, priority, severity,
        recipient_type, recipient_id, alert_day, deliver_by
      ) VALUES (
        v_admin.user_id, 'retainer_paid', 'billing_record', NEW.id,
        'ריטיינר שולם - עבודה שוחררה!',
        'לקוח: ' || COALESCE(v_client_name, 'לא ידוע') || ' - ₪' || COALESCE(NEW.total_amount::text, '0'),
        'urgent', 'critical', 'user', v_admin.user_id, CURRENT_DATE, now()
      )
      ON CONFLICT (alert_type, entity_type, entity_id, alert_day, recipient_type, recipient_id)
      WHERE entity_id IS NOT NULL AND recipient_id IS NOT NULL
      DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_retainer_paid ON public.billing_records;
CREATE TRIGGER trigger_notify_retainer_paid
  AFTER UPDATE OF status ON public.billing_records
  FOR EACH ROW
  EXECUTE FUNCTION notify_retainer_paid();

-- N8: Payment overdue
CREATE OR REPLACE FUNCTION public.notify_payment_overdue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin record;
  v_contact record;
  v_client_name text;
BEGIN
  IF NEW.status = 'overdue' AND OLD.status != 'overdue' THEN
    SELECT c.name INTO v_client_name FROM clients c WHERE c.id = NEW.client_id;
    
    FOR v_admin IN 
      SELECT ur.user_id FROM user_roles ur WHERE ur.role IN ('super_admin', 'admin')
    LOOP
      INSERT INTO smart_alerts (
        to_user_id, alert_type, entity_type, entity_id,
        title, message, priority, severity,
        recipient_type, recipient_id, alert_day, deliver_by
      ) VALUES (
        v_admin.user_id, 'payment_overdue', 'billing_record', NEW.id,
        'תשלום באיחור!',
        'לקוח: ' || COALESCE(v_client_name, 'לא ידוע') || ' - ₪' || COALESCE(NEW.total_amount::text, '0'),
        'urgent', 'critical', 'user', v_admin.user_id, CURRENT_DATE, now()
      )
      ON CONFLICT (alert_type, entity_type, entity_id, alert_day, recipient_type, recipient_id)
      WHERE entity_id IS NOT NULL AND recipient_id IS NOT NULL
      DO NOTHING;
    END LOOP;
    
    FOR v_contact IN 
      SELECT cc.id FROM client_contacts cc
      WHERE cc.client_id = NEW.client_id AND cc.notify = true
    LOOP
      INSERT INTO smart_alerts (
        to_user_id, alert_type, entity_type, entity_id,
        title, message, priority, severity,
        recipient_type, recipient_id, alert_day, deliver_by
      ) VALUES (
        NULL, 'payment_overdue', 'billing_record', NEW.id,
        'תשלום באיחור',
        'סכום: ₪' || COALESCE(NEW.total_amount::text, '0'),
        'urgent', 'critical', 'client_contact', v_contact.id, CURRENT_DATE, now()
      )
      ON CONFLICT (alert_type, entity_type, entity_id, alert_day, recipient_type, recipient_id)
      WHERE entity_id IS NOT NULL AND recipient_id IS NOT NULL
      DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_payment_overdue ON public.billing_records;
CREATE TRIGGER trigger_notify_payment_overdue
  AFTER UPDATE OF status ON public.billing_records
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_overdue();

-- =====================================================
-- A2) CRON RULES - Update generate_daily_alerts
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_daily_alerts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := CURRENT_DATE;
  v_settings record;
  v_result jsonb := '{"alerts_created": 0}'::jsonb;
  v_count integer := 0;
  v_admin record;
  v_task record;
  v_project record;
  v_payment record;
BEGIN
  SELECT * INTO v_settings FROM agency_settings LIMIT 1;
  
  -- CN1: Mark overdue payments
  FOR v_payment IN
    SELECT br.*, c.name as client_name
    FROM billing_records br
    JOIN clients c ON c.id = br.client_id
    WHERE br.status = 'pending' AND br.due_date < v_today
  LOOP
    UPDATE billing_records SET status = 'overdue' WHERE id = v_payment.id;
    
    FOR v_admin IN SELECT ur.user_id FROM user_roles ur WHERE ur.role IN ('super_admin', 'admin')
    LOOP
      INSERT INTO smart_alerts (
        to_user_id, alert_type, entity_type, entity_id,
        title, message, priority, severity,
        recipient_type, recipient_id, alert_day, deliver_by
      ) VALUES (
        v_admin.user_id, 'payment_overdue', 'billing_record', v_payment.id,
        'תשלום באיחור!',
        'לקוח: ' || COALESCE(v_payment.client_name, 'לא ידוע') || ' - ₪' || COALESCE(v_payment.total_amount::text, '0'),
        'urgent', 'critical', 'user', v_admin.user_id, v_today, now()
      )
      ON CONFLICT (alert_type, entity_type, entity_id, alert_day, recipient_type, recipient_id)
      WHERE entity_id IS NOT NULL AND recipient_id IS NOT NULL
      DO NOTHING;
      v_count := v_count + 1;
    END LOOP;
  END LOOP;
  
  -- CN2: Client delay alerts
  FOR v_task IN
    SELECT t.*, c.name as client_name
    FROM tasks t LEFT JOIN clients c ON c.id = t.client_id
    WHERE t.status IN ('waiting', 'blocked')
    AND t.waiting_since <= (v_today - COALESCE(v_settings.client_delay_threshold_days, 4))
    AND t.status != 'completed'
  LOOP
    FOR v_admin IN SELECT ur.user_id FROM user_roles ur WHERE ur.role IN ('super_admin', 'admin')
    LOOP
      INSERT INTO smart_alerts (
        to_user_id, alert_type, entity_type, entity_id,
        title, message, priority, severity,
        recipient_type, recipient_id, alert_day, deliver_by
      ) VALUES (
        v_admin.user_id, 'client_delay', 'task', v_task.id,
        'עיכוב לקוח: ' || COALESCE(v_task.title, 'משימה'),
        'ממתין ' || (v_today - v_task.waiting_since) || ' ימים - ' || COALESCE(v_task.client_name, ''),
        'high', 'warn', 'user', v_admin.user_id, v_today,
        calc_delivery_time('user', v_admin.user_id, 'warn')
      )
      ON CONFLICT (alert_type, entity_type, entity_id, alert_day, recipient_type, recipient_id)
      WHERE entity_id IS NOT NULL AND recipient_id IS NOT NULL
      DO NOTHING;
      v_count := v_count + 1;
    END LOOP;
  END LOOP;
  
  -- CN3: Task overdue alerts
  FOR v_task IN
    SELECT t.*, c.name as client_name
    FROM tasks t LEFT JOIN clients c ON c.id = t.client_id
    WHERE t.due_date < v_today AND t.status NOT IN ('completed', 'cancelled')
  LOOP
    IF v_task.assignee IS NOT NULL THEN
      INSERT INTO smart_alerts (
        to_user_id, alert_type, entity_type, entity_id,
        title, message, priority, severity,
        recipient_type, recipient_id, alert_day, deliver_by
      ) VALUES (
        v_task.assignee, 'task_overdue', 'task', v_task.id,
        'משימה באיחור: ' || COALESCE(v_task.title, 'משימה'),
        'לקוח: ' || COALESCE(v_task.client_name, 'לא ידוע'),
        'high', 'warn', 'user', v_task.assignee, v_today,
        calc_delivery_time('user', v_task.assignee, 'warn')
      )
      ON CONFLICT (alert_type, entity_type, entity_id, alert_day, recipient_type, recipient_id)
      WHERE entity_id IS NOT NULL AND recipient_id IS NOT NULL
      DO NOTHING;
      v_count := v_count + 1;
    END IF;
  END LOOP;
  
  -- CN4: Projects at risk
  FOR v_project IN
    SELECT p.*, c.name as client_name
    FROM projects p JOIN clients c ON c.id = p.client_id
    WHERE p.status = 'active' AND p.work_state = 'work_ok'
    AND p.last_activity_at < (now() - (COALESCE(v_settings.project_stalled_threshold_days, 4) || ' days')::interval)
    AND (p.at_risk IS NULL OR p.at_risk = false)
  LOOP
    UPDATE projects SET at_risk = true WHERE id = v_project.id;
    
    FOR v_admin IN SELECT ur.user_id FROM user_roles ur WHERE ur.role IN ('super_admin', 'admin')
    LOOP
      INSERT INTO smart_alerts (
        to_user_id, alert_type, entity_type, entity_id,
        title, message, priority, severity,
        recipient_type, recipient_id, alert_day, deliver_by
      ) VALUES (
        v_admin.user_id, 'project_stalled', 'project', v_project.id,
        'פרויקט תקוע: ' || COALESCE(v_project.name, 'פרויקט'),
        'לקוח: ' || COALESCE(v_project.client_name, '') || ' - אין תזוזה ' || 
          EXTRACT(DAY FROM (now() - v_project.last_activity_at))::integer || ' ימים',
        'normal', 'warn', 'user', v_admin.user_id, v_today,
        calc_delivery_time('user', v_admin.user_id, 'warn')
      )
      ON CONFLICT (alert_type, entity_type, entity_id, alert_day, recipient_type, recipient_id)
      WHERE entity_id IS NOT NULL AND recipient_id IS NOT NULL
      DO NOTHING;
      v_count := v_count + 1;
    END LOOP;
  END LOOP;
  
  -- CN5: Work blocked by payment reminder
  FOR v_project IN
    SELECT p.*, c.name as client_name
    FROM projects p JOIN clients c ON c.id = p.client_id
    WHERE p.work_state = 'blocked_payment' AND p.status != 'completed'
  LOOP
    FOR v_admin IN SELECT ur.user_id FROM user_roles ur WHERE ur.role IN ('super_admin', 'admin')
    LOOP
      INSERT INTO smart_alerts (
        to_user_id, alert_type, entity_type, entity_id,
        title, message, priority, severity,
        recipient_type, recipient_id, alert_day, deliver_by
      ) VALUES (
        v_admin.user_id, 'work_blocked', 'project', v_project.id,
        'עבודה חסומה: ' || COALESCE(v_project.name, 'פרויקט'),
        'לקוח: ' || COALESCE(v_project.client_name, '') || ' - ממתין לתשלום',
        'urgent', 'critical', 'user', v_admin.user_id, v_today, now()
      )
      ON CONFLICT (alert_type, entity_type, entity_id, alert_day, recipient_type, recipient_id)
      WHERE entity_id IS NOT NULL AND recipient_id IS NOT NULL
      DO NOTHING;
      v_count := v_count + 1;
    END LOOP;
  END LOOP;
  
  v_result := jsonb_build_object('alerts_created', v_count, 'run_at', now());
  RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.calc_delivery_time TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_daily_alerts TO authenticated;