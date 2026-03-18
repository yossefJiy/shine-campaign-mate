import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Plus, Users, Star, X, Mail, Phone } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string | null;
  avatar_color: string | null;
  departments: string[];
}

interface ClientTeamAssignment {
  id: string;
  client_id: string;
  team_member_id: string;
  role: string | null;
  is_lead: boolean;
  team: TeamMember;
}

interface ClientTeamManagerProps {
  clientId: string;
  clientName: string;
}

export function ClientTeamManager({ clientId, clientName }: ClientTeamManagerProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [roles, setRoles] = useState<Record<string, string>>({});

  // Fetch all team members
  const { data: allTeamMembers = [] } = useQuery({
    queryKey: ["team-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team")
        .select("id, name, email, avatar_color, departments")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  // Fetch assigned team members for this client
  const { data: assignedTeam = [], isLoading } = useQuery({
    queryKey: ["client-team", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_team")
        .select(`
          id,
          client_id,
          team_member_id,
          role,
          is_lead,
          team:team_member_id (id, name, email, avatar_color, departments)
        `)
        .eq("client_id", clientId)
        .order("is_lead", { ascending: false });

      if (error) throw error;
      return data as unknown as ClientTeamAssignment[];
    },
    enabled: !!clientId,
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      const assignments = Array.from(selectedMembers).map(memberId => ({
        client_id: clientId,
        team_member_id: memberId,
        role: roles[memberId] || null,
        is_lead: false,
      }));

      const { error } = await supabase
        .from("client_team")
        .upsert(assignments, { onConflict: "client_id,team_member_id" });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-team", clientId] });
      toast.success("הצוות שויך בהצלחה");
      setDialogOpen(false);
      setSelectedMembers(new Set());
      setRoles({});
    },
    onError: (error: any) => {
      toast.error(error.message || "שגיאה בשיוך");
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from("client_team")
        .delete()
        .eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-team", clientId] });
      toast.success("חבר הצוות הוסר");
    },
    onError: (error: any) => {
      toast.error(error.message || "שגיאה בהסרה");
    },
  });

  const toggleLeadMutation = useMutation({
    mutationFn: async ({ assignmentId, isLead }: { assignmentId: string; isLead: boolean }) => {
      const { error } = await supabase
        .from("client_team")
        .update({ is_lead: isLead })
        .eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-team", clientId] });
    },
  });

  const openDialog = () => {
    // Pre-select already assigned members
    const assigned = new Set<string>(assignedTeam.map(a => a.team_member_id));
    setSelectedMembers(assigned);
    
    // Pre-fill roles
    const existingRoles: Record<string, string> = {};
    assignedTeam.forEach(a => {
      if (a.role) existingRoles[a.team_member_id] = a.role;
    });
    setRoles(existingRoles);
    
    setDialogOpen(true);
  };

  const toggleMember = (memberId: string) => {
    const newSet = new Set(selectedMembers);
    if (newSet.has(memberId)) {
      newSet.delete(memberId);
    } else {
      newSet.add(memberId);
    }
    setSelectedMembers(newSet);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            צוות משויך - {clientName}
          </CardTitle>
          <CardDescription>חברי הצוות העובדים עם הלקוח</CardDescription>
        </div>
        <Button onClick={openDialog} size="sm">
          <Plus className="w-4 h-4 ml-2" />
          שייך צוות
        </Button>
      </CardHeader>
      <CardContent>
        {assignedTeam.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>לא שויך צוות ללקוח זה</p>
            <Button variant="link" onClick={openDialog}>
              שייך חברי צוות
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {assignedTeam.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: assignment.team.avatar_color || "#6366f1" }}
                  >
                    {assignment.team.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{assignment.team.name}</span>
                      {assignment.is_lead && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                      {assignment.role && (
                        <Badge variant="secondary" className="text-xs">
                          {assignment.role}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      {assignment.team.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {assignment.team.email}
                        </span>
                      )}
                    </div>
                    {assignment.team.departments.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {assignment.team.departments.slice(0, 3).map(dept => (
                          <Badge key={dept} variant="outline" className="text-xs">
                            {dept}
                          </Badge>
                        ))}
                        {assignment.team.departments.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{assignment.team.departments.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLeadMutation.mutate({ 
                      assignmentId: assignment.id, 
                      isLead: !assignment.is_lead 
                    })}
                    className={assignment.is_lead ? "text-yellow-600" : "text-muted-foreground"}
                  >
                    <Star className={`w-4 h-4 ${assignment.is_lead ? "fill-current" : ""}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeMutation.mutate(assignment.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Assign Team Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>שיוך צוות ללקוח</DialogTitle>
            <DialogDescription>
              בחר את חברי הצוות שעובדים עם {clientName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {allTeamMembers.map((member) => (
              <div
                key={member.id}
                className={`flex items-center gap-4 p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedMembers.has(member.id) ? "bg-primary/10 border-primary" : "hover:bg-muted"
                }`}
                onClick={() => toggleMember(member.id)}
              >
                <Checkbox
                  checked={selectedMembers.has(member.id)}
                  onCheckedChange={() => toggleMember(member.id)}
                />
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: member.avatar_color || "#6366f1" }}
                >
                  {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{member.name}</p>
                  {member.departments.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {member.departments.slice(0, 2).join(", ")}
                    </p>
                  )}
                </div>
                {selectedMembers.has(member.id) && (
                  <Input
                    placeholder="תפקיד (אופציונלי)"
                    value={roles[member.id] || ""}
                    onChange={(e) => {
                      e.stopPropagation();
                      setRoles(prev => ({ ...prev, [member.id]: e.target.value }));
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-32 text-sm"
                  />
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              ביטול
            </Button>
            <Button 
              onClick={() => assignMutation.mutate()} 
              disabled={selectedMembers.size === 0 || assignMutation.isPending}
            >
              {assignMutation.isPending ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : null}
              שייך ({selectedMembers.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
