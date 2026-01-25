import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, UserCheck } from "lucide-react";
import { StyledDatePicker } from "@/components/ui/styled-date-picker";

interface AddStageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function AddStageDialog({ open, onOpenChange, projectId }: AddStageDialogProps) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    due_date: "",
    requires_client_approval: false,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      // Get current max sort_order
      const { data: existingStages } = await supabase
        .from("project_stages")
        .select("sort_order")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: false })
        .limit(1);
      
      const maxOrder = existingStages?.[0]?.sort_order ?? -1;

      const { error } = await supabase
        .from("project_stages")
        .insert({
          project_id: projectId,
          name: formData.name,
          description: formData.description || null,
          due_date: formData.due_date || null,
          requires_client_approval: formData.requires_client_approval,
          sort_order: maxOrder + 1,
          status: "pending",
        });
      
      if (error) throw error;

      // Update project last_activity_at
      await supabase
        .from("projects")
        .update({ last_activity_at: new Date().toISOString() })
        .eq("id", projectId);
    },
    onSuccess: () => {
      toast.success("השלב נוצר בהצלחה");
      queryClient.invalidateQueries({ queryKey: ["project-stages-with-tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast.error("שגיאה ביצירת השלב");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      due_date: "",
      requires_client_approval: false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>הוספת שלב חדש</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <Label>שם השלב *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="לדוגמה: עיצוב גרפי"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>תיאור</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="תיאור קצר של השלב"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>תאריך יעד</Label>
            <StyledDatePicker
              value={formData.due_date ? new Date(formData.due_date) : undefined}
              onChange={(date) => setFormData({ 
                ...formData, 
                due_date: date ? date.toISOString().split('T')[0] : "" 
              })}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">דורש אישור לקוח</p>
                <p className="text-xs text-muted-foreground">
                  הלקוח יצטרך לאשר שלב זה לפני המשך
                </p>
              </div>
            </div>
            <Switch
              checked={formData.requires_client_approval}
              onCheckedChange={(checked) => setFormData({ 
                ...formData, 
                requires_client_approval: checked 
              })}
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
              disabled={createMutation.isPending || !formData.name}
              className="flex-1"
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              צור שלב
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
