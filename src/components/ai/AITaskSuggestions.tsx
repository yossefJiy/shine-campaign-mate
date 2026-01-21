import { useState } from "react";
import { Sparkles, Clock, User, Flag, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface TaskSuggestion {
  priority: "low" | "medium" | "high";
  estimatedTime: number; // in minutes
  suggestedAssignee?: string;
  reasoning: string;
}

interface AITaskSuggestionsProps {
  taskTitle: string;
  taskDescription?: string;
  onApplySuggestion?: (suggestion: Partial<TaskSuggestion>) => void;
  className?: string;
}

const priorityLabels: Record<string, { label: string; color: string }> = {
  low: { label: "נמוכה", color: "bg-muted text-muted-foreground" },
  medium: { label: "בינונית", color: "bg-warning/20 text-warning" },
  high: { label: "גבוהה", color: "bg-destructive/20 text-destructive" },
};

export function AITaskSuggestions({ 
  taskTitle, 
  taskDescription, 
  onApplySuggestion,
  className 
}: AITaskSuggestionsProps) {
  const [suggestion, setSuggestion] = useState<TaskSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const getSuggestions = async () => {
    if (!taskTitle || taskTitle.length < 3) return;
    
    setIsLoading(true);
    setIsVisible(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-task-analyzer", {
        body: {
          title: taskTitle,
          description: taskDescription,
          action: "suggest",
        },
      });

      if (error) throw error;

      setSuggestion(data?.suggestion || getLocalSuggestion(taskTitle));
    } catch (error) {
      console.error("AI suggestion error:", error);
      // Fallback to local analysis
      setSuggestion(getLocalSuggestion(taskTitle));
    } finally {
      setIsLoading(false);
    }
  };

  const getLocalSuggestion = (title: string): TaskSuggestion => {
    const t = title.toLowerCase();
    
    // Priority detection
    let priority: "low" | "medium" | "high" = "medium";
    if (t.includes("דחוף") || t.includes("חשוב") || t.includes("קריטי") || t.includes("asap")) {
      priority = "high";
    } else if (t.includes("בדיקה") || t.includes("סקירה") || t.includes("תיעוד")) {
      priority = "low";
    }

    // Time estimation
    let estimatedTime = 60;
    if (t.includes("פגישה") || t.includes("שיחה")) {
      estimatedTime = 30;
    } else if (t.includes("פיתוח") || t.includes("בנייה") || t.includes("יצירה")) {
      estimatedTime = 120;
    } else if (t.includes("בדיקה") || t.includes("עדכון")) {
      estimatedTime = 30;
    }

    return {
      priority,
      estimatedTime,
      reasoning: "הערכה מבוססת על ניתוח הכותרת וסוג המשימה",
    };
  };

  const applyPriority = () => {
    if (suggestion && onApplySuggestion) {
      onApplySuggestion({ priority: suggestion.priority });
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} דק'`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}:${mins.toString().padStart(2, '0')} שעות` : `${hours} שעות`;
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={getSuggestions}
        disabled={isLoading || !taskTitle || taskTitle.length < 3}
        className="gap-2 text-primary hover:text-primary"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        הצע עדיפות וזמן
      </Button>

      <AnimatePresence>
        {isVisible && suggestion && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 p-3 bg-background border border-border rounded-lg shadow-lg z-10"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">הצעות AI</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsVisible(false)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>

            <div className="space-y-2">
              {/* Priority */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">עדיפות מומלצת:</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={priorityLabels[suggestion.priority]?.color}>
                    {priorityLabels[suggestion.priority]?.label}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={applyPriority}
                  >
                    <Check className="w-3 h-3 text-success" />
                  </Button>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">זמן משוער:</span>
                </div>
                <Badge variant="outline">
                  {formatTime(suggestion.estimatedTime)}
                </Badge>
              </div>

              {/* Assignee */}
              {suggestion.suggestedAssignee && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">הקצאה מומלצת:</span>
                  </div>
                  <Badge variant="outline">
                    {suggestion.suggestedAssignee}
                  </Badge>
                </div>
              )}
            </div>

            {suggestion.reasoning && (
              <p className="mt-2 text-xs text-muted-foreground border-t border-border pt-2">
                {suggestion.reasoning}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}