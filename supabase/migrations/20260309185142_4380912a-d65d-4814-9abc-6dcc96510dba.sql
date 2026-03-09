
-- Add new operational roles to enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'department_manager';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'team_employee';

-- Create departments table
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  manager_user_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create org_teams table (teams within departments)
CREATE TABLE public.org_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE,
  manager_team_member_id uuid REFERENCES public.team(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add hierarchy columns to team table
ALTER TABLE public.team ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES public.team(id);
ALTER TABLE public.team ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id);
ALTER TABLE public.team ADD COLUMN IF NOT EXISTS org_team_id uuid REFERENCES public.org_teams(id);
ALTER TABLE public.team ADD COLUMN IF NOT EXISTS operational_role text DEFAULT 'team_employee';

-- Create user_privileges table
CREATE TABLE public.user_privileges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  is_admin boolean DEFAULT false,
  is_super_admin boolean DEFAULT false,
  can_view_proposals boolean DEFAULT false,
  can_view_prices boolean DEFAULT false,
  can_invite_users boolean DEFAULT false,
  can_create_teams boolean DEFAULT false,
  can_manage_project_assignments boolean DEFAULT false,
  can_manage_client_assignments boolean DEFAULT false,
  can_override_hierarchy boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_privileges ENABLE ROW LEVEL SECURITY;

-- RLS policies for departments
CREATE POLICY "Authenticated can view departments" ON public.departments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage departments" ON public.departments
  FOR ALL TO authenticated
  USING (public.has_role_level(auth.uid(), 'admin'::app_role));

-- RLS policies for org_teams
CREATE POLICY "Authenticated can view org_teams" ON public.org_teams
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage org_teams" ON public.org_teams
  FOR ALL TO authenticated
  USING (public.has_role_level(auth.uid(), 'admin'::app_role));

-- RLS policies for user_privileges
CREATE POLICY "Users can view own privileges" ON public.user_privileges
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role_level(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage privileges" ON public.user_privileges
  FOR ALL TO authenticated
  USING (public.has_role_level(auth.uid(), 'admin'::app_role));

-- Create security definer function to check privileges
CREATE OR REPLACE FUNCTION public.get_user_privileges(_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT jsonb_build_object(
      'is_admin', COALESCE(up.is_admin, false),
      'is_super_admin', COALESCE(up.is_super_admin, false),
      'can_view_proposals', COALESCE(up.can_view_proposals, false),
      'can_view_prices', COALESCE(up.can_view_prices, false),
      'can_invite_users', COALESCE(up.can_invite_users, false),
      'can_create_teams', COALESCE(up.can_create_teams, false),
      'can_manage_project_assignments', COALESCE(up.can_manage_project_assignments, false),
      'can_manage_client_assignments', COALESCE(up.can_manage_client_assignments, false),
      'can_override_hierarchy', COALESCE(up.can_override_hierarchy, false)
    )
    FROM public.user_privileges up
    WHERE up.user_id = _user_id),
    '{"is_admin":false,"is_super_admin":false,"can_view_proposals":false,"can_view_prices":false,"can_invite_users":false,"can_create_teams":false,"can_manage_project_assignments":false,"can_manage_client_assignments":false,"can_override_hierarchy":false}'::jsonb
  )
$$;

-- Update has_role_level to also consider user_privileges for admin checks
CREATE OR REPLACE FUNCTION public.has_admin_privilege(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_privileges
    WHERE user_id = _user_id AND (is_admin = true OR is_super_admin = true)
  )
  OR public.has_role_level(_user_id, 'admin'::app_role)
$$;
