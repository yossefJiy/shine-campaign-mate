
-- Task activity/timeline table for comments, status changes, etc.
CREATE TABLE public.task_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  activity_type TEXT NOT NULL, -- 'comment', 'status_change', 'attachment', 'reminder', 'assignment', 'created'
  content TEXT, -- comment text or description
  metadata JSONB, -- old/new status, attachment info, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_activity ENABLE ROW LEVEL SECURITY;

-- RLS policies - authenticated users can read and insert
CREATE POLICY "Authenticated users can read task activity"
  ON public.task_activity FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert task activity"
  ON public.task_activity FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can delete own activity"
  ON public.task_activity FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Index for fast lookups
CREATE INDEX idx_task_activity_task_id ON public.task_activity(task_id);
CREATE INDEX idx_task_activity_created ON public.task_activity(task_id, created_at DESC);

-- Trigger to log status changes automatically
CREATE OR REPLACE FUNCTION public.log_task_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.task_activity (task_id, user_id, activity_type, content, metadata)
    VALUES (
      NEW.id,
      auth.uid(),
      'status_change',
      'סטטוס שונה',
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  
  IF OLD.assignee IS DISTINCT FROM NEW.assignee AND NEW.assignee IS NOT NULL THEN
    INSERT INTO public.task_activity (task_id, user_id, activity_type, content, metadata)
    VALUES (
      NEW.id,
      auth.uid(),
      'assignment',
      'משימה שויכה',
      jsonb_build_object('assignee', NEW.assignee)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_task_status_change
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_task_status_change();
