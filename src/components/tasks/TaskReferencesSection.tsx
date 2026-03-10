import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X, ExternalLink } from "lucide-react";
import { TaskFormData } from "@/hooks/useTaskForm";

interface TaskReferencesSectionProps {
  formData: TaskFormData;
  updateField: <K extends keyof TaskFormData>(field: K, value: TaskFormData[K]) => void;
}

export function TaskReferencesSection({ formData, updateField }: TaskReferencesSectionProps) {
  const [newLink, setNewLink] = useState("");

  const addLink = () => {
    if (!newLink.trim()) return;
    updateField('referenceLinks', [...formData.referenceLinks, newLink.trim()]);
    setNewLink("");
  };

  const removeLink = (index: number) => {
    updateField('referenceLinks', formData.referenceLinks.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Expected Result */}
      <div className="space-y-2">
        <Label className="text-sm">תוצאה מצופה</Label>
        <Textarea
          placeholder="מה התוצאה הצפויה מהמשימה הזו?"
          value={formData.expectedResult}
          onChange={(e) => updateField('expectedResult', e.target.value)}
          rows={2}
        />
      </div>

      {/* Reference Links */}
      <div className="space-y-2">
        <Label className="text-sm">קישורי ייחוס</Label>
        {formData.referenceLinks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.referenceLinks.map((link, idx) => (
              <Badge key={idx} variant="secondary" className="gap-1 max-w-[200px]">
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-xs hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {(() => {
                    try { return new URL(link).hostname; } catch { return link.slice(0, 30); }
                  })()}
                </a>
                <button onClick={() => removeLink(idx)} className="hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            placeholder="הדבק קישור..."
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
            className="flex-1"
          />
          <Button type="button" size="sm" variant="outline" onClick={addLink} disabled={!newLink.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
