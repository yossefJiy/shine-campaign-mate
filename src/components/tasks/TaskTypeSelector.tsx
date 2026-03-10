import { Code2, Paintbrush, Bug, Search, FileText, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TaskType } from "@/hooks/useTaskForm";

const taskTypeOptions: { value: TaskType; label: string; icon: typeof Code2 }[] = [
  { value: "development", label: "פיתוח", icon: Code2 },
  { value: "design", label: "עיצוב", icon: Paintbrush },
  { value: "qa", label: "QA", icon: Bug },
  { value: "seo", label: "SEO", icon: Search },
  { value: "content", label: "תוכן", icon: FileText },
  { value: "operations", label: "תפעול", icon: Settings },
];

interface TaskTypeSelectorProps {
  value: TaskType;
  onChange: (value: TaskType) => void;
  compact?: boolean;
}

export function TaskTypeSelector({ value, onChange, compact = false }: TaskTypeSelectorProps) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {taskTypeOptions.map((opt) => {
          const Icon = opt.icon;
          const isSelected = value === opt.value;
          return (
            <Button
              key={opt.value}
              type="button"
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onChange(opt.value)}
              className={cn("gap-1.5 h-7 text-xs", !isSelected && "text-muted-foreground")}
            >
              <Icon className="w-3 h-3" />
              {opt.label}
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {taskTypeOptions.map((opt) => {
        const Icon = opt.icon;
        const isSelected = value === opt.value;
        return (
          <Button
            key={opt.value}
            type="button"
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(opt.value)}
            className={cn("gap-2", !isSelected && "text-muted-foreground")}
          >
            <Icon className="w-4 h-4" />
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}

export function getTaskTypeConfig(taskType: string) {
  return taskTypeOptions.find(t => t.value === taskType) || taskTypeOptions[5];
}

export { taskTypeOptions };
