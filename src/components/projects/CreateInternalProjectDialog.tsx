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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Building2, Loader2, AlertTriangle, Wrench } from "lucide-react";

interface CreateInternalProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: any[];
  effectiveClient: any;
}

/**
 * Admin-only dialog for creating internal/non-billable projects.
 * These projects:
 * - source = 'internal'
 * - work_state = 'work_ok' (bypass payment rules)
 * - Still follow task/stage rules (last_activity_at, waiting, at_risk)
 * - No linked Proposal or Payment
 */
export function CreateInternalProjectDialog({
  open,
  onOpenChange,
  clients,
  effectiveClient,
}: CreateInternalProjectDialogProps) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    client_id: "",
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const targetClientId = formData.client_id || effectiveClient?.id;
      
      if (!targetClientId) {
        throw new Error("יש לבחור לקוח");
      }

      const payload = {
        name: formData.name,
        description: formData.description || null,
        client_id: targetClientId,
        source: "internal", // Mark as internal project
        status: "active",
        work_state: "work_ok", // Bypass payment blocking
        last_activity_at: new Date().toISOString(),
      };

      const { data: project, error } = await supabase
        .from("projects")
        .insert(payload)
        .select()
        .single();
      
      if (error) throw error;
      return project;
    },
    onSuccess: (project) => {
      toast.success("פרויקט פנימי נוצר", {
        description: `"${project.name}" נוסף בהצלחה`,
      });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error("שגיאה: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      client_id: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            פרויקט פנימי
          </DialogTitle>
          <DialogDescription>
            פרויקט ללא הצעת מחיר - לעבודה פנימית או ניסויים
          </DialogDescription>
        </DialogHeader>

        <Alert className="bg-warning/10 border-warning/30">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-xs">
            פרויקט פנימי לא מחובר להצעת מחיר או תשלום. 
            השתמש באפשרות זו רק לעבודה פנימית, בדיקות, או לקוחות קיימים ללא הסכם רשמי.
          </AlertDescription>
        </Alert>
        
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <Label>שם הפרויקט *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="לדוגמה: בדיקת פיצ'ר חדש"
              required
            />
          </div>

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
              שיוך ללקוח
            </Label>
            <Select 
              value={formData.client_id || effectiveClient?.id || ""} 
              onValueChange={(v) => setFormData({ ...formData, client_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר לקוח" />
              </SelectTrigger>
              <SelectContent>
                {clients.filter(c => c.is_master_account).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} (סוכנות)
                  </SelectItem>
                ))}
                {clients.filter(c => !c.is_master_account).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              disabled={saveMutation.isPending || !formData.name.trim()}
              className="flex-1"
            >
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              צור פרויקט פנימי
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
