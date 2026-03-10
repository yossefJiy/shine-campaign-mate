import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ShieldCheck, User, Clock } from "lucide-react";
import { TaskFormData } from "@/hooks/useTaskForm";

interface TaskCompletionSectionProps {
  formData: TaskFormData;
  updateField: <K extends keyof TaskFormData>(field: K, value: TaskFormData[K]) => void;
  taskId: string | null;
  isCompleted: boolean;
}

export function TaskCompletionSection({ formData, updateField, taskId, isCompleted }: TaskCompletionSectionProps) {
  // Fetch completed_by user name
  const { data: completedByName } = useQuery({
    queryKey: ["team-member-name", taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const { data } = await supabase
        .from("tasks")
        .select("completed_by, completed_at")
        .eq("id", taskId)
        .single();
      if (!data?.completed_by) return null;
      const { data: teamData } = await supabase
        .from("team")
        .select("name")
        .eq("user_id", data.completed_by)
        .single();
      return { name: teamData?.name || "לא ידוע", at: data.completed_at };
    },
    enabled: !!taskId && isCompleted,
  });

  return (
    <div className="space-y-4">
      {/* Completion info for completed tasks */}
      {isCompleted && completedByName && (
        <div className="p-3 rounded-lg bg-success/10 border border-success/20 space-y-2">
          <div className="flex items-center gap-2 text-success text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            הושלמה
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {completedByName.name}
            </span>
            {completedByName.at && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(completedByName.at).toLocaleString("he-IL")}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Ready for QA toggle */}
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-sm">
          <ShieldCheck className="w-4 h-4 text-muted-foreground" />
          מוכן ל-QA
        </Label>
        <Switch
          checked={formData.readyForQa}
          onCheckedChange={(v) => updateField('readyForQa', v)}
        />
      </div>

      {/* QA Result */}
      {formData.readyForQa && (
        <div className="space-y-2 animate-fade-in">
          <Label className="text-sm">תוצאת QA</Label>
          <Textarea
            placeholder="תיעוד תוצאת הבדיקה..."
            value={formData.qaResult}
            onChange={(e) => updateField('qaResult', e.target.value)}
            rows={2}
          />
        </div>
      )}

      {/* Completion proof */}
      <div className="space-y-2">
        <Label className="text-sm">הוכחת ביצוע (קישור / תיאור)</Label>
        <Input
          placeholder="קישור לתוצר / צילום מסך / הוכחה"
          value={formData.completionProof}
          onChange={(e) => updateField('completionProof', e.target.value)}
        />
      </div>

      {/* Completion notes */}
      <div className="space-y-2">
        <Label className="text-sm">הערות סיום</Label>
        <Textarea
          placeholder="סיכום / הערות סופיות..."
          value={formData.completionNotes}
          onChange={(e) => updateField('completionNotes', e.target.value)}
          rows={2}
        />
      </div>
    </div>
  );
}
