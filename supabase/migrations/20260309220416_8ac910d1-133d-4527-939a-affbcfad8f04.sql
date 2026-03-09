
-- =====================================================
-- A. Fix user/team identity linkage
-- =====================================================

-- 1. Backfill: Link Yosef's team record (already has user_id, confirm)
-- Already done: yossef@jiy.co.il -> baeb5142-8696-4d16-b175-b4196380a51e

-- 2. Create trigger function: when a new user signs up, auto-link to team table
CREATE OR REPLACE FUNCTION public.link_team_member_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Link team member by email match
  UPDATE public.team
  SET user_id = NEW.id,
      updated_at = now()
  WHERE email = NEW.email
    AND user_id IS NULL;
  
  RETURN NEW;
END;
$$;

-- 3. Create trigger on auth.users (fires after handle_new_user)
DROP TRIGGER IF EXISTS on_auth_user_created_link_team ON auth.users;
CREATE TRIGGER on_auth_user_created_link_team
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.link_team_member_on_signup();

-- =====================================================
-- B. Enforce backend privilege restrictions
-- =====================================================

-- Replace sync_team_member_privileges with security checks
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
AS $$
DECLARE
  v_user_id uuid;
  v_caller_is_admin boolean;
  v_caller_is_super_admin boolean;
BEGIN
  -- Get target user_id
  SELECT user_id INTO v_user_id FROM public.team WHERE id = p_team_member_id;
  
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Check caller permissions
  SELECT 
    COALESCE(up.is_admin, false) OR COALESCE(up.is_super_admin, false),
    COALESCE(up.is_super_admin, false)
  INTO v_caller_is_admin, v_caller_is_super_admin
  FROM public.user_privileges up
  WHERE up.user_id = auth.uid();
  
  -- Also check via user_roles for initial super_admin
  IF NOT COALESCE(v_caller_is_admin, false) THEN
    SELECT EXISTS(
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    ) INTO v_caller_is_admin;
  END IF;
  
  IF NOT COALESCE(v_caller_is_super_admin, false) THEN
    SELECT EXISTS(
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    ) INTO v_caller_is_super_admin;
  END IF;

  -- SECURITY: Only admin/super_admin can call this at all
  IF NOT COALESCE(v_caller_is_admin, false) THEN
    RAISE EXCEPTION 'Only admins can modify privileges';
  END IF;

  -- SECURITY: Only super_admin can set is_super_admin = true
  IF p_is_super_admin = true AND NOT COALESCE(v_caller_is_super_admin, false) THEN
    RAISE EXCEPTION 'Only super admins can grant super admin privileges';
  END IF;

  -- SECURITY: Only super_admin can set is_admin = true
  IF p_is_admin = true AND NOT COALESCE(v_caller_is_super_admin, false) THEN
    -- Allow existing admins to keep admin status but not grant new
    -- Check if target already has admin
    IF NOT EXISTS(SELECT 1 FROM public.user_privileges WHERE user_id = v_user_id AND is_admin = true) THEN
      RAISE EXCEPTION 'Only super admins can grant admin privileges';
    END IF;
  END IF;

  -- SECURITY: Only super_admin can set can_override_hierarchy
  IF p_can_override_hierarchy = true AND NOT COALESCE(v_caller_is_super_admin, false) THEN
    RAISE EXCEPTION 'Only super admins can grant hierarchy override';
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
$$;

-- =====================================================
-- C. Enforce scope restrictions at DB level  
-- =====================================================

-- RLS on team_member_scopes: only admins or scope-owning managers can modify
DROP POLICY IF EXISTS "team_member_scopes_insert_policy" ON public.team_member_scopes;
DROP POLICY IF EXISTS "team_member_scopes_delete_policy" ON public.team_member_scopes;

CREATE POLICY "team_member_scopes_insert_policy" ON public.team_member_scopes
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_admin_privilege(auth.uid())
    OR
    -- Manager can assign scopes within their own scope
    public.has_scope_access(auth.uid(), scope_type, scope_id)
  );

CREATE POLICY "team_member_scopes_delete_policy" ON public.team_member_scopes
  FOR DELETE TO authenticated
  USING (
    public.has_admin_privilege(auth.uid())
    OR
    public.has_scope_access(auth.uid(), scope_type, scope_id)
  );
