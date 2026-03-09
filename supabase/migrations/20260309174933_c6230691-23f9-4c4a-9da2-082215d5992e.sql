
-- Update source check to include manual_retainer
ALTER TABLE public.projects DROP CONSTRAINT projects_source_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_source_check 
  CHECK (source = ANY (ARRAY['proposal', 'internal', 'import', 'manual_retainer']));

-- Update status check to include waiting_payment and waiting_client
ALTER TABLE public.projects DROP CONSTRAINT projects_status_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check 
  CHECK (status = ANY (ARRAY['active', 'paused', 'completed', 'archived', 'waiting_payment', 'waiting_client', 'on_hold']));
