import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  CheckSquare,
  Circle,
  Clock,
  CheckCircle2,
  Trash2,
  User,
  Tag,
  Calendar,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  assignee: string | null;
  category: string | null;
  client_id: string | null;
}

interface TaskBulkActionsProps {
  selectedTasks: Task[];
  onClearSelection: () => void;
  teamMembers: Array<{ id: string; name: string }>;
  categories: string[];
}

const statusOptions = [
  { value: "pending", label: "ממתין", icon: Circle, color: "text-warning" },
  { value: "in-progress", label: "בתהליך", icon: Clock, color: "text-info" },
  { value: "completed", label: "הושלם", icon: CheckCircle2, color: "text-success" },
];

const priorityOptions = [
  { value: "low", label: "נמוכה" },
  { value: "medium", label: "בינונית" },
  { value: "high", label: "גבוהה" },
];

export function TaskBulkActions({
  selectedTasks,
  onClearSelection,
  teamMembers,
  categories,
}: TaskBulkActionsProps) {
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Task>) => {
      const ids = selectedTasks.map(t => t.id);
      const { error } = await supabase
        .from("tasks")
        .update(updates)
        .in("id", ids);
      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(`${count} משימות עודכנו`);
      onClearSelection();
    },
    onError: () => toast.error("שגיאה בעדכון משימות"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const ids = selectedTasks.map(t => t.id);
      const { error } = await supabase
        .from("tasks")
        .delete()
        .in("id", ids);
      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(`${count} משימות נמחקו`);
      onClearSelection();
      setDeleteDialogOpen(false);
    },
    onError: () => toast.error("שגיאה במחיקת משימות"),
  });

  if (selectedTasks.length === 0) return null;

  return (
    <>
      <div 
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-xl shadow-lg p-3 flex items-center gap-3"
        dir="rtl"
      >
        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <CheckSquare className="w-4 h-4 text-primary" />
          <Badge variant="secondary">{selectedTasks.length} נבחרו</Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClearSelection}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Status */}
        <Select
          onValueChange={(status) => updateMutation.mutate({ status })}
          disabled={updateMutation.isPending}
        >
          <SelectTrigger className="w-[120px] h-9">
            <div className="flex items-center gap-2">
              <Circle className="w-3.5 h-3.5" />
              <span className="text-sm">סטטוס</span>
            </div>
          </SelectTrigger>
          <SelectContent dir="rtl">
            {statusOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex items-center gap-2">
                    <Icon className={cn("w-4 h-4", opt.color)} />
                    {opt.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* Priority */}
        <Select
          onValueChange={(priority) => updateMutation.mutate({ priority })}
          disabled={updateMutation.isPending}
        >
          <SelectTrigger className="w-[110px] h-9">
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5" />
              <span className="text-sm">עדיפות</span>
            </div>
          </SelectTrigger>
          <SelectContent dir="rtl">
            {priorityOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Assignee */}
        <Select
          onValueChange={(assignee) => updateMutation.mutate({ assignee: assignee === "none" ? null : assignee })}
          disabled={updateMutation.isPending}
        >
          <SelectTrigger className="w-[110px] h-9">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5" />
              <span className="text-sm">אחראי</span>
            </div>
          </SelectTrigger>
          <SelectContent dir="rtl">
            <SelectItem value="none">ללא</SelectItem>
            {teamMembers.map((m) => (
              <SelectItem key={m.id} value={m.name}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category */}
        <Select
          onValueChange={(category) => updateMutation.mutate({ category: category === "none" ? null : category })}
          disabled={updateMutation.isPending}
        >
          <SelectTrigger className="w-[110px] h-9">
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5" />
              <span className="text-sm">קטגוריה</span>
            </div>
          </SelectTrigger>
          <SelectContent dir="rtl">
            <SelectItem value="none">ללא</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Delete */}
        <Button
          variant="destructive"
          size="sm"
          className="gap-1"
          onClick={() => setDeleteDialogOpen(true)}
          disabled={updateMutation.isPending || deleteMutation.isPending}
        >
          <Trash2 className="w-4 h-4" />
          מחק
        </Button>

        {(updateMutation.isPending || deleteMutation.isPending) && (
          <Loader2 className="w-4 h-4 animate-spin" />
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת {selectedTasks.length} משימות</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את כל המשימות הנבחרות? פעולה זו לא ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              מחק הכל
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
