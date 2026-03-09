
-- Fix update_team_member_secure to allow admin/super_admin self-scope assignment
-- while still blocking self-privilege escalation
CREATE OR REPLACE FUNCTION public.update_team_member_secure(
  p_team_member_id uuid,
  p_name text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_emails text[] DEFAULT NULL,
  p_phones text[] DEFAULT NULL,
  p_departments text[] DEFAULT NULL,
  p_avatar_color text DEFAULT NULL,
  p_operational_role text DEFAULT NULL,
  p_department_id uuid DEFAULT NULL,
  p_org_team_id uuid DEFAULT NULL,
  p_manager_id uuid DEFAULT NULL,
  p_has_system_access boolean DEFAULT NULL,
  p_client_scopes uuid[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_id uuid := auth.uid();
  v_caller_is_admin boolean;
  v_caller_is_super_admin boolean;
  v_target_user_id uuid;
  v_caller_team_id uuid;
  v_is_self_edit boolean := false;
  v_is_in_hierarchy boolean := false;
  v_check_id uuid;
  v_depth int := 0;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get caller privileges
  SELECT 
    COALESCE(up.is_admin, false) OR COALESCE(up.is_super_admin, false),
    COALESCE(up.is_super_admin, false)
  INTO v_caller_is_admin, v_caller_is_super_admin
  FROM public.user_privileges up
  WHERE up.user_id = v_caller_id;

  -- Fallback to user_roles
  IF v_caller_is_admin IS NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM public.user_roles WHERE user_id = v_caller_id AND role IN ('super_admin', 'admin')
    ) INTO v_caller_is_admin;
    SELECT EXISTS(
      SELECT 1 FROM public.user_roles WHERE user_id = v_caller_id AND role = 'super_admin'
    ) INTO v_caller_is_super_admin;
  END IF;

  v_caller_is_admin := COALESCE(v_caller_is_admin, false);
  v_caller_is_super_admin := COALESCE(v_caller_is_super_admin, false);

  -- Get target user_id
  SELECT user_id INTO v_target_user_id FROM public.team WHERE id = p_team_member_id;
  v_is_self_edit := (v_target_user_id IS NOT NULL AND v_target_user_id = v_caller_id);

  -- Hierarchy check for non-admin, non-self
  IF NOT v_caller_is_admin AND NOT v_is_self_edit THEN
    SELECT id INTO v_caller_team_id FROM public.team WHERE user_id = v_caller_id LIMIT 1;
    
    SELECT manager_id INTO v_check_id FROM public.team WHERE id = p_team_member_id;
    WHILE v_check_id IS NOT NULL AND v_depth < 10 LOOP
      IF v_check_id = v_caller_team_id THEN
        v_is_in_hierarchy := true;
        EXIT;
      END IF;
      SELECT manager_id INTO v_check_id FROM public.team WHERE id = v_check_id;
      v_depth := v_depth + 1;
    END LOOP;
    
    IF NOT v_is_in_hierarchy THEN
      RAISE EXCEPTION 'You do not have permission to edit this team member';
    END IF;
  END IF;

  -- ============================================================
  -- SELF-EDIT RULES
  -- Distinction: privilege escalation (BLOCKED) vs scope assignment (ALLOWED for admin)
  -- ============================================================
  IF v_is_self_edit THEN
    -- Non-admin: cannot change ANY org/system fields on self
    IF NOT v_caller_is_admin THEN
      IF p_operational_role IS NOT NULL OR p_department_id IS NOT NULL OR 
         p_org_team_id IS NOT NULL OR p_manager_id IS NOT NULL OR 
         p_has_system_access IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot modify your own organizational or system fields';
      END IF;
      IF p_client_scopes IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot modify your own scope assignments';
      END IF;
    END IF;
    
    -- Admin (not super): cannot change own role, manager, system access
    IF v_caller_is_admin AND NOT v_caller_is_super_admin THEN
      IF p_operational_role IS NOT NULL OR p_manager_id IS NOT NULL OR 
         p_has_system_access IS NOT NULL THEN
        RAISE EXCEPTION 'Admins cannot modify their own role, manager, or system access';
      END IF;
    END IF;
    
    -- ALLOWED for admin/super_admin self-edit:
    -- - client_scopes (operational scope assignment, NOT privilege escalation)
    -- - department_id, org_team_id (for super_admin only - they can reorganize themselves)
  END IF;

  -- Non-admin restrictions
  IF NOT v_caller_is_admin THEN
    IF p_operational_role IS NOT NULL OR p_has_system_access IS NOT NULL THEN
      RAISE EXCEPTION 'Only admins can modify system-level fields';
    END IF;
    IF v_is_in_hierarchy THEN
      IF p_department_id IS NOT NULL OR p_org_team_id IS NOT NULL OR p_manager_id IS NOT NULL THEN
        RAISE EXCEPTION 'Only admins can modify organizational structure fields';
      END IF;
    END IF;
  END IF;

  -- Apply updates
  UPDATE public.team SET
    name = COALESCE(p_name, name),
    email = COALESCE(p_email, email),
    emails = COALESCE(p_emails, emails),
    phones = COALESCE(p_phones, phones),
    departments = COALESCE(p_departments, departments),
    avatar_color = COALESCE(p_avatar_color, avatar_color),
    operational_role = CASE 
      WHEN p_operational_role IS NOT NULL AND (v_caller_is_super_admin OR (v_caller_is_admin AND NOT v_is_self_edit))
      THEN p_operational_role ELSE operational_role END,
    department_id = CASE 
      WHEN p_department_id IS NOT NULL AND (v_caller_is_super_admin OR (v_caller_is_admin AND NOT v_is_self_edit))
      THEN p_department_id ELSE department_id END,
    org_team_id = CASE 
      WHEN p_org_team_id IS NOT NULL AND (v_caller_is_super_admin OR (v_caller_is_admin AND NOT v_is_self_edit))
      THEN p_org_team_id ELSE org_team_id END,
    manager_id = CASE 
      WHEN p_manager_id IS NOT NULL AND (v_caller_is_super_admin OR (v_caller_is_admin AND NOT v_is_self_edit))
      THEN p_manager_id ELSE manager_id END,
    has_system_access = CASE 
      WHEN p_has_system_access IS NOT NULL AND (v_caller_is_super_admin OR (v_caller_is_admin AND NOT v_is_self_edit))
      THEN p_has_system_access ELSE has_system_access END,
    updated_at = now()
  WHERE id = p_team_member_id;

  -- Sync scopes
  IF p_client_scopes IS NOT NULL THEN
    DELETE FROM public.team_member_scopes 
    WHERE team_member_id = p_team_member_id AND scope_type = 'client';
    
    IF array_length(p_client_scopes, 1) > 0 THEN
      INSERT INTO public.team_member_scopes (team_member_id, scope_type, scope_id)
      SELECT p_team_member_id, 'client', unnest(p_client_scopes);
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'is_self_edit', v_is_self_edit);
END;
$function$;

-- Update has_scope_access to support all 4 scope levels with cascading
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
    -- Client scope → project access
    (_scope_type = 'project' AND EXISTS (
      SELECT 1 FROM public.team_member_scopes tms
      JOIN public.team t ON t.id = tms.team_member_id
      JOIN public.projects p ON p.id = _scope_id
      WHERE t.user_id = _user_id
        AND tms.scope_type = 'client'
        AND tms.scope_id = p.client_id
    ))
    OR
    -- Client scope → stage access (via project)
    (_scope_type = 'stage' AND EXISTS (
      SELECT 1 FROM public.team_member_scopes tms
      JOIN public.team t ON t.id = tms.team_member_id
      JOIN public.project_stages ps ON ps.id = _scope_id
      JOIN public.projects p ON p.id = ps.project_id
      WHERE t.user_id = _user_id
        AND tms.scope_type = 'client'
        AND tms.scope_id = p.client_id
    ))
    OR
    -- Project scope → stage access
    (_scope_type = 'stage' AND EXISTS (
      SELECT 1 FROM public.team_member_scopes tms
      JOIN public.team t ON t.id = tms.team_member_id
      JOIN public.project_stages ps ON ps.id = _scope_id
      WHERE t.user_id = _user_id
        AND tms.scope_type = 'project'
        AND tms.scope_id = ps.project_id
    ))
    OR
    -- Client scope → task access
    (_scope_type = 'task' AND EXISTS (
      SELECT 1 FROM public.team_member_scopes tms
      JOIN public.team t ON t.id = tms.team_member_id
      JOIN public.tasks tk ON tk.id = _scope_id
      WHERE t.user_id = _user_id
        AND tms.scope_type = 'client'
        AND tms.scope_id = tk.client_id
    ))
    OR
    -- Project scope → task access
    (_scope_type = 'task' AND EXISTS (
      SELECT 1 FROM public.team_member_scopes tms
      JOIN public.team t ON t.id = tms.team_member_id
      JOIN public.tasks tk ON tk.id = _scope_id
      WHERE t.user_id = _user_id
        AND tms.scope_type = 'project'
        AND tms.scope_id = tk.project_id
    ))
    OR
    -- Stage scope → task access
    (_scope_type = 'task' AND EXISTS (
      SELECT 1 FROM public.team_member_scopes tms
      JOIN public.team t ON t.id = tms.team_member_id
      JOIN public.tasks tk ON tk.id = _scope_id
      WHERE t.user_id = _user_id
        AND tms.scope_type = 'stage'
        AND tms.scope_id = tk.stage_id
    ))
    OR
    -- Manager inherits reports' scopes
    EXISTS (
      SELECT 1 FROM public.team_member_scopes tms
      JOIN public.team report ON report.id = tms.team_member_id
      JOIN public.team manager ON manager.id = report.manager_id
      WHERE manager.user_id = _user_id
        AND tms.scope_type = _scope_type
        AND tms.scope_id = _scope_id
    )
$function$;

-- Add constraint to validate scope_type
ALTER TABLE public.team_member_scopes DROP CONSTRAINT IF EXISTS valid_scope_type;
ALTER TABLE public.team_member_scopes ADD CONSTRAINT valid_scope_type 
  CHECK (scope_type IN ('client', 'project', 'stage', 'task'));
