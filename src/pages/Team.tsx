import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/useAuth";
import {
  Mail, Plus, Loader2, Users, Edit2, Trash2,
  Crown, ChevronDown, Shield, FolderTree, Key, Globe, Languages,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TeamMemberDialog } from "@/components/team/TeamMemberDialog";
import { ROLE_LABELS } from "@/hooks/useAuth";

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
  has_system_access: boolean;
  interface_language: string;
  preferred_task_language: string;
  responsibility_domains: string[] | null;
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

export default function Team() {
  const queryClient = useQueryClient();
  const { isAdmin, canCreateTeams } = usePermissions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; member: TeamMember | null }>({ open: false, member: null });

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

  const { data: depts = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("*").order("name");
      if (error) throw error;
      return (data || []) as Department[];
    },
  });

  const { data: orgTeams = [] } = useQuery({
    queryKey: ["org-teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("org_teams").select("*").order("name");
      if (error) throw error;
      return (data || []) as OrgTeam[];
    },
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
    setDialogOpen(true);
  };

  const getMembersByDept = (deptId: string) => teamMembers.filter(m => m.department_id === deptId);
  const unassignedMembers = teamMembers.filter(m => !m.department_id);
  const getManagerName = (managerId: string | null) => managerId ? teamMembers.find(m => m.id === managerId)?.name || null : null;
  const getOrgTeamName = (teamId: string | null) => teamId ? orgTeams.find(t => t.id === teamId)?.name || null : null;
  const roleLabel = (role: string | null) => role ? (ROLE_LABELS[role] || role) : 'עובד צוות';

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-4 md:p-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48" />)}
          </div>
        </div>
      </MainLayout>
    );
  }

  const renderMemberCard = (member: TeamMember) => (
    <div key={member.id} className="bg-card border border-border rounded-xl overflow-hidden group hover:shadow-md transition-shadow">
      <div className="h-1.5" style={{ background: member.avatar_color || 'hsl(var(--primary))' }} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ backgroundColor: member.avatar_color || '#6366f1' }}
            >
              {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{member.name}</h3>
              {member.email && (
                <a href={`mailto:${member.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors truncate">
                  <Mail className="w-3 h-3 shrink-0" />
                  <span className="truncate">{member.email}</span>
                </a>
              )}
            </div>
          </div>
          {(isAdmin || canCreateTeams) && (
            <div className="flex gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDialog(member)}>
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteDialog({ open: true, member })}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          <Badge variant="default" className="text-[10px] gap-1">
            <Shield className="w-2.5 h-2.5" />
            {roleLabel(member.operational_role)}
          </Badge>
          {member.has_system_access && (
            <Badge variant="outline" className="text-[10px] gap-1 border-green-500/50 text-green-600">
              <Key className="w-2.5 h-2.5" />
              גישה
            </Badge>
          )}
          {getOrgTeamName(member.org_team_id) && (
            <Badge variant="outline" className="text-[10px] gap-1">
              <Users className="w-2.5 h-2.5" />
              {getOrgTeamName(member.org_team_id)}
            </Badge>
          )}
          {getManagerName(member.manager_id) && (
            <Badge variant="secondary" className="text-[10px] gap-1">
              <Crown className="w-2.5 h-2.5" />
              ← {getManagerName(member.manager_id)}
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px] gap-1">
            <Globe className="w-2.5 h-2.5" />
            {member.interface_language === 'en' ? 'EN' : 'HE'}
          </Badge>
          <Badge variant="outline" className="text-[10px] gap-1">
            <Languages className="w-2.5 h-2.5" />
            {member.preferred_task_language === 'en' ? 'EN' : 'HE'}
          </Badge>
        </div>

        {member.responsibility_domains && member.responsibility_domains.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {member.responsibility_domains.map(domain => (
              <Badge key={domain} variant="secondary" className="text-[10px]">{domain}</Badge>
            ))}
          </div>
        )}

        {member.departments.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {member.departments.map(dept => (
              <Badge key={dept} variant="outline" className="text-[10px] text-muted-foreground">{dept}</Badge>
            ))}
          </div>
        )}
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
          <Badge variant="outline" className="text-xs mr-2">{members.length}</Badge>
          {deptOrgTeams.length > 0 && (
            <Badge variant="secondary" className="text-xs">{deptOrgTeams.length} צוותים</Badge>
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          {deptOrgTeams.length > 0 && (
            <div className="mr-6 mb-4 space-y-3">
              {deptOrgTeams.map(ot => {
                const teamMembs = members.filter(m => m.org_team_id === ot.id);
                return (
                  <div key={ot.id} className="border border-border rounded-lg p-3 bg-muted/20">
                    <div className="flex items-center gap-2 mb-3">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mr-6 mb-6">
            {members.filter(m => !m.org_team_id).map(renderMemberCard)}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <MainLayout>
      <div className="p-4 md:p-8 space-y-6">
        <PageHeader
          title="צוות"
          description="ניהול מרכזי — היררכיה, תפקידים, הרשאות וגישה למערכת"
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
          <div className="bg-card border border-border rounded-xl p-8 md:p-12 text-center">
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
            {depts.map(renderDepartmentSection)}
            {unassignedMembers.length > 0 && (
              <div>
                <div className="flex items-center gap-2 p-3">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold text-lg text-muted-foreground">ללא מחלקה</span>
                  <Badge variant="outline" className="text-xs">{unassignedMembers.length}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mr-6">
                  {unassignedMembers.map(renderMemberCard)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <TeamMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        member={selectedMember}
        teamMembers={teamMembers}
        departments={depts}
        orgTeams={orgTeams}
      />

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
