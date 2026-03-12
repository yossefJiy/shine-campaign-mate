-- Fix notify_task_assigned trigger to cast assignee TEXT to UUID
CREATE OR REPLACE FUNCTION public.notify_task_assigned()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_client_name text;
  v_assignee_uuid uuid;
BEGIN
  IF NEW.assignee IS NOT NULL AND 
     (OLD.assignee IS NULL OR OLD.assignee != NEW.assignee) THEN
    
    -- Safely cast assignee to UUID
    BEGIN
      v_assignee_uuid := NEW.assignee::uuid;
    EXCEPTION WHEN OTHERS THEN
      RETURN NEW;
    END;
    
    SELECT c.name INTO v_client_name FROM clients c WHERE c.id = NEW.client_id;
    
    INSERT INTO smart_alerts (
      to_user_id, alert_type, entity_type, entity_id,
      title, message, priority, severity,
      recipient_type, recipient_id, alert_day, deliver_by
    ) VALUES (
      v_assignee_uuid, 'task_assigned', 'task', NEW.id,
      'משימה חדשה: ' || COALESCE(NEW.title, 'ללא כותרת'),
      'לקוח: ' || COALESCE(v_client_name, 'לא ידוע'),
      'normal', 'info', 'user', v_assignee_uuid::text, CURRENT_DATE,
      calc_delivery_time('user', v_assignee_uuid::text, 'info')
    )
    ON CONFLICT (alert_type, entity_type, entity_id, alert_day, recipient_type, recipient_id)
    WHERE entity_id IS NOT NULL AND recipient_id IS NOT NULL
    DO UPDATE SET title = EXCLUDED.title, message = EXCLUDED.message;
  END IF;
  
  RETURN NEW;
END;
$function$;