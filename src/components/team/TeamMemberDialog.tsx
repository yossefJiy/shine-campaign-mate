import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePermissions, useAuth } from "@/hooks/useAuth";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Plus, X, Mail, Phone, Loader2, Shield, ChevronDown,
  Key, FolderTree, Users, AlertTriangle,
} from "lucide-react";

interface TeamMember {
  id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  emails: string[];
  phones: string[];
  departments: string[];
  avatar_color: string | null;
  is_active: boolean;
  manager_id: string | null;
  department_id: string | null;
  org_team_id: string | null;
  operational_role: string | null;
  has_system_access: boolean;
}

interface Department {
  id: string;
  name: string;
}

interface OrgTeam {
  id: string;
  name: string;
  department_id: string | null;
}

interface Privileges {
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

const DEFAULT_PRIVILEGES: Privileges = {
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

const operationalRoleOptions = [
  { value: 'department_manager', label: 'מנהל מחלקה' },
  { value: 'team_manager', label: 'מנהל צוות' },
  { value: 'team_employee', label: 'עובד צוות' },
];

const colorOptions = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#ef4444",
  "#f97316", "#f59e0b", "#84cc16", "#22c55e", "#14b8a6",
  "#06b6d4", "#0ea5e9", "#3b82f6",
];

const departmentTagOptions = [
  "קריאייטיב", "תוכן", "אסטרטגיה", "קופירייטינג", "קמפיינים",
  "מנהל מוצר", "מנהל פרוייקטים", "סטודיו", "גרפיקה", "סרטונים",
  "כלי AI", "מיתוג", "אפיון אתרים", "חוויית משתמש", "עיצוב אתרים",
  "תכנות", "ניהול אתרים", "מדיה"
];

const privilegeLabels: Record<keyof Privileges, string> = {
  is_admin: 'אדמין',
  is_super_admin: 'סופר אדמין',
  can_view_proposals: 'צפייה בהצעות מחיר',
  can_view_prices: 'צפייה במחירים',
  can_invite_users: 'הזמנת משתמשים',
  can_create_teams: 'יצירת צוותים',
  can_manage_project_assignments: 'שיוך לפרויקטים',
  can_manage_client_assignments: 'שיוך ללקוחות',
  can_override_hierarchy: 'דריסת היררכיה',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember | null;
  teamMembers: TeamMember[];
  departments: Department[];
  orgTeams: OrgTeam[];
}

/**
 * Check if callerTeamId is in the manager chain of targetMember
 */
function isInHierarchy(targetMember: TeamMember, callerTeamId: string | null, allMembers: TeamMember[]): boolean {
  if (!callerTeamId) return false;
  let checkId = targetMember.manager_id;
  let depth = 0;
  while (checkId && depth < 10) {
    if (checkId === callerTeamId) return true;
    const manager = allMembers.find(m => m.id === checkId);
    checkId = manager?.manager_id || null;
    depth++;
  }
  return false;
}

export function TeamMemberDialog({ open, onOpenChange, member, teamMembers, departments, orgTeams }: Props) {
  const queryClient = useQueryClient();
  const { isAdmin, isSuperAdmin } = usePermissions();
  const { user } = useAuth();
  const memberId = member?.id;
  const memberUserId = member?.user_id;

  // Determine caller's team record
  const callerTeamRecord = useMemo(
    () => teamMembers.find(m => m.user_id === user?.id) || null,
    [teamMembers, user?.id]
  );

  // Permission computation
  const isSelfEdit = !!(member && member.user_id && user?.id && member.user_id === user.id);
  const isHierarchyManager = useMemo(() => {
    if (!member || !callerTeamRecord) return false;
    return isInHierarchy(member, callerTeamRecord.id, teamMembers);
  }, [member, callerTeamRecord, teamMembers]);

  const canEditThisMember = isAdmin || isSelfEdit || isHierarchyManager;
  const canEditOrgFields = isSuperAdmin || (isAdmin && !isSelfEdit); // super_admin can self-edit org, admin can edit others
  const canEditScopes = isAdmin || (isHierarchyManager && !isSelfEdit); // admin CAN self-assign scopes
  const canEditPrivileges = isAdmin && !isSelfEdit; // No self-privilege-escalation ever

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [phones, setPhones] = useState<string[]>([]);
  const [depts, setDepts] = useState<string[]>([]);
  const [color, setColor] = useState("#6366f1");
  const [managerId, setManagerId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [orgTeamId, setOrgTeamId] = useState("");
  const [operationalRole, setOperationalRole] = useState("team_employee");
  const [hasSystemAccess, setHasSystemAccess] = useState(false);
  const [privileges, setPrivileges] = useState<Privileges>(DEFAULT_PRIVILEGES);
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [privilegesOpen, setPrivilegesOpen] = useState(false);
  const [scopesOpen, setScopesOpen] = useState(false);
  const [clientScopes, setClientScopes] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [responsibilityDomains, setResponsibilityDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [interfaceLanguage, setInterfaceLanguage] = useState("he");
  const [preferredTaskLanguage, setPreferredTaskLanguage] = useState("he");

  // Fetch existing privileges
  const { data: existingPrivileges } = useQuery({
    queryKey: ["team-member-privileges", memberUserId],
    queryFn: async () => {
      if (!memberUserId) return null;
      const { data } = await supabase
        .from("user_privileges")
        .select("*")
        .eq("user_id", memberUserId)
        .maybeSingle();
      return data;
    },
    enabled: !!memberUserId && open,
  });

  // Fetch existing scopes
  const { data: existingScopes = [] } = useQuery({
    queryKey: ["team-member-scopes", memberId],
    queryFn: async () => {
      if (!memberId) return [];
      const { data } = await supabase
        .from("team_member_scopes")
        .select("*")
        .eq("team_member_id", memberId);
      return data || [];
    },
    enabled: !!memberId && open,
  });

  // Fetch clients for scope assignment
  const { data: clients = [] } = useQuery({
    queryKey: ["clients-for-scope"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, name")
        .is("deleted_at", null)
        .eq("is_active", true)
        .eq("is_master_account", false)
        .order("name");
      return data || [];
    },
    enabled: open,
  });

  // Initialize form when dialog opens
  useEffect(() => {
    if (!open) {
      setInitialized(false);
      return;
    }

    setName(member?.name || "");
    setEmail(member?.email || "");
    setEmails(member?.emails || []);
    setPhones(member?.phones || []);
    setDepts(member?.departments || []);
    setColor(member?.avatar_color || "#6366f1");
    setManagerId(member?.manager_id || "");
    setDepartmentId(member?.department_id || "");
    setOrgTeamId(member?.org_team_id || "");
    setOperationalRole(member?.operational_role || "team_employee");
    setHasSystemAccess(member?.has_system_access || false);
    setResponsibilityDomains((member as any)?.responsibility_domains || []);
    setInterfaceLanguage((member as any)?.interface_language || "he");
    setPreferredTaskLanguage((member as any)?.preferred_task_language || "he");
    setNewEmail("");
    setNewPhone("");
    setNewDomain("");
    setPrivilegesOpen(false);
    setScopesOpen(false);
    setInitialized(false);
  }, [open, member]);

  // Sync privileges + scopes ONCE after data loads
  useEffect(() => {
    if (!open || initialized) return;

    if (existingPrivileges !== undefined) {
      if (existingPrivileges) {
        setPrivileges({
          is_admin: existingPrivileges.is_admin ?? false,
          is_super_admin: existingPrivileges.is_super_admin ?? false,
          can_view_proposals: existingPrivileges.can_view_proposals ?? false,
          can_view_prices: existingPrivileges.can_view_prices ?? false,
          can_invite_users: existingPrivileges.can_invite_users ?? false,
          can_create_teams: existingPrivileges.can_create_teams ?? false,
          can_manage_project_assignments: existingPrivileges.can_manage_project_assignments ?? false,
          can_manage_client_assignments: existingPrivileges.can_manage_client_assignments ?? false,
          can_override_hierarchy: existingPrivileges.can_override_hierarchy ?? false,
        });
      } else {
        setPrivileges(DEFAULT_PRIVILEGES);
      }

      setClientScopes(
        existingScopes
          .filter((s: any) => s.scope_type === 'client')
          .map((s: any) => s.scope_id)
      );

      setInitialized(true);
    }
  }, [open, initialized, existingPrivileges, existingScopes]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (memberId) {
        // Use secure RPC for existing members
        const rpcParams: Record<string, any> = {
          p_team_member_id: memberId,
          // Personal fields (always sent)
          p_name: name,
          p_email: email,
          p_emails: emails,
          p_phones: phones,
          p_departments: depts,
          p_avatar_color: color,
        };

        // Org fields: only send if user has permission (backend will also enforce)
        if (canEditOrgFields) {
          rpcParams.p_operational_role = operationalRole;
          rpcParams.p_department_id = departmentId && departmentId !== 'none' ? departmentId : null;
          rpcParams.p_org_team_id = orgTeamId && orgTeamId !== 'none' ? orgTeamId : null;
          rpcParams.p_manager_id = managerId && managerId !== 'none' ? managerId : null;
          rpcParams.p_has_system_access = hasSystemAccess;
        }

        // Scopes: only send if allowed
        if (canEditScopes) {
          rpcParams.p_client_scopes = clientScopes;
        }

        const { data, error } = await supabase.rpc('update_team_member_secure', rpcParams as any);
        if (error) throw error;

        // Sync privileges via separate RPC (already has its own permission checks)
        if (memberUserId && hasSystemAccess && canEditPrivileges) {
          const { error: privError } = await supabase.rpc('sync_team_member_privileges', {
            p_team_member_id: memberId,
            p_is_admin: privileges.is_admin,
            p_is_super_admin: privileges.is_super_admin,
            p_can_view_proposals: privileges.can_view_proposals,
            p_can_view_prices: privileges.can_view_prices,
            p_can_invite_users: privileges.can_invite_users,
            p_can_create_teams: privileges.can_create_teams,
            p_can_manage_project_assignments: privileges.can_manage_project_assignments,
            p_can_manage_client_assignments: privileges.can_manage_client_assignments,
            p_can_override_hierarchy: privileges.can_override_hierarchy,
          });
          if (privError) {
            console.error('Error syncing privileges:', privError);
            toast.error(privError.message || 'שגיאה בעדכון הרשאות');
          }
        }
      } else {
        // New member creation - only admin can create
        if (!isAdmin) {
          throw new Error('Only admins can create new team members');
        }

        const payload = {
          name,
          email,
          emails,
          phones,
          departments: depts,
          avatar_color: color,
          manager_id: managerId && managerId !== 'none' ? managerId : null,
          department_id: departmentId && departmentId !== 'none' ? departmentId : null,
          org_team_id: orgTeamId && orgTeamId !== 'none' ? orgTeamId : null,
          operational_role: operationalRole,
          has_system_access: hasSystemAccess,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase.from("team").insert(payload).select("id").single();
        if (error) throw error;

        const teamMemberId = data.id;

        // Sync scopes for new member
        if (clientScopes.length > 0) {
          const scopeRows = clientScopes.map(scopeId => ({
            team_member_id: teamMemberId,
            scope_type: 'client' as const,
            scope_id: scopeId,
          }));
          await supabase.from("team_member_scopes").insert(scopeRows);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      queryClient.invalidateQueries({ queryKey: ["team-active"] });
      queryClient.invalidateQueries({ queryKey: ["team-member-privileges"] });
      queryClient.invalidateQueries({ queryKey: ["team-member-scopes"] });
      toast.success("נשמר בהצלחה");
      onOpenChange(false);
    },
    onError: (err: any) => {
      const msg = err?.message || "שגיאה בשמירה";
      toast.error(msg);
    },
  });

  const addEmail = () => {
    if (newEmail.trim() && !emails.includes(newEmail.trim())) {
      setEmails([...emails, newEmail.trim()]);
      setNewEmail("");
    }
  };

  const addPhone = () => {
    if (newPhone.trim() && !phones.includes(newPhone.trim())) {
      setPhones([...phones, newPhone.trim()]);
      setNewPhone("");
    }
  };

  const togglePrivilege = (key: keyof Privileges) => {
    setPrivileges(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleClientScope = (clientId: string) => {
    setClientScopes(prev =>
      prev.includes(clientId) ? prev.filter(id => id !== clientId) : [...prev, clientId]
    );
  };

  const filteredOrgTeams = useMemo(() =>
    orgTeams.filter(t => departmentId && departmentId !== 'none' && t.department_id === departmentId),
    [orgTeams, departmentId]
  );

  // Permission hint for self-edit
  const selfEditNotice = isSelfEdit && !isAdmin;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{member ? "עריכת חבר צוות" : "הוספת חבר צוות"}</DialogTitle>
        </DialogHeader>

        {/* Permission notice */}
        {selfEditNotice && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>ניתן לערוך רק פרטים אישיים. שינויים ארגוניים דורשים הרשאת אדמין.</span>
          </div>
        )}

        {!canEditThisMember && member && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>אין לך הרשאה לערוך את חבר הצוות הזה.</span>
          </div>
        )}

        <div className="space-y-5">
          {/* Basic Info - always editable for self/hierarchy/admin */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>שם</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="שם מלא" disabled={!canEditThisMember} />
            </div>
            <div className="space-y-1.5">
              <Label>אימייל ראשי</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" disabled={!canEditThisMember} />
            </div>
          </div>

          <Separator />

          {/* Organizational Position - admin only */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-primary" />
              מיקום ארגוני
              {!canEditOrgFields && <Badge variant="outline" className="text-[10px]">
                {isSelfEdit && isAdmin && !isSuperAdmin ? 'אדמין לא יכול לשנות מיקום עצמי' : 'צפייה בלבד'}
              </Badge>}
            </h4>

            <div className="space-y-1.5">
              <Label>תפקיד תפעולי</Label>
              <Select value={operationalRole} onValueChange={setOperationalRole} disabled={!canEditOrgFields}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {operationalRoleOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>מחלקה</Label>
                <Select value={departmentId || "none"} onValueChange={v => { setDepartmentId(v); setOrgTeamId(""); }} disabled={!canEditOrgFields}>
                  <SelectTrigger><SelectValue placeholder="בחר..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">ללא</SelectItem>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>צוות</Label>
                <Select value={orgTeamId || "none"} onValueChange={setOrgTeamId} disabled={!canEditOrgFields || !departmentId || departmentId === 'none'}>
                  <SelectTrigger><SelectValue placeholder="בחר..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">ללא</SelectItem>
                    {filteredOrgTeams.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>מנהל ישיר</Label>
              <Select value={managerId || "none"} onValueChange={setManagerId} disabled={!canEditOrgFields}>
                <SelectTrigger><SelectValue placeholder="בחר..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא מנהל ישיר</SelectItem>
                  {teamMembers
                    .filter(m => m.id !== member?.id && (m.operational_role === 'department_manager' || m.operational_role === 'team_manager'))
                    .map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* System Access - admin only */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                גישה למערכת
              </h4>
              <Switch checked={hasSystemAccess} onCheckedChange={setHasSystemAccess} disabled={!canEditOrgFields} />
            </div>
            {hasSystemAccess && (
              <p className="text-xs text-muted-foreground">
                {memberUserId ? "✓ המשתמש מחובר למערכת" : "המשתמש יוכל להתחבר עם האימייל הראשי לאחר הפעלה"}
              </p>
            )}
          </div>

          {/* Elevated Privileges - Admin only, never for self-edit */}
          {hasSystemAccess && canEditPrivileges && (
            <Collapsible open={privilegesOpen} onOpenChange={setPrivilegesOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full text-right p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <ChevronDown className={`w-4 h-4 transition-transform ${privilegesOpen ? 'rotate-180' : ''}`} />
                <Shield className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold">הרשאות מורחבות</span>
                {(privileges.is_admin || privileges.is_super_admin) && (
                  <Badge variant="default" className="text-[10px]">אדמין</Badge>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="grid grid-cols-1 gap-2 p-3 rounded-lg border bg-muted/30">
                  {(Object.keys(privilegeLabels) as (keyof Privileges)[]).map(key => {
                    const requiresSuperAdmin = key === 'is_super_admin' || key === 'can_override_hierarchy' || key === 'is_admin';
                    const disabled = requiresSuperAdmin && !isSuperAdmin;
                    
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <label className={`text-sm cursor-pointer ${disabled ? 'text-muted-foreground' : ''}`}>
                          {privilegeLabels[key]}
                          {disabled && <span className="text-[10px] mr-1">(סופר אדמין בלבד)</span>}
                        </label>
                        <Switch 
                          checked={privileges[key]} 
                          onCheckedChange={() => togglePrivilege(key)} 
                          disabled={disabled}
                        />
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Scope Assignment - admin or hierarchy manager (not self) */}
          {canEditScopes && (
            <Collapsible open={scopesOpen} onOpenChange={setScopesOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full text-right p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <ChevronDown className={`w-4 h-4 transition-transform ${scopesOpen ? 'rotate-180' : ''}`} />
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">שיוך ללקוחות</span>
                {clientScopes.length > 0 && (
                  <Badge variant="secondary" className="text-[10px]">{clientScopes.length}</Badge>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto p-3 rounded-lg border bg-muted/30">
                  {clients.map(c => (
                    <div key={c.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`scope-${c.id}`}
                        checked={clientScopes.includes(c.id)}
                        onCheckedChange={() => toggleClientScope(c.id)}
                      />
                      <label htmlFor={`scope-${c.id}`} className="text-sm cursor-pointer">{c.name}</label>
                    </div>
                  ))}
                  {clients.length === 0 && (
                    <p className="text-sm text-muted-foreground">אין לקוחות</p>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          <Separator />

          {/* Contact Details */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 w-full text-right p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <ChevronDown className="w-4 h-4" />
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold">פרטי קשר נוספים</span>
              {(emails.length + phones.length) > 0 && (
                <Badge variant="secondary" className="text-[10px]">{emails.length + phones.length}</Badge>
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">כתובות מייל</Label>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {emails.map(e => (
                    <div key={e} className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-md text-xs">
                      <Mail className="w-3 h-3" /><span>{e}</span>
                      <button type="button" onClick={() => setEmails(emails.filter(x => x !== e))} disabled={!canEditThisMember}><X className="w-3 h-3 text-destructive" /></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="הוסף מייל" className="text-sm" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addEmail())} disabled={!canEditThisMember} />
                  <Button type="button" variant="outline" size="icon" onClick={addEmail} disabled={!canEditThisMember}><Plus className="w-4 h-4" /></Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">טלפונים</Label>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {phones.map(p => (
                    <div key={p} className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-md text-xs">
                      <Phone className="w-3 h-3" /><span>{p}</span>
                      <button type="button" onClick={() => setPhones(phones.filter(x => x !== p))} disabled={!canEditThisMember}><X className="w-3 h-3 text-destructive" /></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="הוסף טלפון" className="text-sm" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPhone())} disabled={!canEditThisMember} />
                  <Button type="button" variant="outline" size="icon" onClick={addPhone} disabled={!canEditThisMember}><Plus className="w-4 h-4" /></Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Department Tags */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 w-full text-right p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <ChevronDown className="w-4 h-4" />
              <span className="text-sm font-semibold">תגיות מקצועיות</span>
              {depts.length > 0 && <Badge variant="secondary" className="text-[10px]">{depts.length}</Badge>}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto p-3 rounded-lg border bg-muted/30">
                {departmentTagOptions.map(dept => (
                  <div key={dept} className="flex items-center gap-2">
                    <Checkbox
                      id={`tag-${dept}`}
                      checked={depts.includes(dept)}
                      onCheckedChange={() => setDepts(prev => prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept])}
                      disabled={!canEditThisMember}
                    />
                    <label htmlFor={`tag-${dept}`} className="text-xs cursor-pointer">{dept}</label>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Avatar Color */}
          <div className="space-y-1.5">
            <Label>צבע</Label>
            <div className="flex flex-wrap gap-1.5">
              {colorOptions.map(c => (
                <button
                  key={c} type="button"
                  onClick={() => setColor(c)}
                  disabled={!canEditThisMember}
                  className={`w-7 h-7 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'} ${!canEditThisMember ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button>
            <Button 
              onClick={() => saveMutation.mutate()} 
              disabled={saveMutation.isPending || !name.trim() || !canEditThisMember}
            >
              {saveMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              שמור
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
