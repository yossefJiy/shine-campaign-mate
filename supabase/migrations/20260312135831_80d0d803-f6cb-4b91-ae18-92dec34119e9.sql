
-- 1. Add responsibility_domains to team table
ALTER TABLE public.team ADD COLUMN IF NOT EXISTS responsibility_domains TEXT[] DEFAULT '{}';

-- 2. Add operational ownership fields to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id);
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS org_team_id UUID REFERENCES public.org_teams(id);
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assignment_scope TEXT NOT NULL DEFAULT 'individual';

-- 3. Language enforcement trigger: Dev/API/SEO/QA tasks must be English
CREATE OR REPLACE FUNCTION public.enforce_task_language()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_dept_name TEXT;
  v_team_name TEXT;
BEGIN
  -- Check department name
  IF NEW.department_id IS NOT NULL THEN
    SELECT name INTO v_dept_name FROM public.departments WHERE id = NEW.department_id;
  END IF;

  -- Check org team name
  IF NEW.org_team_id IS NOT NULL THEN
    SELECT name INTO v_team_name FROM public.org_teams WHERE id = NEW.org_team_id;
  END IF;

  -- Also check the text department field for backward compatibility
  IF v_dept_name IN ('Development', 'פיתוח') 
     OR v_team_name IN ('Core Development', 'API', 'SEO', 'QA')
     OR NEW.department IN ('Development', 'פיתוח', 'API', 'SEO', 'QA') THEN
    IF NEW.task_language IS NOT NULL AND NEW.task_language != 'en' THEN
      RAISE EXCEPTION 'Tasks assigned to Development/API/SEO/QA must be in English (task_language = en)';
    END IF;
    -- Force English if not set
    IF NEW.task_language IS NULL OR NEW.task_language = '' THEN
      NEW.task_language := 'en';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_task_language_trigger ON public.tasks;
CREATE TRIGGER enforce_task_language_trigger
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_task_language();
