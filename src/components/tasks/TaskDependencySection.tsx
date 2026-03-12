import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, CheckCircle2, Clock, AlertTriangle, Link2 } from "lucide-react";
import { TaskFormData } from "@/hooks/useTaskForm";

interface TaskDependencySectionProps {
  formData: TaskFormData;
  updateField: <K extends keyof TaskFormData>(field: K, value: TaskFormData[K]) => void;
  onNavigateToTask?: (taskId: string) => void;
}

export function TaskDependencySection({ formData, updateField, onNavigateToTask }: TaskDependencySectionProps) {
  const [adding, setAdding] = useState(false);

  // Fetch details of dependent tasks
  const { data: depTasks = [] } = useQuery({
    queryKey: ["dependency-tasks", formData.dependsOn],
    queryFn: async () => {
      if (!formData.dependsOn || formData.dependsOn.length === 0) return [];
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, status, assignee")
        .in("id", formData.dependsOn);
      if (error) throw error;
      return data || [];
    },
    enabled: formData.dependsOn.length > 0,
  });

  // Fetch available tasks for adding dependencies (same project)
  const { data: availableTasks = [] } = useQuery({
    queryKey: ["available-dep-tasks", formData.projectId],
    queryFn: async () => {
      if (!formData.projectId) return [];
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, status")
        .eq("project_id", formData.projectId)
        .order("title");
      if (error) throw error;
      return data || [];
    },
    enabled: adding && !!formData.projectId,
  });

  const removeDep = (taskId: string) => {
    updateField('dependsOn', formData.dependsOn.filter(id => id !== taskId));
  };

  const addDep = (taskId: string) => {
    if (!formData.dependsOn.includes(taskId)) {
      updateField('dependsOn', [...formData.dependsOn, taskId]);
    }
    setAdding(false);
  };

  const isBlocked = depTasks.some(t => t.status !== 'completed');

  const statusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle2 className="w-3.5 h-3.5 text-success" />;
    if (status === 'in-progress') return <Clock className="w-3.5 h-3.5 text-info" />;
    return <AlertTriangle className="w-3.5 h-3.5 text-warning" />;
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      'completed': 'הושלם',
      'in-progress': 'בתהליך',
      'waiting': 'ממתין',
      'pending': 'לא התחיל',
      'blocked': 'חסום',
    };
    return map[status] || status;
  };

  return (
    <div className="space-y-3">
      {/* Blocked indicator */}
      {isBlocked && depTasks.length > 0 && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-warning/10 border border-warning/20 text-warning text-sm font-medium">
          <AlertTriangle className="w-4 h-4" />
          משימה זו חסומה — יש תלויות שטרם הושלמו
        </div>
      )}

      {/* List of dependencies */}
      {depTasks.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">תלויות ({depTasks.length})</Label>
          {depTasks.map(task => (
            <div key={task.id} className="flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors">
              {statusIcon(task.status)}
              <button
                type="button"
                className="flex-1 text-start text-sm hover:underline truncate"
                onClick={() => onNavigateToTask?.(task.id)}
              >
                {task.title}
              </button>
              <Badge variant="outline" className="text-[10px] shrink-0">
                {statusLabel(task.status)}
              </Badge>
              {task.assignee && (
                <span className="text-[10px] text-muted-foreground shrink-0">{task.assignee}</span>
              )}
              <button
                type="button"
                onClick={() => removeDep(task.id)}
                className="text-muted-foreground hover:text-destructive shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add dependency */}
      {adding ? (
        <div className="space-y-2">
          <Select onValueChange={(v) => v !== "cancel" && addDep(v)}>
            <SelectTrigger>
              <SelectValue placeholder="בחר משימה..." />
            </SelectTrigger>
            <SelectContent>
              {availableTasks
                .filter(t => !formData.dependsOn.includes(t.id))
                .map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    <div className="flex items-center gap-2">
                      {statusIcon(t.status)}
                      <span className="truncate">{t.title}</span>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
            ביטול
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 w-full"
          onClick={() => setAdding(true)}
          disabled={!formData.projectId}
        >
          <Link2 className="w-3.5 h-3.5" />
          הוסף תלות
        </Button>
      )}

      {!formData.projectId && (
        <p className="text-xs text-muted-foreground">בחר פרויקט כדי להוסיף תלויות</p>
      )}
    </div>
  );
}
