

## Problem: `has_client_access` function is too restrictive

Alex and Milan both have the `department_manager` role and have client scopes assigned via `team_member_scopes`. However, the `has_client_access()` database function — used by the tasks RLS policy — does **not** recognize `department_manager` and does **not** check `team_member_scopes`.

### Current `has_client_access` logic:
- Grants access if role is `admin`, `manager`, or `agency_manager` — **`department_manager` is missing**
- Falls back to checking `client_users` table — but Alex/Milan aren't in `client_users`, they're in `team_member_scopes`

### What needs to change

**Single fix: Update `has_client_access()` function** to also:
1. Include `department_manager` and `team_manager` in the role-based access check
2. Check `team_member_scopes` for client-level scope assignments (this is where Alex and Milan's client access is actually stored)

Updated function logic:
```sql
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
```

This single migration fixes task visibility for Alex, Milan, and any future `department_manager`/`team_manager` users who have client scopes assigned.

### Impact
- **Tasks**: SELECT policy uses `has_client_access` → now works for scoped department managers
- **Project stages**: SELECT policy also uses `has_client_access` → also fixed
- **No code changes needed** — only one database function update

