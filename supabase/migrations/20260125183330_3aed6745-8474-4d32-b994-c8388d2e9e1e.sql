-- Add missing approved_by_client column to project_stages
ALTER TABLE public.project_stages
  ADD COLUMN IF NOT EXISTS approved_by_client BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS client_approved_at TIMESTAMPTZ;

-- Add sent_at to quotes table for tracking when proposal was sent
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- Create function to auto-update waiting_since on tasks when status changes to waiting
CREATE OR REPLACE FUNCTION public.handle_task_waiting_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When status changes to waiting, set waiting_since
  IF NEW.status = 'waiting' AND (OLD.status IS NULL OR OLD.status != 'waiting') THEN
    NEW.waiting_since = NOW();
  END IF;
  
  -- When status changes from waiting to something else, clear waiting_since
  IF OLD.status = 'waiting' AND NEW.status != 'waiting' THEN
    NEW.waiting_since = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for task waiting status
DROP TRIGGER IF EXISTS trigger_task_waiting_status ON public.tasks;
CREATE TRIGGER trigger_task_waiting_status
  BEFORE UPDATE OF status ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_task_waiting_status();