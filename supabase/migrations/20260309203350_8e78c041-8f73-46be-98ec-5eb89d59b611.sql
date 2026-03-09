
-- Fix has_role_level to include department_manager in hierarchy
CREATE OR REPLACE FUNCTION public.has_role_level(_user_id uuid, _min_role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM (
      SELECT role FROM public.user_roles WHERE user_id = _user_id
      UNION
      SELECT ae.role 
      FROM public.authorized_emails ae
      JOIN auth.users au ON au.email = ae.email
      WHERE au.id = _user_id
    ) roles
    WHERE roles.role = ANY(
      CASE 
        WHEN _min_role = 'demo' THEN ARRAY['super_admin', 'admin', 'agency_manager', 'department_manager', 'team_manager', 'employee', 'premium_client', 'basic_client', 'demo']::app_role[]
        WHEN _min_role = 'basic_client' THEN ARRAY['super_admin', 'admin', 'agency_manager', 'department_manager', 'team_manager', 'employee', 'premium_client', 'basic_client']::app_role[]
        WHEN _min_role = 'premium_client' THEN ARRAY['super_admin', 'admin', 'agency_manager', 'department_manager', 'team_manager', 'employee', 'premium_client']::app_role[]
        WHEN _min_role = 'employee' THEN ARRAY['super_admin', 'admin', 'agency_manager', 'department_manager', 'team_manager', 'employee']::app_role[]
        WHEN _min_role = 'team_manager' THEN ARRAY['super_admin', 'admin', 'agency_manager', 'department_manager', 'team_manager']::app_role[]
        WHEN _min_role = 'department_manager' THEN ARRAY['super_admin', 'admin', 'agency_manager', 'department_manager']::app_role[]
        WHEN _min_role = 'agency_manager' THEN ARRAY['super_admin', 'admin', 'agency_manager']::app_role[]
        WHEN _min_role = 'admin' THEN ARRAY['super_admin', 'admin']::app_role[]
        WHEN _min_role = 'super_admin' THEN ARRAY['super_admin']::app_role[]
        -- Legacy role names mapping
        WHEN _min_role = 'client' THEN ARRAY['super_admin', 'admin', 'agency_manager', 'department_manager', 'team_manager', 'employee', 'premium_client', 'basic_client', 'client']::app_role[]
        WHEN _min_role = 'team_member' THEN ARRAY['super_admin', 'admin', 'agency_manager', 'department_manager', 'team_manager', 'employee', 'team_member']::app_role[]
        WHEN _min_role = 'team_lead' THEN ARRAY['super_admin', 'admin', 'agency_manager', 'department_manager', 'team_manager', 'team_lead']::app_role[]
        WHEN _min_role = 'manager' THEN ARRAY['super_admin', 'admin', 'agency_manager', 'department_manager', 'manager']::app_role[]
        ELSE ARRAY[]::app_role[]
      END
    )
  )
  -- Also check user_privileges for admin access
  OR public.has_admin_privilege(_user_id)
$function$;

-- Also fix has_admin_privilege to not depend on has_role_level (avoid circular)
CREATE OR REPLACE FUNCTION public.has_admin_privilege(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_privileges
    WHERE user_id = _user_id AND (is_admin = true OR is_super_admin = true)
  )
$function$;
