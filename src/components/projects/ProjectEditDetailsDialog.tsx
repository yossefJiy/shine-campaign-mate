import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Pencil, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProjectEditDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: {
    id: string;
    name: string;
    description?: string | null;
    tags?: string[] | null;
    owner_id?: string | null;
  } | null;
}

/**
 * Edit Details Dialog - allows editing only "soft" metadata:
 * ✅ name, description, tags, owner
 * ❌ status, work_state, last_activity_at, payment links (read-only, updated via Rules)
 */
export function ProjectEditDetailsDialog({
  open,
  onOpenChange,
  project,
}: ProjectEditDetailsDialogProps) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  // Reset form when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || "",
        description: project.description || "",
      });
    }
  }, [project]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!project?.id) throw new Error("No project selected");
      
      // Only update allowed metadata fields
      const { error } = await supabase
        .from("projects")
        .update({
          name: formData.name,
          description: formData.description || null,
          // Note: updated_at is updated but NOT last_activity_at (that's State)
          updated_at: new Date().toISOString(),
        })
        .eq("id", project.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("פרטי הפרויקט עודכנו");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-full-detail", project?.id] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("שגיאה בעדכון: " + error.message);
    },
  });

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            עריכת פרטי פרויקט
          </DialogTitle>
        </DialogHeader>
        
        <Alert className="bg-muted/50 border-muted">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            ניתן לערוך רק פרטים כלליים. סטטוס ומצב עבודה משתנים אוטומטית לפי חוקי המערכת.
          </AlertDescription>
        </Alert>
        
        <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <Label>שם הפרויקט *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="שם הפרויקט"
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
              disabled={updateMutation.isPending || !formData.name.trim()}
              className="flex-1"
            >
              {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              שמור שינויים
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
