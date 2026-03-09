
-- =====================================================
-- TEAM AS SINGLE SOURCE OF TRUTH FOR INTERNAL USERS
-- =====================================================

-- 1. Add system access flag to team table
ALTER TABLE public.team ADD COLUMN IF NOT EXISTS has_system_access boolean DEFAULT false;

-- 2. Create team_member_scopes table for client/project/stage/task level access
CREATE TABLE IF NOT EXISTS public.team_member_scopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid NOT NULL REFERENCES public.team(id) ON DELETE CASCADE,
  scope_type text NOT NULL CHECK (scope_type IN ('client', 'project', 'stage', 'task')),
  scope_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid,
  UNIQUE(team_member_id, scope_type, scope_id)
);

ALTER TABLE public.team_member_scopes ENABLE ROW LEVEL SECURITY;

-- RLS: admins can manage scopes, users can read their own
CREATE POLICY "Admins manage scopes" ON public.team_member_scopes
  FOR ALL TO authenticated
  USING (public.has_admin_privilege(auth.uid()))
  WITH CHECK (public.has_admin_privilege(auth.uid()));

CREATE POLICY "Users read own scopes" ON public.team_member_scopes
  FOR SELECT TO authenticated
  USING (
    team_member_id IN (
      SELECT id FROM public.team WHERE user_id = auth.uid()
    )
  );

-- Managers can manage scopes for their reports
CREATE POLICY "Managers manage report scopes" ON public.team_member_scopes
  FOR ALL TO authenticated
  USING (
    team_member_id IN (
      SELECT id FROM public.team WHERE manager_id IN (
        SELECT id FROM public.team WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    team_member_id IN (
      SELECT id FROM public.team WHERE manager_id IN (
        SELECT id FROM public.team WHERE user_id = auth.uid()
      )
    )
  );

-- 3. Function to sync team member system access to auth tables
CREATE OR REPLACE FUNCTION public.sync_team_member_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_email text;
  v_role app_role;
BEGIN
  -- Get primary email
  v_email := COALESCE(NEW.email, '');
  
  IF v_email = '' THEN
    RETURN NEW;
  END IF;

  -- Map operational_role to app_role
  v_role := CASE NEW.operational_role
    WHEN 'department_manager' THEN 'department_manager'::app_role
    WHEN 'team_manager' THEN 'team_manager'::app_role
    WHEN 'team_employee' THEN 'employee'::app_role
    ELSE 'employee'::app_role
  END;

  IF NEW.has_system_access = true THEN
    -- Upsert into authorized_emails
    INSERT INTO public.authorized_emails (email, name, role, is_active)
    VALUES (v_email, NEW.name, v_role, true)
    ON CONFLICT (email) DO UPDATE SET
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      is_active = true,
      updated_at = now();

    -- If user_id exists, sync user_roles
    IF NEW.user_id IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.user_id, v_role)
      ON CONFLICT (user_id, role) DO UPDATE SET role = EXCLUDED.role;
      
      -- Delete other roles for this user (single role model)
      DELETE FROM public.user_roles 
      WHERE user_id = NEW.user_id AND role != v_role;
    END IF;

  ELSIF NEW.has_system_access = false AND OLD.has_system_access = true THEN
    -- Deactivate in authorized_emails
    UPDATE public.authorized_emails 
    SET is_active = false, updated_at = now()
    WHERE email = v_email;
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger
DROP TRIGGER IF EXISTS tr_sync_team_member_access ON public.team;
CREATE TRIGGER tr_sync_team_member_access
  AFTER INSERT OR UPDATE OF has_system_access, email, operational_role, name
  ON public.team
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_team_member_access();

-- 4. Function to sync privileges from team to user_privileges
CREATE OR REPLACE FUNCTION public.sync_team_member_privileges(
  p_team_member_id uuid,
  p_is_admin boolean DEFAULT false,
  p_is_super_admin boolean DEFAULT false,
  p_can_view_proposals boolean DEFAULT false,
  p_can_view_prices boolean DEFAULT false,
  p_can_invite_users boolean DEFAULT false,
  p_can_create_teams boolean DEFAULT false,
  p_can_manage_project_assignments boolean DEFAULT false,
  p_can_manage_client_assignments boolean DEFAULT false,
  p_can_override_hierarchy boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id FROM public.team WHERE id = p_team_member_id;
  
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.user_privileges (
    user_id, is_admin, is_super_admin,
    can_view_proposals, can_view_prices, can_invite_users,
    can_create_teams, can_manage_project_assignments,
    can_manage_client_assignments, can_override_hierarchy
  ) VALUES (
    v_user_id, p_is_admin, p_is_super_admin,
    p_can_view_proposals, p_can_view_prices, p_can_invite_users,
    p_can_create_teams, p_can_manage_project_assignments,
    p_can_manage_client_assignments, p_can_override_hierarchy
  )
  ON CONFLICT (user_id) DO UPDATE SET
    is_admin = EXCLUDED.is_admin,
    is_super_admin = EXCLUDED.is_super_admin,
    can_view_proposals = EXCLUDED.can_view_proposals,
    can_view_prices = EXCLUDED.can_view_prices,
    can_invite_users = EXCLUDED.can_invite_users,
    can_create_teams = EXCLUDED.can_create_teams,
    can_manage_project_assignments = EXCLUDED.can_manage_project_assignments,
    can_manage_client_assignments = EXCLUDED.can_manage_client_assignments,
    can_override_hierarchy = EXCLUDED.can_override_hierarchy,
    updated_at = now();
END;
$function$;

-- 5. Function to check scope-based access
CREATE OR REPLACE FUNCTION public.has_scope_access(_user_id uuid, _scope_type text, _scope_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    -- Admins have global access
    public.has_admin_privilege(_user_id)
    OR
    -- Direct scope assignment
    EXISTS (
      SELECT 1 FROM public.team_member_scopes tms
      JOIN public.team t ON t.id = tms.team_member_id
      WHERE t.user_id = _user_id
        AND tms.scope_type = _scope_type
        AND tms.scope_id = _scope_id
    )
    OR
    -- Client scope implies project/stage/task access
    (_scope_type = 'project' AND EXISTS (
      SELECT 1 FROM public.team_member_scopes tms
      JOIN public.team t ON t.id = tms.team_member_id
      JOIN public.projects p ON p.id = _scope_id
      WHERE t.user_id = _user_id
        AND tms.scope_type = 'client'
        AND tms.scope_id = p.client_id
    ))
    OR
    -- Manager can see reports' scopes
    EXISTS (
      SELECT 1 FROM public.team_member_scopes tms
      JOIN public.team report ON report.id = tms.team_member_id
      JOIN public.team manager ON manager.id = report.manager_id
      WHERE manager.user_id = _user_id
        AND tms.scope_type = _scope_type
        AND tms.scope_id = _scope_id
    )
$function$;

-- 6. Update existing team members: set has_system_access for those with emails in authorized_emails
UPDATE public.team t
SET has_system_access = true
FROM public.authorized_emails ae
WHERE ae.email = t.email AND ae.is_active = true;

-- 7. Link team user_ids from auth.users where emails match
UPDATE public.team t
SET user_id = au.id
FROM auth.users au
WHERE au.email = t.email AND t.user_id IS NULL;
