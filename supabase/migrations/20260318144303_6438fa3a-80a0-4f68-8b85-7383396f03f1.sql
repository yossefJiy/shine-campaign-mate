CREATE OR REPLACE FUNCTION public.has_client_access(_user_id uuid, _client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Admins have global access
    public.has_admin_privilege(_user_id)
    OR
    -- Role-based broad access (agency-level roles)
    public.has_role_level(_user_id, 'agency_manager'::app_role)
    OR
    -- Scope-based access via team_member_scopes
    EXISTS (
      SELECT 1 FROM public.team_member_scopes tms
      JOIN public.team t ON t.id = tms.team_member_id
      WHERE t.user_id = _user_id
        AND tms.scope_type = 'client'
        AND tms.scope_id = _client_id
    )
    OR
    -- Legacy: client_users table
    EXISTS (
      SELECT 1 FROM public.client_users
      WHERE user_id = _user_id AND client_id = _client_id
    )
$$;