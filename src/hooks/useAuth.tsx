import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Operational roles (what the person does in the org)
type OperationalRole = 'department_manager' | 'team_manager' | 'team_employee' | 'premium_client' | 'basic_client' | 'demo';

// Keep AppRole for backward compatibility with DB enum
type AppRole = 'super_admin' | 'admin' | 'agency_manager' | 'team_manager' | 'employee' | 'premium_client' | 'basic_client' | 'department_manager' | 'team_employee' | 'manager' | 'department_head' | 'team_lead' | 'team_member' | 'client' | 'demo';

// Elevated privileges (layered on top of operational role)
export interface UserPrivileges {
  is_admin: boolean;
  is_super_admin: boolean;
  can_view_proposals: boolean;
  can_view_prices: boolean;
  can_invite_users: boolean;
  can_create_teams: boolean;
  can_manage_project_assignments: boolean;
  can_manage_client_assignments: boolean;
  can_override_hierarchy: boolean;
}

const DEFAULT_PRIVILEGES: UserPrivileges = {
  is_admin: false,
  is_super_admin: false,
  can_view_proposals: false,
  can_view_prices: false,
  can_invite_users: false,
  can_create_teams: false,
  can_manage_project_assignments: false,
  can_manage_client_assignments: false,
  can_override_hierarchy: false,
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: AppRole | null;
  privileges: UserPrivileges;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const cleanupInvalidSession = async () => {
  try {
    await supabase.auth.signOut();
  } catch {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;
    if (projectId) {
      try {
        localStorage.removeItem(`sb-${projectId}-auth-token`);
        localStorage.removeItem(`sb-${projectId}-auth-token-code-verifier`);
      } catch { /* ignore */ }
    }
  }
};

const isSessionInvalidError = (error: any): boolean => {
  if (!error) return false;
  const message = error.message || String(error);
  const lowerMessage = message.toLowerCase();
  return (
    lowerMessage.includes('session not found') ||
    lowerMessage.includes('session_not_found') ||
    lowerMessage.includes('auth session missing') ||
    lowerMessage.includes('jwt expired') ||
    lowerMessage.includes('invalid refresh token') ||
    lowerMessage.includes('refresh_token_not_found')
  );
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);
  const [privileges, setPrivileges] = useState<UserPrivileges>(DEFAULT_PRIVILEGES);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          setTimeout(() => {
            fetchUserRole(currentSession.user.id);
            fetchUserPrivileges(currentSession.user.id);
          }, 0);
        } else {
          setRole(null);
          setPrivileges(DEFAULT_PRIVILEGES);
        }
        
        setLoading(false);
      }
    );

    const initializeAuth = async () => {
      try {
        const { data: { session: localSession } } = await supabase.auth.getSession();
        
        if (localSession) {
          const { data: { user: validatedUser }, error: userError } = await supabase.auth.getUser();
          
          if (userError || !validatedUser) {
            console.warn('Invalid session detected, cleaning up...');
            await cleanupInvalidSession();
            setSession(null);
            setUser(null);
            setRole(null);
            setPrivileges(DEFAULT_PRIVILEGES);
          } else {
            setSession(localSession);
            setUser(validatedUser);
            fetchUserRole(validatedUser.id);
            fetchUserPrivileges(validatedUser.id);
          }
        } else {
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Error validating session:', error);
        if (isSessionInvalidError(error)) {
          await cleanupInvalidSession();
        }
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        return;
      }

      if (data) {
        setRole(data.role as AppRole);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchUserPrivileges = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_user_privileges', { _user_id: userId });
      
      if (error) {
        console.error('Error fetching user privileges:', error);
        return;
      }

      if (data) {
        const privs = typeof data === 'string' ? JSON.parse(data) : data;
        setPrivileges({
          is_admin: privs.is_admin ?? false,
          is_super_admin: privs.is_super_admin ?? false,
          can_view_proposals: privs.can_view_proposals ?? false,
          can_view_prices: privs.can_view_prices ?? false,
          can_invite_users: privs.can_invite_users ?? false,
          can_create_teams: privs.can_create_teams ?? false,
          can_manage_project_assignments: privs.can_manage_project_assignments ?? false,
          can_manage_client_assignments: privs.can_manage_client_assignments ?? false,
          can_override_hierarchy: privs.can_override_hierarchy ?? false,
        });
      }
    } catch (error) {
      console.error('Error fetching user privileges:', error);
    }
  };

  const signOut = async () => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;
    const storageKey = projectId ? `sb-${projectId}-auth-token` : null;

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch {
      try {
        if (storageKey) {
          localStorage.removeItem(storageKey);
          localStorage.removeItem(`${storageKey}-code-verifier`);
        }
      } catch { /* ignore */ }
    } finally {
      setUser(null);
      setSession(null);
      setRole(null);
      setPrivileges(DEFAULT_PRIVILEGES);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, role, privileges, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Map operational roles to Hebrew labels
export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'סופר אדמין',
  admin: 'אדמין',
  agency_manager: 'מנהל סוכנות',
  department_manager: 'מנהל מחלקה',
  team_manager: 'מנהל צוות',
  team_employee: 'עובד צוות',
  employee: 'עובד',
  premium_client: 'לקוח פרמיום',
  basic_client: 'לקוח בסיס',
  demo: 'דמו',
  manager: 'מנהל',
  department_head: 'ראש מחלקה',
  team_lead: 'ראש צוות',
  team_member: 'חבר צוות',
  client: 'לקוח',
};

// Helper hook that combines role + privileges for permission checks
export const usePermissions = () => {
  const { role, privileges } = useAuth();
  
  // Check if user has admin-level access (via role OR privileges)
  const isAdminLevel = privileges.is_admin || privileges.is_super_admin || 
    role === 'super_admin' || role === 'admin';
  
  // Check if user has management-level access
  const isManagerLevel = isAdminLevel || 
    role === 'department_manager' || role === 'agency_manager' || 
    role === 'team_manager' || role === 'manager' || role === 'department_head';

  return {
    // Privilege-based checks (preferred)
    isSuperAdmin: privileges.is_super_admin || role === 'super_admin',
    isAdmin: isAdminLevel,
    isManager: isManagerLevel,
    
    // Operational role checks
    isDepartmentManager: role === 'department_manager' || role === 'department_head',
    isTeamManager: role === 'team_manager',
    isTeamEmployee: role === 'team_employee' || role === 'employee' || role === 'team_member',
    
    // Client types
    isPremiumClient: role === 'premium_client',
    isBasicClient: role === 'basic_client',
    isClient: role === 'premium_client' || role === 'basic_client' || role === 'client',
    
    // Demo
    isDemo: role === 'demo',
    
    // Privilege flags (direct access)
    canViewProposals: privileges.can_view_proposals || isAdminLevel,
    canViewPrices: privileges.can_view_prices || isAdminLevel,
    canInviteUsers: privileges.can_invite_users || isAdminLevel,
    canCreateTeams: privileges.can_create_teams || isAdminLevel,
    canManageProjectAssignments: privileges.can_manage_project_assignments || isAdminLevel,
    canManageClientAssignments: privileges.can_manage_client_assignments || isAdminLevel,
    canOverrideHierarchy: privileges.can_override_hierarchy || privileges.is_super_admin,
    
    // Raw privileges object
    privileges,
    
    // Current role
    role,
    
    // Role label
    roleLabel: role ? ROLE_LABELS[role] || role : null,

    // Backward compatibility
    hasRoleLevel: (minRole: AppRole): boolean => {
      if (!role) return false;
      if (isAdminLevel) return true;
      // Simple hierarchy check
      const hierarchy: AppRole[] = ['super_admin', 'admin', 'agency_manager', 'department_manager', 'team_manager', 'employee', 'team_employee', 'premium_client', 'basic_client', 'demo'];
      const userIdx = hierarchy.indexOf(role);
      const minIdx = hierarchy.indexOf(minRole);
      return userIdx !== -1 && minIdx !== -1 && userIdx <= minIdx;
    },
    
    // Legacy aliases
    isAgencyManager: isManagerLevel,
    isEmployee: isManagerLevel || role === 'employee' || role === 'team_employee' || role === 'team_member',
  };
};

export type { AppRole, OperationalRole };
