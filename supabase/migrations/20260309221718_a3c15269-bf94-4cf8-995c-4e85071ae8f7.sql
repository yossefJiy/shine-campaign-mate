
-- Secure team member update function with full permission enforcement
CREATE OR REPLACE FUNCTION public.update_team_member_secure(
  p_team_member_id uuid,
  -- Personal fields (self-editable)
  p_name text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_emails text[] DEFAULT NULL,
  p_phones text[] DEFAULT NULL,
  p_departments text[] DEFAULT NULL,
  p_avatar_color text DEFAULT NULL,
  -- Organizational fields (admin or hierarchy manager only)
  p_operational_role text DEFAULT NULL,
  p_department_id uuid DEFAULT NULL,
  p_org_team_id uuid DEFAULT NULL,
  p_manager_id uuid DEFAULT NULL,
  p_has_system_access boolean DEFAULT NULL,
  -- Scope fields (admin or hierarchy manager only)
  p_client_scopes uuid[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_caller_is_admin boolean;
  v_caller_is_super_admin boolean;
  v_target_user_id uuid;
  v_caller_team_id uuid;
  v_is_self_edit boolean := false;
  v_is_in_hierarchy boolean := false;
  v_current_manager_id uuid;
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

  -- Get target's user_id
  SELECT user_id INTO v_target_user_id FROM public.team WHERE id = p_team_member_id;
  
  -- Check if self-edit
  v_is_self_edit := (v_target_user_id IS NOT NULL AND v_target_user_id = v_caller_id);

  -- Check hierarchy: is caller a manager (direct or transitive) of the target?
  IF NOT v_caller_is_admin AND NOT v_is_self_edit THEN
    -- Get caller's team record
    SELECT id INTO v_caller_team_id FROM public.team WHERE user_id = v_caller_id LIMIT 1;
    
    -- Walk up the target's manager chain to see if caller is in it
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

  -- RULE: No self-privilege-escalation
  IF v_is_self_edit AND NOT v_caller_is_super_admin THEN
    -- Cannot change own: operational_role, manager, department, team, system access
    IF p_operational_role IS NOT NULL OR p_department_id IS NOT NULL OR 
       p_org_team_id IS NOT NULL OR p_manager_id IS NOT NULL OR 
       p_has_system_access IS NOT NULL THEN
      RAISE EXCEPTION 'Cannot modify your own organizational or system fields';
    END IF;
    IF p_client_scopes IS NOT NULL THEN
      RAISE EXCEPTION 'Cannot modify your own scope assignments';
    END IF;
  END IF;

  -- RULE: Only admin/super_admin can change system-level fields
  IF NOT v_caller_is_admin THEN
    IF p_operational_role IS NOT NULL OR p_has_system_access IS NOT NULL THEN
      RAISE EXCEPTION 'Only admins can modify system-level fields';
    END IF;
  END IF;

  -- RULE: Non-admin hierarchy managers can only change personal + scope fields within their hierarchy
  -- (organizational fields like role, department, team, manager require admin)
  IF NOT v_caller_is_admin AND v_is_in_hierarchy THEN
    IF p_operational_role IS NOT NULL OR p_department_id IS NOT NULL OR 
       p_org_team_id IS NOT NULL OR p_manager_id IS NOT NULL OR 
       p_has_system_access IS NOT NULL THEN
      RAISE EXCEPTION 'Only admins can modify organizational structure fields';
    END IF;
  END IF;

  -- Apply personal field updates (always allowed for self or hierarchy manager or admin)
  UPDATE public.team SET
    name = COALESCE(p_name, name),
    email = COALESCE(p_email, email),
    emails = COALESCE(p_emails, emails),
    phones = COALESCE(p_phones, phones),
    departments = COALESCE(p_departments, departments),
    avatar_color = COALESCE(p_avatar_color, avatar_color),
    -- Organizational fields: only set if caller has permission (checked above)
    operational_role = CASE WHEN p_operational_role IS NOT NULL AND v_caller_is_admin THEN p_operational_role ELSE operational_role END,
    department_id = CASE WHEN p_department_id IS NOT NULL AND v_caller_is_admin THEN p_department_id ELSE department_id END,
    org_team_id = CASE WHEN p_org_team_id IS NOT NULL AND v_caller_is_admin THEN p_org_team_id ELSE org_team_id END,
    manager_id = CASE WHEN p_manager_id IS NOT NULL AND v_caller_is_admin THEN p_manager_id ELSE manager_id END,
    has_system_access = CASE WHEN p_has_system_access IS NOT NULL AND v_caller_is_admin THEN p_has_system_access ELSE has_system_access END,
    updated_at = now()
  WHERE id = p_team_member_id;

  -- Sync client scopes (only admin or hierarchy manager, not self unless super_admin)
  IF p_client_scopes IS NOT NULL THEN
    -- Delete existing client scopes
    DELETE FROM public.team_member_scopes 
    WHERE team_member_id = p_team_member_id AND scope_type = 'client';
    
    -- Insert new scopes
    IF array_length(p_client_scopes, 1) > 0 THEN
      INSERT INTO public.team_member_scopes (team_member_id, scope_type, scope_id)
      SELECT p_team_member_id, 'client', unnest(p_client_scopes);
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'is_self_edit', v_is_self_edit);
END;
$$;
