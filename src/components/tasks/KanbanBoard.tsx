import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, GripVertical, Clock, User, Flag, Calendar, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  assignee: string | null;
  project_id: string | null;
  projects?: { name: string; color: string } | null;
}

const columns = [
  { id: "pending", label: "ממתין", color: "border-l-warning" },
  { id: "in-progress", label: "בתהליך", color: "border-l-info" },
  { id: "review", label: "בבדיקה", color: "border-l-purple-500" },
  { id: "completed", label: "הושלם", color: "border-l-success" },
];

const priorityConfig: Record<string, { color: string; label: string }> = {
  low: { color: "bg-muted text-muted-foreground", label: "נמוכה" },
  medium: { color: "bg-warning/20 text-warning", label: "בינונית" },
  high: { color: "bg-destructive/20 text-destructive", label: "גבוהה" },
};

interface KanbanBoardProps {
  clientId?: string;
  projectId?: string;
}

export function KanbanBoard({ clientId, projectId }: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const [quickAddColumn, setQuickAddColumn] = useState<string | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Fetch team members for assignee name lookup
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-kanban"],
    queryFn: async () => {
      const { data } = await supabase.from("team").select("id, name").eq("is_active", true);
      return (data || []) as { id: string; name: string }[];
    },
  });

  // Map team member ID to name
  const getAssigneeName = (assigneeId: string | null) => {
    if (!assigneeId) return null;
    const member = teamMembers.find(m => m.id === assigneeId);
    return member?.name || assigneeId.substring(0, 8);
  };

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["kanban-tasks", clientId, projectId],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select("*, projects:projects!tasks_project_id_fkey(name, color)")
        .order("created_at", { ascending: false });

      if (clientId) {
        query = query.eq("client_id", clientId);
      }
      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Task[];
    },
  });

  const tasksByColumn = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    columns.forEach((col) => {
      grouped[col.id] = tasks.filter((t) => t.status === col.id);
    });
    return grouped;
  }, [tasks]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string; newStatus: string }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-tasks"] });
      toast.success("הסטטוס עודכן");
    },
    onError: () => {
      toast.error("שגיאה בעדכון הסטטוס");
    },
  });

  const quickAddMutation = useMutation({
    mutationFn: async ({ title, status }: { title: string; status: string }) => {
      const { error } = await supabase.from("tasks").insert({
        title,
        status,
        priority: "medium",
        client_id: clientId || null,
        project_id: projectId || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-tasks"] });
      setQuickAddColumn(null);
      setQuickAddTitle("");
      toast.success("המשימה נוספה");
    },
    onError: () => {
      toast.error("שגיאה בהוספת המשימה");
    },
  });

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDragEnd = () => {
    if (draggedTask && dragOverColumn) {
      const task = tasks.find((t) => t.id === draggedTask);
      if (task && task.status !== dragOverColumn) {
        updateStatusMutation.mutate({ taskId: draggedTask, newStatus: dragOverColumn });
      }
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleQuickAdd = (status: string) => {
    if (quickAddTitle.trim()) {
      quickAddMutation.mutate({ title: quickAddTitle.trim(), status });
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {columns.map((col) => (
          <div key={col.id} className="h-[600px] bg-muted/30 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((column) => (
        <div
          key={column.id}
          onDragOver={(e) => handleDragOver(e, column.id)}
          onDragLeave={() => setDragOverColumn(null)}
          onDrop={handleDragEnd}
          className={cn(
            "flex flex-col h-[calc(100vh-200px)] bg-muted/20 rounded-xl border border-transparent transition-all",
            dragOverColumn === column.id && "border-primary bg-primary/5"
          )}
        >
          {/* Column Header */}
          <div className={cn("p-3 border-l-4 rounded-t-xl bg-muted/30", column.color)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{column.label}</h3>
                <Badge variant="secondary" className="text-xs">
                  {tasksByColumn[column.id]?.length || 0}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setQuickAddColumn(column.id)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick Add */}
          <AnimatePresence>
            {quickAddColumn === column.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-2"
              >
                <Input
                  value={quickAddTitle}
                  onChange={(e) => setQuickAddTitle(e.target.value)}
                  placeholder="כותרת המשימה..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleQuickAdd(column.id);
                    if (e.key === "Escape") {
                      setQuickAddColumn(null);
                      setQuickAddTitle("");
                    }
                  }}
                  className="mb-2"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleQuickAdd(column.id)}
                    disabled={!quickAddTitle.trim()}
                    className="flex-1"
                  >
                    הוסף
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setQuickAddColumn(null);
                      setQuickAddTitle("");
                    }}
                  >
                    ביטול
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tasks */}
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-2">
              <AnimatePresence>
                {tasksByColumn[column.id]?.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "group cursor-grab active:cursor-grabbing",
                      draggedTask === task.id && "opacity-50"
                    )}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="font-medium text-sm line-clamp-2">{task.title}</span>
                          </div>
                        </div>

                        {/* Project Badge */}
                        {task.projects && (
                          <Badge
                            variant="outline"
                            className="mb-2 text-xs"
                            style={{
                              borderColor: task.projects.color,
                              color: task.projects.color,
                            }}
                          >
                            {task.projects.name}
                          </Badge>
                        )}

                        {/* Meta */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {task.priority && (
                            <Badge className={cn("text-xs", priorityConfig[task.priority]?.color)}>
                              {priorityConfig[task.priority]?.label}
                            </Badge>
                          )}
                          {task.due_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{format(new Date(task.due_date), "d MMM", { locale: he })}</span>
                            </div>
                          )}
                          {task.assignee && (
                            <Avatar className="h-5 w-5" title={getAssigneeName(task.assignee) || ''}>
                              <AvatarFallback className="text-[10px] bg-primary/10">
                                {(getAssigneeName(task.assignee) || '??').substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  );
}