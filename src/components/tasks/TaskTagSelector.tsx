import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Cog, Clock } from "lucide-react";
import type { TaskTag } from "@/types/domains/tasks";

const taskTagConfig: Record<TaskTag, { label: string; icon: React.ReactNode; color: string }> = {
  income_generating: { 
    label: "מניב הכנסה", 
    icon: <TrendingUp className="h-3 w-3" />,
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
  },
  operational: { 
    label: "תפעולי", 
    icon: <Cog className="h-3 w-3" />,
    color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
  },
  client_dependent: { 
    label: "תלוי לקוח", 
    icon: <Clock className="h-3 w-3" />,
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
  },
};

interface Props {
  taskTag: TaskTag;
  incomeValue: string;
  onTagChange: (tag: TaskTag) => void;
  onIncomeValueChange: (value: string) => void;
}

export function TaskTagSelector({ taskTag, incomeValue, onTagChange, onIncomeValueChange }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm text-muted-foreground">סוג משימה</Label>
        <Select value={taskTag} onValueChange={(v) => onTagChange(v as TaskTag)}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(taskTagConfig).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                <div className="flex items-center gap-2">
                  {config.icon}
                  <span>{config.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {taskTag === "income_generating" && (
        <div>
          <Label className="text-sm text-muted-foreground">ערך הכנסה משוער (₪)</Label>
          <Input
            type="number"
            value={incomeValue}
            onChange={(e) => onIncomeValueChange(e.target.value)}
            placeholder="0"
            className="mt-1"
          />
        </div>
      )}
    </div>
  );
}

// Badge component for display in lists
export function TaskTagBadge({ tag }: { tag: TaskTag | null | undefined }) {
  if (!tag) return null;
  const config = taskTagConfig[tag];
  if (!config) return null;
  
  return (
    <Badge variant="secondary" className={config.color}>
      {config.icon}
      <span className="mr-1">{config.label}</span>
    </Badge>
  );
}
