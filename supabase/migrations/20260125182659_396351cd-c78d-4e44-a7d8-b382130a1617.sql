-- Add missing fields to projects table for payment management
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS work_state TEXT DEFAULT 'work_ok' CHECK (work_state IN ('work_ok', 'blocked_payment')),
  ADD COLUMN IF NOT EXISTS retainer_plan TEXT DEFAULT 'standard' CHECK (retainer_plan IN ('standard', 'package_4350', 'custom')),
  ADD COLUMN IF NOT EXISTS monthly_retainer_amount NUMERIC DEFAULT 0;

-- Add project_id to billing_records for direct project-payment relationship
ALTER TABLE public.billing_records
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_billing_records_project_id ON public.billing_records(project_id);

-- Create function to handle retainer payment status changes
CREATE OR REPLACE FUNCTION public.handle_retainer_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When a retainer payment is marked as paid, release the project
  IF NEW.payment_type = 'retainer' AND NEW.status = 'paid' AND OLD.status != 'paid' THEN
    UPDATE public.projects
    SET work_state = 'work_ok',
        status = CASE WHEN status = 'waiting_payment' THEN 'active' ELSE status END,
        updated_at = NOW()
    WHERE id = NEW.project_id;
    
    -- Create notification for admin
    INSERT INTO public.smart_alerts (to_user_id, alert_type, entity_type, entity_id, title, message, priority)
    SELECT ur.user_id, 'payment_received', 'project', NEW.project_id,
           'ריטיינר שולם', 
           format('ריטיינר עבור פרויקט שולם - אפשר להתחיל לעבוד'),
           'normal'
    FROM public.user_roles ur
    WHERE ur.role IN ('super_admin', 'admin')
    LIMIT 1;
  END IF;
  
  -- When a retainer payment becomes overdue, block the project
  IF NEW.payment_type = 'retainer' AND NEW.status = 'overdue' AND OLD.status != 'overdue' THEN
    UPDATE public.projects
    SET work_state = 'blocked_payment',
        status = 'waiting_payment',
        updated_at = NOW()
    WHERE id = NEW.project_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for payment status changes
DROP TRIGGER IF EXISTS trigger_retainer_payment_status ON public.billing_records;
CREATE TRIGGER trigger_retainer_payment_status
  AFTER UPDATE OF status ON public.billing_records
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_retainer_payment_status();

-- Update generate_daily_alerts to also update work_state based on overdue payments
CREATE OR REPLACE FUNCTION public.mark_projects_blocked_by_payment()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Block projects with overdue retainer payments
  UPDATE public.projects p
  SET work_state = 'blocked_payment',
      status = 'waiting_payment',
      updated_at = NOW()
  FROM public.billing_records br
  WHERE br.project_id = p.id
    AND br.payment_type = 'retainer'
    AND br.status = 'overdue'
    AND p.work_state != 'blocked_payment';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;