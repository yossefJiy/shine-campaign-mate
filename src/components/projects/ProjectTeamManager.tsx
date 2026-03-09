import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, X, Crown, Users } from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/useAuth";

interface ProjectTeamManagerProps {
  projectId: string;
}

export function ProjectTeamManager({ projectId }: ProjectTeamManagerProps) {
  const queryClient = useQueryClient();
  const { isAdmin, isManager, canManageProjectAssignments } = usePermissions();
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const canManage = isAdmin || isManager || canManageProjectAssignments;

  // Fetch current project team
  const { data: projectTeam = [], isLoading: teamLoading } = useQuery({
    queryKey: ["project-team", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_team")
        .select("*, team:team_member_id(id, name, email, departments, avatar_color, is_active)")
        .eq("project_id", projectId);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch all active team members for the dropdown
  const { data: allMembers = [] } = useQuery({
    queryKey: ["team-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team")
        .select("id, name, email, departments, avatar_color")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: canManage,
  });

  const assignedIds = new Set(projectTeam.map((pt: any) => pt.team_member_id));
  const availableMembers = allMembers.filter((m: any) => !assignedIds.has(m.id));

  const addMutation = useMutation({
    mutationFn: async (teamMemberId: string) => {
      const { error } = await supabase
        .from("project_team")
        .insert({ project_id: projectId, team_member_id: teamMemberId, role: "member" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-team", projectId] });
      setSelectedMemberId("");
      toast.success("חבר צוות שויך לפרויקט");
    },
    onError: () => toast.error("שגיאה בשיוך"),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_team").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-team", projectId] });
      toast.success("חבר צוות הוסר מהפרויקט");
    },
    onError: () => toast.error("שגיאה בהסרה"),
  });

  const setLeadMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const { error } = await supabase
        .from("project_team")
        .update({ role })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-team", projectId] });
      toast.success("התפקיד עודכן");
    },
    onError: () => toast.error("שגיאה בעדכון"),
  });

  if (teamLoading) {
    return <div className="flex items-center justify-center py-8 text-muted-foreground">טוען...</div>;
  }

  return (
    <ScrollArea className="h-[500px] pr-4">
      <div className="space-y-6">
        {/* Add member */}
        {canManage && (
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר חבר צוות להוספה..." />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers.map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ backgroundColor: m.avatar_color || "hsl(var(--primary))" }}
                        >
                          {m.name?.[0] || "?"}
                        </span>
                        {m.name}
                      </span>
                    </SelectItem>
                  ))}
                  {availableMembers.length === 0 && (
                    <SelectItem value="_none" disabled>כל חברי הצוות כבר משויכים</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => selectedMemberId && addMutation.mutate(selectedMemberId)}
              disabled={!selectedMemberId || addMutation.isPending}
              size="sm"
            >
              <UserPlus className="h-4 w-4 ml-1" />
              הוסף
            </Button>
          </div>
        )}

        {/* Team list */}
        {projectTeam.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>אין חברי צוות משויכים לפרויקט</p>
          </div>
        ) : (
          <div className="space-y-2">
            {projectTeam.map((pt: any) => {
              const member = pt.team;
              if (!member) return null;
              return (
                <div
                  key={pt.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ backgroundColor: member.avatar_color || "hsl(var(--primary))" }}
                    >
                      {member.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{member.name}</span>
                        {pt.role === "lead" && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Crown className="h-3 w-3" />
                            ליד
                          </Badge>
                        )}
                      </div>
                      {member.departments?.length > 0 && (
                        <div className="flex gap-1 mt-0.5">
                          {member.departments.slice(0, 3).map((d: string) => (
                            <Badge key={d} variant="outline" className="text-[10px] py-0">
                              {d}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() =>
                          setLeadMutation.mutate({
                            id: pt.id,
                            role: pt.role === "lead" ? "member" : "lead",
                          })
                        }
                      >
                        <Crown className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => removeMutation.mutate(pt.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
