import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  Key, FolderTree, Users,
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
  can_create_teams: 'יצירת צוותות',
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

export function TeamMemberDialog({ open, onOpenChange, member, teamMembers, departments, orgTeams }: Props) {
  const queryClient = useQueryClient();

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

  // Scope assignments
  const [clientScopes, setClientScopes] = useState<string[]>([]);

  // Fetch existing privileges for this member
  const { data: existingPrivileges } = useQuery({
    queryKey: ["team-member-privileges", member?.user_id],
    queryFn: async () => {
      if (!member?.user_id) return null;
      const { data } = await supabase
        .from("user_privileges")
        .select("*")
        .eq("user_id", member.user_id)
        .maybeSingle();
      return data;
    },
    enabled: !!member?.user_id,
  });

  // Fetch existing scopes
  const { data: existingScopes = [] } = useQuery({
    queryKey: ["team-member-scopes", member?.id],
    queryFn: async () => {
      if (!member?.id) return [];
      const { data } = await supabase
        .from("team_member_scopes")
        .select("*")
        .eq("team_member_id", member.id);
      return data || [];
    },
    enabled: !!member?.id,
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
  });

  // Reset form when member changes
  useEffect(() => {
    if (open) {
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
      setNewEmail("");
      setNewPhone("");
      setPrivilegesOpen(false);
      setScopesOpen(false);
    }
  }, [open, member]);

  // Sync privileges from DB
  useEffect(() => {
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
  }, [existingPrivileges]);

  // Sync scopes
  useEffect(() => {
    setClientScopes(
      existingScopes
        .filter((s: any) => s.scope_type === 'client')
        .map((s: any) => s.scope_id)
    );
  }, [existingScopes]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        email,
        emails,
        phones,
        departments: depts,
        avatar_color: color,
        manager_id: managerId || null,
        department_id: departmentId && departmentId !== 'none' ? departmentId : null,
        org_team_id: orgTeamId && orgTeamId !== 'none' ? orgTeamId : null,
        operational_role: operationalRole,
        has_system_access: hasSystemAccess,
        updated_at: new Date().toISOString(),
      };

      let teamMemberId = member?.id;

      if (member?.id) {
        const { error } = await supabase.from("team").update(payload).eq("id", member.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("team").insert(payload).select("id").single();
        if (error) throw error;
        teamMemberId = data.id;
      }

      // Sync privileges if user_id exists
      if (member?.user_id && hasSystemAccess) {
        const { error } = await supabase.rpc('sync_team_member_privileges', {
          p_team_member_id: teamMemberId!,
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
        if (error) console.error('Error syncing privileges:', error);
      }

      // Sync client scopes
      if (teamMemberId) {
        // Delete removed scopes
        const { error: delError } = await supabase
          .from("team_member_scopes")
          .delete()
          .eq("team_member_id", teamMemberId)
          .eq("scope_type", "client");
        if (delError) console.error('Error deleting scopes:', delError);

        // Insert new scopes
        if (clientScopes.length > 0) {
          const scopeRows = clientScopes.map(scopeId => ({
            team_member_id: teamMemberId!,
            scope_type: 'client' as const,
            scope_id: scopeId,
          }));
          const { error: insError } = await supabase
            .from("team_member_scopes")
            .insert(scopeRows);
          if (insError) console.error('Error inserting scopes:', insError);
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
    onError: () => toast.error("שגיאה בשמירה"),
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
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const filteredOrgTeams = orgTeams.filter(
    t => departmentId && departmentId !== 'none' && t.department_id === departmentId
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{member ? "עריכת חבר צוות" : "הוספת חבר צוות"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* === BASIC INFO === */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>שם</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="שם מלא" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>אימייל ראשי</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
            </div>
          </div>

          <Separator />

          {/* === ORGANIZATIONAL POSITION === */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-primary" />
              מיקום ארגוני
            </h4>

            <div className="space-y-1.5">
              <Label>תפקיד תפעולי</Label>
              <Select value={operationalRole} onValueChange={setOperationalRole}>
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
                <Select value={departmentId || "none"} onValueChange={v => { setDepartmentId(v); setOrgTeamId(""); }}>
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
                <Select value={orgTeamId || "none"} onValueChange={setOrgTeamId} disabled={!departmentId || departmentId === 'none'}>
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
              <Select value={managerId || "none"} onValueChange={setManagerId}>
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

          {/* === SYSTEM ACCESS === */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                גישה למערכת
              </h4>
              <Switch checked={hasSystemAccess} onCheckedChange={setHasSystemAccess} />
            </div>
            {hasSystemAccess && (
              <p className="text-xs text-muted-foreground">
                {member?.user_id
                  ? "✓ המשתמש מחובר למערכת"
                  : "המשתמש יוכל להתחבר עם האימייל הראשי לאחר הפעלה"
                }
              </p>
            )}
          </div>

          {/* === ELEVATED PRIVILEGES === */}
          {hasSystemAccess && (
            <Collapsible open={privilegesOpen} onOpenChange={setPrivilegesOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full text-right p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <ChevronDown className={`w-4 h-4 transition-transform ${privilegesOpen ? 'rotate-180' : ''}`} />
                <Shield className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold">הרשאות מערכת מורחבות</span>
                {(privileges.is_admin || privileges.is_super_admin) && (
                  <Badge variant="default" className="text-[10px]">אדמין</Badge>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="grid grid-cols-1 gap-2 p-3 rounded-lg border bg-muted/30">
                  {(Object.keys(privilegeLabels) as (keyof Privileges)[]).map(key => (
                    <div key={key} className="flex items-center justify-between">
                      <label className="text-sm cursor-pointer">{privilegeLabels[key]}</label>
                      <Switch
                        checked={privileges[key]}
                        onCheckedChange={() => togglePrivilege(key)}
                      />
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* === SCOPE ASSIGNMENT === */}
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

          <Separator />

          {/* === CONTACT DETAILS === */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>כתובות מייל נוספות</Label>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {emails.map(e => (
                  <div key={e} className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-md text-xs">
                    <Mail className="w-3 h-3" /><span>{e}</span>
                    <button type="button" onClick={() => setEmails(emails.filter(x => x !== e))}><X className="w-3 h-3 text-destructive" /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="הוסף מייל" className="text-sm" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addEmail())} />
                <Button type="button" variant="outline" size="icon" onClick={addEmail}><Plus className="w-4 h-4" /></Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>טלפונים</Label>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {phones.map(p => (
                  <div key={p} className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-md text-xs">
                    <Phone className="w-3 h-3" /><span>{p}</span>
                    <button type="button" onClick={() => setPhones(phones.filter(x => x !== p))}><X className="w-3 h-3 text-destructive" /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="הוסף טלפון" className="text-sm" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPhone())} />
                <Button type="button" variant="outline" size="icon" onClick={addPhone}><Plus className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>

          {/* === DEPARTMENT TAGS === */}
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
                    />
                    <label htmlFor={`tag-${dept}`} className="text-xs cursor-pointer">{dept}</label>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* === AVATAR COLOR === */}
          <div className="space-y-1.5">
            <Label>צבע</Label>
            <div className="flex flex-wrap gap-1.5">
              {colorOptions.map(c => (
                <button
                  key={c} type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* === ACTIONS === */}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !name.trim()}>
              {saveMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              שמור
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
