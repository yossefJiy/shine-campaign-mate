
-- Create project_team table for project-level team assignment
CREATE TABLE IF NOT EXISTS public.project_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  team_member_id uuid NOT NULL REFERENCES public.team(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  created_at timestamptz DEFAULT now(),
  UNIQUE (project_id, team_member_id)
);

ALTER TABLE public.project_team ENABLE ROW LEVEL SECURITY;

-- Admins can manage project teams
CREATE POLICY "Admins manage project_team" ON public.project_team
  FOR ALL TO authenticated
  USING (public.has_role_level(auth.uid(), 'employee'::app_role))
  WITH CHECK (public.has_role_level(auth.uid(), 'team_manager'::app_role));

-- Select for all authenticated (employees can see assignments)
CREATE POLICY "Employees can view project_team" ON public.project_team
  FOR SELECT TO authenticated
  USING (public.has_role_level(auth.uid(), 'employee'::app_role));
