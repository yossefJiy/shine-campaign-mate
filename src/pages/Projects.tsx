import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { DomainErrorBoundary } from "@/components/shared/DomainErrorBoundary";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  FolderKanban, 
  Plus, 
  Loader2, 
  Calendar, 
  CheckSquare,
  Clock,
  MoreVertical,
  Pencil,
  Trash2,
  Play,
  Pause,
  Check,
  Building2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { StyledDatePicker } from "@/components/ui/styled-date-picker";

const statusConfig: Record<string, { label: string; color: string; icon: typeof Play }> = {
  active: { label: "פעיל", color: "bg-success text-success-foreground", icon: Play },
  paused: { label: "מושהה", color: "bg-warning text-warning-foreground", icon: Pause },
  completed: { label: "הושלם", color: "bg-info text-info-foreground", icon: Check },
  archived: { label: "בארכיון", color: "bg-muted text-muted-foreground", icon: FolderKanban },
};

const priorityCategories = [
  { value: "revenue", label: "הכנסה", color: "bg-success/20 text-success" },
  { value: "growth", label: "צמיחה", color: "bg-info/20 text-info" },
  { value: "innovation", label: "חדשנות", color: "bg-warning/20 text-warning" },
  { value: "maintenance", label: "תחזוקה", color: "bg-muted text-muted-foreground" },
];

export default function Projects() {
  const { selectedClient, effectiveClient, isAgencyView, clients } = useClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [newProjectClientId, setNewProjectClientId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active",
    priority_category: "",
    start_date: "",
    target_date: "",
    budget_hours: "",
    color: "#3B82F6",
  });

  // Fetch projects
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects", selectedClient?.id],
    queryFn: async () => {
      // Always fetch all projects - filter by client OR show agency projects
      const { data, error } = await supabase
        .from("projects")
        .select("*, clients:clients!projects_client_id_fkey(name, is_master_account, deleted_at)")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Filter out projects from deleted clients
      const activeProjects = data.filter((p: any) => !p.clients?.deleted_at);
      
      // Filter: show selected client's projects + agency (master account) projects
      if (selectedClient) {
        return activeProjects.filter((p: any) => 
          p.client_id === selectedClient.id || 
          p.client_id === null ||
          p.clients?.is_master_account === true
        );
      }
      
      return activeProjects;
    },
  });

  // Fetch tasks for progress calculation
  const { data: allTasks = [] } = useQuery({
    queryKey: ["project-tasks", selectedClient?.id],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select("id, status, project_id")
        .not("project_id", "is", null);
      
      if (selectedClient) {
        query = query.eq("client_id", selectedClient.id);
      }
      
      const { data } = await query;
      return data || [];
    },
  });

  const getProjectProgress = (projectId: string) => {
    const projectTasks = allTasks.filter((t: any) => t.project_id === projectId);
    if (projectTasks.length === 0) return { total: 0, completed: 0, percent: 0 };
    
    const completed = projectTasks.filter((t: any) => t.status === "completed").length;
    return {
      total: projectTasks.length,
      completed,
      percent: Math.round((completed / projectTasks.length) * 100),
    };
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Determine target client: for new projects, use selected in dialog or effectiveClient
      const targetClientId = editingProject
        ? editingProject.client_id // Don't change client on edit
        : (newProjectClientId || effectiveClient?.id);
      
      if (!targetClientId) {
        throw new Error("יש לבחור לקוח לפני יצירת פרויקט");
      }

      const payload = {
        name: formData.name,
        description: formData.description || null,
        status: formData.status,
        priority_category: formData.priority_category || null,
        start_date: formData.start_date || null,
        target_date: formData.target_date || null,
        budget_hours: formData.budget_hours ? parseFloat(formData.budget_hours) : null,
        color: formData.color,
        client_id: targetClientId,
      };

      if (editingProject) {
        const { error } = await supabase
          .from("projects")
          .update(payload)
          .eq("id", editingProject.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("projects").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingProject ? "הפרויקט עודכן" : "הפרויקט נוצר");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      closeDialog();
    },
    onError: () => {
      toast.error("שגיאה בשמירת הפרויקט");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("הפרויקט נמחק");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const closeDialog = () => {
    setShowCreateDialog(false);
    setEditingProject(null);
    setNewProjectClientId(null); // Reset selected client
    setFormData({
      name: "",
      description: "",
      status: "active",
      priority_category: "",
      start_date: "",
      target_date: "",
      budget_hours: "",
      color: "#3B82F6",
    });
  };

  const openEdit = (project: any) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || "",
      status: project.status,
      priority_category: project.priority_category || "",
      start_date: project.start_date || "",
      target_date: project.target_date || "",
      budget_hours: project.budget_hours?.toString() || "",
      color: project.color || "#3B82F6",
    });
    setShowCreateDialog(true);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <DomainErrorBoundary domain="projects">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <PageHeader 
              title="פרויקטים"
              description={selectedClient ? `פרויקטים של ${selectedClient.name}` : "כל הפרויקטים"}
            />
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 ml-2" />
              פרויקט חדש
            </Button>
          </div>

          {projects.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <FolderKanban className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">אין פרויקטים עדיין</h3>
                <p className="text-muted-foreground mb-4">צור פרויקט חדש כדי לארגן משימות</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 ml-2" />
                  צור פרויקט ראשון
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project: any) => {
                const progress = getProjectProgress(project.id);
                const status = statusConfig[project.status] || statusConfig.active;
                const category = priorityCategories.find(c => c.value === project.priority_category);
                
                return (
                  <Card 
                    key={project.id} 
                    className="hover:shadow-lg transition-shadow group cursor-pointer"
                    style={{ borderTopColor: project.color, borderTopWidth: 3 }}
                    onClick={() => navigate(`/tasks?project=${project.id}`)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <FolderKanban 
                            className="w-5 h-5" 
                            style={{ color: project.color }}
                          />
                          <CardTitle className="text-base">{project.name}</CardTitle>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/tasks?project=${project.id}`); }}>
                              <CheckSquare className="w-4 h-4 ml-2" />
                              צפה במשימות ({progress.total})
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(project); }}>
                              <Pencil className="w-4 h-4 ml-2" />
                              עריכה
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(project.id); }}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 ml-2" />
                              מחיקה
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge className={status.color}>{status.label}</Badge>
                        {category && (
                          <Badge variant="outline" className={category.color}>
                            {category.label}
                          </Badge>
                        )}
                        {project.clients?.name && (
                          <Badge variant="outline" className="text-xs">
                            {project.clients.name}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {project.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {project.description}
                        </p>
                      )}

                      {/* Progress */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">התקדמות</span>
                          <span className="font-medium">{progress.percent}%</span>
                        </div>
                        <Progress value={progress.percent} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {progress.completed} מתוך {progress.total} משימות
                        </p>
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {project.target_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(project.target_date).toLocaleDateString("he-IL")}</span>
                          </div>
                        )}
                        {project.budget_hours && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{project.budget_hours} שעות</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <CheckSquare className="w-3 h-3" />
                          <span>{progress.total} משימות</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Create/Edit Dialog */}
          <Dialog open={showCreateDialog} onOpenChange={(open) => !open && closeDialog()}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingProject ? "עריכת פרויקט" : "פרויקט חדש"}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label>שם הפרויקט *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="לדוגמה: השקת אתר חדש"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>תיאור</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="תיאור קצר של הפרויקט"
                    rows={3}
                  />
                </div>

                {/* Client Selection - Only for new projects in agency view */}
                {isAgencyView && !editingProject && clients.length > 0 && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      לקוח
                    </Label>
                    <Select 
                      value={newProjectClientId || effectiveClient?.id || ""} 
                      onValueChange={(v) => setNewProjectClientId(v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר לקוח" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.filter(c => c.is_master_account).map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-3 h-3 text-primary" />
                              {c.name} (סוכנות)
                            </div>
                          </SelectItem>
                        ))}
                        {clients.filter(c => !c.is_master_account).map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>סטטוס</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(v) => setFormData({ ...formData, status: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusConfig).map(([value, config]) => (
                          <SelectItem key={value} value={value}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>קטגוריית עדיפות</Label>
                    <Select 
                      value={formData.priority_category} 
                      onValueChange={(v) => setFormData({ ...formData, priority_category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר קטגוריה" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityCategories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>תאריך התחלה</Label>
                    <StyledDatePicker
                      value={formData.start_date ? new Date(formData.start_date) : undefined}
                      onChange={(date) => setFormData({ ...formData, start_date: date ? date.toISOString().split('T')[0] : "" })}
                      placeholder="בחר תאריך"
                      showQuickOptions={false}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>תאריך יעד</Label>
                    <StyledDatePicker
                      value={formData.target_date ? new Date(formData.target_date) : undefined}
                      onChange={(date) => setFormData({ ...formData, target_date: date ? date.toISOString().split('T')[0] : "" })}
                      placeholder="בחר תאריך"
                      showQuickOptions={false}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>תקציב שעות</Label>
                    <Input
                      type="number"
                      value={formData.budget_hours}
                      onChange={(e) => setFormData({ ...formData, budget_hours: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>צבע</Label>
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="h-10 p-1"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    ביטול
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                    {editingProject ? "שמור שינויים" : "צור פרויקט"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </DomainErrorBoundary>
    </MainLayout>
  );
}