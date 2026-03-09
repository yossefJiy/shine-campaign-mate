import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/hooks/useClient";
import { usePermissions, ROLE_LABELS } from "@/hooks/useAuth";
import { 
  Mail, 
  Plus,
  Loader2,
  Users,
  Edit2,
  Trash2,
  Phone,
  X,
  Building2,
  Crown,
  ChevronDown,
  Shield,
  FolderTree,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ClientContactsManager } from "@/components/client/ClientContactsManager";
import { ClientTeamManager } from "@/components/client/ClientTeamManager";
import { TeamDayBoard } from "@/components/tasks/TeamDayBoard";

interface TeamMember {
  id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  emails: string[];
  phones: string[];
  departments: string[];
  avatar_url: string | null;
  avatar_color: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  manager_id: string | null;
  department_id: string | null;
  org_team_id: string | null;
  operational_role: string | null;
}

interface Department {
  id: string;
  name: string;
  description: string | null;
  manager_user_id: string | null;
}

interface OrgTeam {
  id: string;
  name: string;
  department_id: string | null;
  manager_team_member_id: string | null;
}

const colorOptions = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#ef4444",
  "#f97316", "#f59e0b", "#84cc16", "#22c55e", "#14b8a6",
  "#06b6d4", "#0ea5e9", "#3b82f6",
];

const departmentOptions = [
  "קריאייטיב", "תוכן", "אסטרטגיה", "קופירייטינג", "קמפיינים",
  "מנהל מוצר", "מנהל פרוייקטים", "סטודיו", "גרפיקה", "סרטונים",
  "כלי AI", "מיתוג", "אפיון אתרים", "חוויית משתמש", "עיצוב אתרים",
  "תכנות", "ניהול אתרים", "מדיה"
];

const operationalRoleOptions = [
  { value: 'department_manager', label: 'מנהל מחלקה' },
  { value: 'team_manager', label: 'מנהל צוות' },
  { value: 'team_employee', label: 'עובד צוות' },
];

export default function Team() {
  const queryClient = useQueryClient();
  const { selectedClient } = useClient();
  const { isAdmin, canCreateTeams } = usePermissions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; member: TeamMember | null }>({ open: false, member: null });
  
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formEmails, setFormEmails] = useState<string[]>([]);
  const [formPhones, setFormPhones] = useState<string[]>([]);
  const [formNewEmail, setFormNewEmail] = useState("");
  const [formNewPhone, setFormNewPhone] = useState("");
  const [formDepartments, setFormDepartments] = useState<string[]>([]);
  const [formColor, setFormColor] = useState("#6366f1");
  const [formManagerId, setFormManagerId] = useState<string>("");
  const [formDepartmentId, setFormDepartmentId] = useState<string>("");
  const [formOrgTeamId, setFormOrgTeamId] = useState<string>("");
  const [formOperationalRole, setFormOperationalRole] = useState<string>("team_employee");

  const isMasterAccount = selectedClient?.is_master_account === true;

  // Fetch team members
  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []) as TeamMember[];
    },
  });

  // Fetch departments
  const { data: depts = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("*").order("name");
      if (error) throw error;
      return (data || []) as Department[];
    },
  });

  // Fetch org teams
  const { data: orgTeams = [] } = useQuery({
    queryKey: ["org-teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("org_teams").select("*").order("name");
      if (error) throw error;
      return (data || []) as OrgTeam[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { 
      id?: string; name: string; email: string; emails: string[]; phones: string[]; 
      departments: string[]; avatar_color: string; manager_id: string | null;
      department_id: string | null; org_team_id: string | null; operational_role: string;
    }) => {
      const payload = { 
        name: data.name, 
        email: data.email, 
        emails: data.emails,
        phones: data.phones,
        departments: data.departments, 
        avatar_color: data.avatar_color,
        manager_id: data.manager_id || null,
        department_id: data.department_id || null,
        org_team_id: data.org_team_id || null,
        operational_role: data.operational_role,
        updated_at: new Date().toISOString(),
      };
      if (data.id) {
        const { error } = await supabase.from("team").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("team").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      queryClient.invalidateQueries({ queryKey: ["team-active"] });
      toast.success("נשמר בהצלחה");
      closeDialog();
    },
    onError: () => toast.error("שגיאה בשמירה"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team").update({ is_active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      toast.success("נמחק בהצלחה");
      setDeleteDialog({ open: false, member: null });
    },
    onError: () => toast.error("שגיאה במחיקה"),
  });

  const openDialog = (member?: TeamMember) => {
    setSelectedMember(member || null);
    setFormName(member?.name || "");
    setFormEmail(member?.email || "");
    setFormEmails(member?.emails || []);
    setFormPhones(member?.phones || []);
    setFormDepartments(member?.departments || []);
    setFormColor(member?.avatar_color || "#6366f1");
    setFormManagerId(member?.manager_id || "");
    setFormDepartmentId(member?.department_id || "");
    setFormOrgTeamId(member?.org_team_id || "");
    setFormOperationalRole(member?.operational_role || "team_employee");
    setFormNewEmail("");
    setFormNewPhone("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedMember(null);
    setFormName("");
    setFormEmail("");
    setFormEmails([]);
    setFormPhones([]);
    setFormNewEmail("");
    setFormNewPhone("");
    setFormDepartments([]);
    setFormColor("#6366f1");
    setFormManagerId("");
    setFormDepartmentId("");
    setFormOrgTeamId("");
    setFormOperationalRole("team_employee");
  };

  const handleSave = () => {
    if (!formName.trim()) {
      toast.error("נא להזין שם");
      return;
    }
    saveMutation.mutate({
      id: selectedMember?.id,
      name: formName,
      email: formEmail,
      emails: formEmails,
      phones: formPhones,
      departments: formDepartments,
      avatar_color: formColor,
      manager_id: formManagerId || null,
      department_id: formDepartmentId || null,
      org_team_id: formOrgTeamId || null,
      operational_role: formOperationalRole,
    });
  };

  const addEmail = () => {
    if (formNewEmail.trim() && !formEmails.includes(formNewEmail.trim())) {
      setFormEmails([...formEmails, formNewEmail.trim()]);
      setFormNewEmail("");
    }
  };

  const removeEmail = (email: string) => setFormEmails(formEmails.filter(e => e !== email));

  const addPhone = () => {
    if (formNewPhone.trim() && !formPhones.includes(formNewPhone.trim())) {
      setFormPhones([...formPhones, formNewPhone.trim()]);
      setFormNewPhone("");
    }
  };

  const removePhone = (phone: string) => setFormPhones(formPhones.filter(p => p !== phone));

  const toggleDepartment = (dept: string) => {
    setFormDepartments(prev => 
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  };

  // Group members by department
  const getMembersByDept = (deptId: string) => teamMembers.filter(m => m.department_id === deptId);
  const unassignedMembers = teamMembers.filter(m => !m.department_id);
  const getManagerName = (managerId: string | null) => {
    if (!managerId) return null;
    return teamMembers.find(m => m.id === managerId)?.name || null;
  };
  const getDeptName = (deptId: string | null) => {
    if (!deptId) return null;
    return depts.find(d => d.id === deptId)?.name || null;
  };
  const getOrgTeamName = (teamId: string | null) => {
    if (!teamId) return null;
    return orgTeams.find(t => t.id === teamId)?.name || null;
  };

  const roleLabel = (role: string | null) => {
    if (!role) return 'עובד צוות';
    return ROLE_LABELS[role] || role;
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-4 md:p-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64" />)}
          </div>
        </div>
      </MainLayout>
    );
  }

  const renderMemberCard = (member: TeamMember) => (
    <div key={member.id} className="glass rounded-xl card-shadow overflow-hidden group">
      <div className="h-2" style={{ background: `linear-gradient(to right, ${member.avatar_color || '#6366f1'}, ${member.avatar_color || '#6366f1'}80)` }} />
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
              style={{ backgroundColor: member.avatar_color || '#6366f1' }}
            >
              {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h3 className="text-lg font-bold">{member.name}</h3>
              {member.email && (
                <a href={`mailto:${member.email}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Mail className="w-3 h-3" />
                  {member.email}
                </a>
              )}
            </div>
          </div>
          {(isAdmin || canCreateTeams) && (
            <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(member)}>
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteDialog({ open: true, member })}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Role & hierarchy info */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          <Badge variant="default" className="text-xs gap-1">
            <Shield className="w-3 h-3" />
            {roleLabel(member.operational_role)}
          </Badge>
          {getOrgTeamName(member.org_team_id) && (
            <Badge variant="outline" className="text-xs gap-1">
              <Users className="w-3 h-3" />
              {getOrgTeamName(member.org_team_id)}
            </Badge>
          )}
          {getManagerName(member.manager_id) && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Crown className="w-3 h-3" />
              ← {getManagerName(member.manager_id)}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {member.departments.map((dept) => (
            <Badge key={dept} variant="secondary" className="text-xs">{dept}</Badge>
          ))}
          {member.departments.length === 0 && (
            <span className="text-sm text-muted-foreground">אין תגיות מחלקה</span>
          )}
        </div>
      </div>
    </div>
  );

  const renderDepartmentSection = (dept: Department) => {
    const members = getMembersByDept(dept.id);
    const deptOrgTeams = orgTeams.filter(t => t.department_id === dept.id);

    return (
      <Collapsible key={dept.id} defaultOpen>
        <CollapsibleTrigger className="flex items-center gap-2 w-full text-right p-3 rounded-lg hover:bg-muted/50 transition-colors">
          <ChevronDown className="w-4 h-4 transition-transform" />
          <FolderTree className="w-4 h-4 text-primary" />
          <span className="font-semibold text-lg">{dept.name}</span>
          <Badge variant="outline" className="text-xs mr-2">{members.length} חברים</Badge>
          {deptOrgTeams.length > 0 && (
            <Badge variant="secondary" className="text-xs">{deptOrgTeams.length} צוותות</Badge>
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          {/* Org teams within department */}
          {deptOrgTeams.length > 0 && (
            <div className="mr-6 mb-4 space-y-2">
              {deptOrgTeams.map(ot => {
                const teamMembs = members.filter(m => m.org_team_id === ot.id);
                return (
                  <div key={ot.id} className="border rounded-lg p-3 bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium text-sm">{ot.name}</span>
                      <Badge variant="outline" className="text-[10px]">{teamMembs.length}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {teamMembs.map(renderMemberCard)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Members not in any org team */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mr-6 mb-6">
            {members.filter(m => !m.org_team_id).map(renderMemberCard)}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <MainLayout>
      <div className="p-4 md:p-8 space-y-8">
        {/* Team Day Board - Show for master account */}
        {isMasterAccount && (
          <div className="opacity-0 animate-slide-up" style={{ animationDelay: "0.05s", animationFillMode: "forwards" }}>
            <TeamDayBoard />
          </div>
        )}

        {/* Assigned Agency Team Section */}
        {selectedClient && (
          <div className="opacity-0 animate-slide-up" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
            <ClientTeamManager clientId={selectedClient.id} clientName={selectedClient.name} />
          </div>
        )}

        {/* Client Contacts Section */}
        {selectedClient && (
          <div className="opacity-0 animate-slide-up" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
            <ClientContactsManager clientId={selectedClient.id} clientName={selectedClient.name} />
          </div>
        )}

        {/* Agency Team - Hierarchy View */}
        {isMasterAccount && (
          <div className="opacity-0 animate-slide-up" style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
            <PageHeader 
              title="צוות הסוכנות"
              description="מבנה ארגוני, מחלקות וצוותות"
              actions={
                (isAdmin || canCreateTeams) ? (
                  <Button onClick={() => openDialog()}>
                    <Plus className="w-4 h-4 ml-2" />
                    הוסף חבר צוות
                  </Button>
                ) : undefined
              }
            />

            {teamMembers.length === 0 ? (
              <div className="glass rounded-xl p-8 md:p-12 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">אין חברי צוות</h3>
                <p className="text-muted-foreground mb-4">הוסף חברי צוות כדי להתחיל</p>
                {(isAdmin || canCreateTeams) && (
                  <Button onClick={() => openDialog()}>
                    <Plus className="w-4 h-4 ml-2" />
                    הוסף חבר צוות
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Departments */}
                {depts.map(renderDepartmentSection)}

                {/* Unassigned members */}
                {unassignedMembers.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 p-3">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold text-lg text-muted-foreground">ללא מחלקה</span>
                      <Badge variant="outline" className="text-xs">{unassignedMembers.length}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mr-6">
                      {unassignedMembers.map(renderMemberCard)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* No client selected */}
        {!selectedClient && (
          <div className="glass rounded-xl p-8 md:p-12 text-center opacity-0 animate-slide-up" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
            <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">בחר לקוח</h3>
            <p className="text-muted-foreground">בחר לקוח מהתפריט כדי לראות את אנשי הקשר שלו</p>
          </div>
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedMember ? "עריכת חבר צוות" : "הוספת חבר צוות"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>שם</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="שם מלא" />
            </div>
            <div className="space-y-2">
              <Label>אימייל ראשי</Label>
              <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@example.com" />
            </div>
            
            {/* Operational Role */}
            <div className="space-y-2">
              <Label>תפקיד תפעולי</Label>
              <Select value={formOperationalRole} onValueChange={setFormOperationalRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {operationalRoleOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label>מחלקה</Label>
              <Select value={formDepartmentId} onValueChange={setFormDepartmentId}>
                <SelectTrigger><SelectValue placeholder="בחר מחלקה..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא מחלקה</SelectItem>
                  {depts.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Org Team */}
            {formDepartmentId && formDepartmentId !== 'none' && (
              <div className="space-y-2">
                <Label>צוות</Label>
                <Select value={formOrgTeamId} onValueChange={setFormOrgTeamId}>
                  <SelectTrigger><SelectValue placeholder="בחר צוות..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">ללא צוות</SelectItem>
                    {orgTeams.filter(t => t.department_id === formDepartmentId).map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Manager */}
            <div className="space-y-2">
              <Label>מנהל ישיר</Label>
              <Select value={formManagerId} onValueChange={setFormManagerId}>
                <SelectTrigger><SelectValue placeholder="בחר מנהל ישיר..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא מנהל ישיר</SelectItem>
                  {teamMembers
                    .filter(m => m.id !== selectedMember?.id && (m.operational_role === 'department_manager' || m.operational_role === 'team_manager'))
                    .map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Multiple Emails */}
            <div className="space-y-2">
              <Label>כתובות מייל נוספות</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formEmails.map((email) => (
                  <div key={email} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm">
                    <Mail className="w-3 h-3 text-muted-foreground" />
                    <span>{email}</span>
                    <button type="button" onClick={() => removeEmail(email)} className="text-destructive hover:text-destructive/80">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input type="email" value={formNewEmail} onChange={(e) => setFormNewEmail(e.target.value)} placeholder="הוסף כתובת מייל" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())} />
                <Button type="button" variant="outline" size="icon" onClick={addEmail}><Plus className="w-4 h-4" /></Button>
              </div>
            </div>

            {/* Multiple Phones */}
            <div className="space-y-2">
              <Label>מספרי טלפון</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formPhones.map((phone) => (
                  <div key={phone} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm">
                    <Phone className="w-3 h-3 text-muted-foreground" />
                    <span>{phone}</span>
                    <button type="button" onClick={() => removePhone(phone)} className="text-destructive hover:text-destructive/80">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input type="tel" value={formNewPhone} onChange={(e) => setFormNewPhone(e.target.value)} placeholder="הוסף מספר טלפון" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPhone())} />
                <Button type="button" variant="outline" size="icon" onClick={addPhone}><Plus className="w-4 h-4" /></Button>
              </div>
            </div>

            {/* Department Tags */}
            <div className="space-y-2">
              <Label>תגיות מחלקה</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {departmentOptions.map((dept) => (
                  <div key={dept} className="flex items-center gap-2">
                    <Checkbox id={dept} checked={formDepartments.includes(dept)} onCheckedChange={() => toggleDepartment(dept)} />
                    <label htmlFor={dept} className="text-sm cursor-pointer">{dept}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Avatar Color */}
            <div className="space-y-2">
              <Label>צבע אווטאר</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormColor(color)}
                    className={`w-8 h-8 rounded-full transition-all ${formColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: formColor }}>
                  {formName ? formName.split(' ').map(n => n[0]).join('').slice(0, 2) : 'AB'}
                </div>
                <span className="text-sm text-muted-foreground">תצוגה מקדימה</span>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={closeDialog}>ביטול</Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                שמור
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>אישור מחיקה</AlertDialogTitle>
            <AlertDialogDescription>האם למחוק את "{deleteDialog.member?.name}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteDialog.member && deleteMutation.mutate(deleteDialog.member.id)} className="bg-destructive hover:bg-destructive/90">
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
