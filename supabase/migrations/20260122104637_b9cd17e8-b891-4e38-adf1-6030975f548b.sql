-- Drop existing restrictive SELECT policy on projects
DROP POLICY IF EXISTS "Users can view projects for their clients" ON public.projects;

-- Create a more permissive SELECT policy that includes role-based access
CREATE POLICY "Users can view projects" ON public.projects
FOR SELECT USING (
  -- Admin and manager roles can see all projects
  public.has_role_level(auth.uid(), 'employee'::app_role)
  OR
  -- Client users can see their client's projects
  EXISTS (
    SELECT 1 FROM client_users cu
    WHERE cu.client_id = projects.client_id AND cu.user_id = auth.uid()
  )
  OR
  -- Team members can see all projects
  EXISTS (
    SELECT 1 FROM team t
    WHERE t.user_id = auth.uid() AND t.is_active = true
  )
);

-- Also update the management policies to include role-based access
DROP POLICY IF EXISTS "Team members can manage projects" ON public.projects;
DROP POLICY IF EXISTS "Team members can update projects" ON public.projects;
DROP POLICY IF EXISTS "Team members can delete projects" ON public.projects;

-- Create new update policy
CREATE POLICY "Users can update projects" ON public.projects
FOR UPDATE USING (
  public.has_role_level(auth.uid(), 'employee'::app_role)
  OR
  EXISTS (SELECT 1 FROM team t WHERE t.user_id = auth.uid() AND t.is_active = true)
);

-- Create new delete policy
CREATE POLICY "Users can delete projects" ON public.projects
FOR DELETE USING (
  public.has_role_level(auth.uid(), 'team_manager'::app_role)
  OR
  EXISTS (SELECT 1 FROM team t WHERE t.user_id = auth.uid() AND t.is_active = true)
);