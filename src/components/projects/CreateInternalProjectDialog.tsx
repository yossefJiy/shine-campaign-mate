import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, Loader2, Plus, X, GripVertical } from "lucide-react";

interface StageInput {
  name: string;
  description: string;
}

interface CreateInternalProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: any[];
  effectiveClient: any;
  onProjectCreated?: (project: { id: string; client_id: string }) => void;
}

/**
 * Admin-only dialog for creating manual retainer / internal projects.
 * These projects bypass the Proposal flow and start as active/work_ok.
 */
export function CreateInternalProjectDialog({
  open,
  onOpenChange,
  clients,
  effectiveClient,
  onProjectCreated,
}: CreateInternalProjectDialogProps) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    client_id: "",
    source: "manual_retainer" as "manual_retainer" | "internal",
  });

  const [stages, setStages] = useState<StageInput[]>([]);
  const [newStageName, setNewStageName] = useState("");

  const addStage = () => {
    const trimmed = newStageName.trim();
    if (!trimmed) return;
    setStages((prev) => [...prev, { name: trimmed, description: "" }]);
    setNewStageName("");
  };

  const removeStage = (index: number) => {
    setStages((prev) => prev.filter((_, i) => i !== index));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const targetClientId = formData.client_id || effectiveClient?.id;
      if (!targetClientId) throw new Error("יש לבחור לקוח");

      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          name: formData.name,
          description: formData.description || null,
          client_id: targetClientId,
          source: formData.source,
          billing_mode: formData.source === "manual_retainer" ? "covered_by_retainer" : "none",
          status: "active",
          work_state: "work_ok",
          proposal_id: null,
          last_activity_at: new Date().toISOString(),
        } as any)
        .select()
        .single();

      if (error) throw error;

      if (stages.length > 0) {
        const stageRows = stages.map((s, i) => ({
          project_id: project.id,
          name: s.name,
          description: s.description || null,
          sort_order: i,
          status: "pending",
          requires_client_approval: false,
        }));

        const { error: stageError } = await supabase
          .from("project_stages")
          .insert(stageRows);

        if (stageError) throw stageError;
      }

      return project;
    },
    onSuccess: (project) => {
      const label = formData.source === "manual_retainer" ? "פרויקט ריטיינר" : "פרויקט פנימי";
      toast.success(`${label} נוצר`, {
        description: `"${project.name}" — ${stages.length} שלבים`,
      });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onProjectCreated?.({ id: project.id, client_id: project.client_id });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error("שגיאה: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", client_id: "", source: "manual_retainer" });
    setStages([]);
    setNewStageName("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetForm();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>פרויקט ידני</DialogTitle>
          <DialogDescription>
            יצירת פרויקט ללא הצעת מחיר — לעבודה שוטפת עם לקוחות קיימים
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-4"
        >
          {/* Source type */}
          <div className="space-y-2">
            <Label>סוג פרויקט</Label>
            <Select
              value={formData.source}
              onValueChange={(v) =>
                setFormData({ ...formData, source: v as "manual_retainer" | "internal" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual_retainer">ריטיינר / עבודה שוטפת</SelectItem>
                <SelectItem value="internal">פנימי / בדיקות</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label>שם הפרויקט *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="לדוגמה: Ras El Hanut — אתר חדש"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>תיאור</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="תיאור קצר..."
              rows={2}
            />
          </div>

          {/* Client Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              לקוח
            </Label>
            <Select
              value={formData.client_id || effectiveClient?.id || ""}
              onValueChange={(v) => setFormData({ ...formData, client_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר לקוח" />
              </SelectTrigger>
              <SelectContent>
                {clients
                  .filter((c) => c.is_master_account)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} (סוכנות)
                    </SelectItem>
                  ))}
                {clients
                  .filter((c) => !c.is_master_account)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stages inline builder */}
          <div className="space-y-2">
            <Label>שלבים</Label>
            {stages.length > 0 && (
              <div className="space-y-1.5 rounded-lg border p-2 bg-muted/30">
                {stages.map((stage, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm bg-background rounded px-2 py-1.5"
                  >
                    <GripVertical className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground text-xs">{i + 1}.</span>
                    <span className="flex-1 truncate">{stage.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => removeStage(i)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                placeholder="שם השלב..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addStage();
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={addStage}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              הוסף שלבים עכשיו או אחרי יצירת הפרויקט
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              ביטול
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending || !formData.name.trim()}
              className="flex-1"
            >
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              צור פרויקט
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
