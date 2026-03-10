
-- Add universal task fields
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS task_type text DEFAULT 'operations',
  ADD COLUMN IF NOT EXISTS expected_result text,
  ADD COLUMN IF NOT EXISTS reference_links text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS qa_result text,
  ADD COLUMN IF NOT EXISTS completion_proof text,
  ADD COLUMN IF NOT EXISTS completed_by uuid,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS completion_notes text,
  ADD COLUMN IF NOT EXISTS ready_for_qa boolean DEFAULT false;

-- Add constraint for task_type
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_task_type'
  ) THEN
    ALTER TABLE public.tasks ADD CONSTRAINT valid_task_type
      CHECK (task_type IN ('development', 'design', 'qa', 'seo', 'content', 'operations'));
  END IF;
END $$;

-- Auto-set completed_by and completed_at when status changes to completed
CREATE OR REPLACE FUNCTION public.handle_task_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    NEW.completed_at := now();
    NEW.completed_by := auth.uid();
  END IF;
  
  -- Clear completion fields if status changes away from completed
  IF OLD.status = 'completed' AND NEW.status != 'completed' THEN
    NEW.completed_at := NULL;
    NEW.completed_by := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_task_completion ON public.tasks;
CREATE TRIGGER trg_task_completion
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_task_completion();
