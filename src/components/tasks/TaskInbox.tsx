import { useState } from "react";
import { format, differenceInHours } from "date-fns";
import { 
  Inbox, 
  AlertTriangle, 
  FolderKanban, 
  Clock, 
  User,
  CheckCircle2,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  Loader2,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { microcopy } from "@/lib/microcopy";
import { toast } from "sonner";

interface InboxTask {
  id: string;
  title: string;
  created_at: string;
  assignee: string | null;
  priority: string;
  client_name?: string;
  client_id?: string;
}

interface Project {
  id: string;
  name: string;
  color: string | null;
}

interface Stage {
  id: string;
  name: string;
  project_id: string;
}

interface TaskInboxProps {
  tasks: InboxTask[];
  projects: Project[];
  stages?: Stage[];
  onAssignToProject: (taskId: string, projectId: string, stageId?: string) => void;
  onMarkComplete?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onCreateProject?: (name: string, clientId?: string) => Promise<string | null>;
  onCreateStage?: (projectId: string, name: string) => Promise<string | null>;
  onClickTask?: (taskId: string) => void;
  isAssigning?: boolean;
}

export function TaskInbox({ 
  tasks, projects, stages = [], 
  onAssignToProject, onMarkComplete, onDelete,
  onCreateProject, onCreateStage, onClickTask,
  isAssigning 
}: TaskInboxProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Record<string, string>>({});
  const [selectedStage, setSelectedStage] = useState<Record<string, string>>({});
  const [createProjectDialog, setCreateProjectDialog] = useState<{ open: boolean; taskId: string; clientId?: string }>({ open: false, taskId: "", clientId: undefined });
  const [createStageDialog, setCreateStageDialog] = useState<{ open: boolean; taskId: string; projectId: string }>({ open: false, taskId: "", projectId: "" });
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  if (tasks.length === 0) {
    return null;
  }

  const handleAssign = (taskId: string) => {
    const projectId = selectedProject[taskId];
    if (!projectId) {
      toast.error("בחר פרויקט לפני שיוך");
      return;
    }
    const stageId = selectedStage[taskId] || undefined;
    onAssignToProject(taskId, projectId, stageId);
    setExpandedTask(null);
  };

  const getStagesForProject = (projectId: string) => {
    return stages.filter(s => s.project_id === projectId);
  };

  const handleCreateProject = async () => {
    if (!newName.trim() || !onCreateProject) return;
    setIsCreating(true);
    try {
      const projectId = await onCreateProject(newName.trim(), createProjectDialog.clientId);
      if (projectId) {
        setSelectedProject(prev => ({ ...prev, [createProjectDialog.taskId]: projectId }));
        toast.success("פרויקט נוצר בהצלחה");
      }
    } finally {
      setIsCreating(false);
      setCreateProjectDialog({ open: false, taskId: "", clientId: undefined });
      setNewName("");
    }
  };

  const handleCreateStage = async () => {
    if (!newName.trim() || !onCreateStage) return;
    setIsCreating(true);
    try {
      const stageId = await onCreateStage(createStageDialog.projectId, newName.trim());
      if (stageId) {
        setSelectedStage(prev => ({ ...prev, [createStageDialog.taskId]: stageId }));
        toast.success("שלב נוצר בהצלחה");
      }
    } finally {
      setIsCreating(false);
      setCreateStageDialog({ open: false, taskId: "", projectId: "" });
      setNewName("");
    }
  };

  return (
    <>
      <Card className="border-warning/50 bg-warning/5 mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Inbox className="w-5 h-5 text-warning" />
              <CardTitle className="text-base">{microcopy.tasks.inboxTitle}</CardTitle>
              <Badge variant="secondary" className="bg-warning/20 text-warning">
                {tasks.length}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {microcopy.tasks.inboxDescription}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {tasks.map((task) => {
            const hoursOld = differenceInHours(new Date(), new Date(task.created_at));
            const isUrgent = hoursOld > 20;
            const isExpanded = expandedTask === task.id;
            const taskProjectId = selectedProject[task.id];
            const projectStages = taskProjectId ? getStagesForProject(taskProjectId) : [];
            
            return (
              <div key={task.id} className="rounded-lg border bg-background overflow-hidden">
                {/* Task Row - Clickable */}
                <div 
                  className={cn(
                    "flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                    isUrgent && "border-destructive/50 bg-destructive/5",
                    isExpanded && "border-b"
                  )}
                  onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium truncate">{task.title}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {task.client_name && <span>{task.client_name}</span>}
                        {task.assignee && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {task.assignee}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {hoursOld < 1 ? "פחות משעה" : `לפני ${hoursOld} שעות`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isUrgent && (
                      <Badge variant="destructive" className="text-xs gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        נדרש שיוך
                      </Badge>
                    )}
                    
                    {/* Quick Actions */}
                    {onMarkComplete && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={(e) => { e.stopPropagation(); onMarkComplete(task.id); }}
                        title="סמן כהושלם"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                        title="מחק"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded Assignment Panel */}
                {isExpanded && (
                  <div className="p-3 bg-muted/30 space-y-3">
                    {/* Project Selection */}
                    <div className="flex items-center gap-2">
                      <FolderKanban className="w-4 h-4 text-muted-foreground shrink-0" />
                      <Select 
                        value={selectedProject[task.id] || ""} 
                        onValueChange={(v) => {
                          setSelectedProject(prev => ({ ...prev, [task.id]: v }));
                          setSelectedStage(prev => ({ ...prev, [task.id]: "" }));
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="בחר פרויקט" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              <div className="flex items-center gap-2">
                                <span 
                                  className="w-2 h-2 rounded-full shrink-0" 
                                  style={{ backgroundColor: p.color || 'hsl(var(--primary))' }} 
                                />
                                {p.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {onCreateProject && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0"
                          onClick={() => setCreateProjectDialog({ open: true, taskId: task.id, clientId: task.client_id })}
                        >
                          <Plus className="w-3 h-3 ml-1" />
                          חדש
                        </Button>
                      )}
                    </div>

                    {/* Stage Selection (shown when project selected) */}
                    {taskProjectId && (
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-muted-foreground shrink-0" />
                        <Select 
                          value={selectedStage[task.id] || ""} 
                          onValueChange={(v) => setSelectedStage(prev => ({ ...prev, [task.id]: v }))}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="בחר שלב (אופציונלי)" />
                          </SelectTrigger>
                          <SelectContent>
                            {projectStages.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                            {projectStages.length === 0 && (
                              <div className="p-2 text-xs text-muted-foreground text-center">
                                אין שלבים בפרויקט זה
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        {onCreateStage && taskProjectId && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0"
                            onClick={() => setCreateStageDialog({ open: true, taskId: task.id, projectId: taskProjectId })}
                          >
                            <Plus className="w-3 h-3 ml-1" />
                            חדש
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-1">
                      {onClickTask && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onClickTask(task.id)}
                        >
                          ערוך משימה
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        onClick={() => handleAssign(task.id)}
                        disabled={!selectedProject[task.id] || isAssigning}
                        className="mr-auto"
                      >
                        {isAssigning && <Loader2 className="w-4 h-4 ml-1 animate-spin" />}
                        <FolderKanban className="w-4 h-4 ml-1" />
                        שייך לפרויקט
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <p className="text-xs text-muted-foreground text-center pt-2">
            ⚠️ {microcopy.tasks.noProjectWarning}
          </p>
        </CardContent>
      </Card>

      {/* Create Project Dialog */}
      <Dialog open={createProjectDialog.open} onOpenChange={(open) => setCreateProjectDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>פרויקט חדש</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="שם הפרויקט"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateProjectDialog({ open: false, taskId: "", clientId: undefined }); setNewName(""); }}>
              ביטול
            </Button>
            <Button onClick={handleCreateProject} disabled={!newName.trim() || isCreating}>
              {isCreating && <Loader2 className="w-4 h-4 ml-1 animate-spin" />}
              צור פרויקט
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Stage Dialog */}
      <Dialog open={createStageDialog.open} onOpenChange={(open) => setCreateStageDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>שלב חדש</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="שם השלב"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateStage()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateStageDialog({ open: false, taskId: "", projectId: "" }); setNewName(""); }}>
              ביטול
            </Button>
            <Button onClick={handleCreateStage} disabled={!newName.trim() || isCreating}>
              {isCreating && <Loader2 className="w-4 h-4 ml-1 animate-spin" />}
              צור שלב
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
