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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, Loader2 } from "lucide-react";
import { StyledDatePicker } from "@/components/ui/styled-date-picker";
import { useProjectTemplates } from "@/hooks/useProjectTemplates";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: any[];
  effectiveClient: any;
  isAgencyView: boolean;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  clients,
  effectiveClient,
  isAgencyView,
}: CreateProjectDialogProps) {
  const queryClient = useQueryClient();
  const { data: templates = [] } = useProjectTemplates();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active",
    template_type: "",
    start_date: "",
    target_date: "",
    client_id: "",
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const targetClientId = formData.client_id || effectiveClient?.id;
      
      if (!targetClientId) {
        throw new Error("יש לבחור לקוח לפני יצירת פרויקט");
      }

      const payload = {
        name: formData.name,
        description: formData.description || null,
        status: formData.status,
        template_type: formData.template_type || null,
        start_date: formData.start_date || null,
        target_date: formData.target_date || null,
        client_id: targetClientId,
        last_activity_at: new Date().toISOString(),
      };

      const { data: project, error } = await supabase
        .from("projects")
        .insert(payload)
        .select()
        .single();
      
      if (error) throw error;

      // If template is selected, create stages from template
      if (formData.template_type && templates.length > 0) {
        const template = templates.find(t => t.name === formData.template_type);
        if (template?.stages && Array.isArray(template.stages)) {
          for (let i = 0; i < template.stages.length; i++) {
            const stageConfig = template.stages[i];
            await supabase.from("project_stages").insert({
              project_id: project.id,
              name: stageConfig.name,
              description: null,
              sort_order: stageConfig.order || i,
              status: "pending",
              requires_client_approval: stageConfig.requires_approval || false,
            });
          }
        }
      }

      return project;
    },
    onSuccess: () => {
      toast.success("הפרויקט נוצר בהצלחה");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      if (error.message.includes("יש לבחור לקוח")) {
        toast.error("יש לבחור לקוח לפני יצירת פרויקט");
      } else {
        toast.error("שגיאה ביצירת הפרויקט");
      }
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      status: "active",
      template_type: "",
      start_date: "",
      target_date: "",
      client_id: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>פרויקט חדש</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <Label>שם הפרויקט *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="לדוגמה: קמפיין ממומן - Meta"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>תיאור</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="תיאור קצר של הפרויקט"
              rows={2}
            />
          </div>

          {/* Client Selection */}
          {isAgencyView && clients.length > 0 && (
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
          )}

          {/* Template Selection */}
          <div className="space-y-2">
            <Label>תבנית פרויקט</Label>
            <Select 
              value={formData.template_type} 
              onValueChange={(v) => setFormData({ ...formData, template_type: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר תבנית (אופציונלי)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">ללא תבנית</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.name}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              בחירת תבנית תיצור שלבים ומשימות אוטומטית
            </p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>תאריך התחלה</Label>
              <StyledDatePicker
                value={formData.start_date ? new Date(formData.start_date) : undefined}
                onChange={(date) => setFormData({ 
                  ...formData, 
                  start_date: date ? date.toISOString().split('T')[0] : "" 
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>תאריך יעד</Label>
              <StyledDatePicker
                value={formData.target_date ? new Date(formData.target_date) : undefined}
                onChange={(date) => setFormData({ 
                  ...formData, 
                  target_date: date ? date.toISOString().split('T')[0] : "" 
                })}
              />
            </div>
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
              disabled={saveMutation.isPending || !formData.name}
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
