import { useState } from "react";
import { useProjectStages, type ProjectStage } from "@/hooks/useProjectStages";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Dialog,
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Layers, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  UserCheck,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StageStatus } from "@/hooks/useProjectStages";

const statusConfig: Record<StageStatus, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: "ממתין", icon: <Clock className="h-3 w-3" />, color: "text-muted-foreground" },
  in_progress: { label: "בעבודה", icon: <Clock className="h-3 w-3" />, color: "text-blue-500" },
  waiting_client: { label: "ממתין ללקוח", icon: <AlertCircle className="h-3 w-3" />, color: "text-amber-500" },
  approved: { label: "אושר", icon: <UserCheck className="h-3 w-3" />, color: "text-green-500" },
  completed: { label: "הושלם", icon: <CheckCircle2 className="h-3 w-3" />, color: "text-emerald-500" },
};

interface Props {
  projectId: string;
  projectName?: string;
  compact?: boolean;
}

export function ProjectStagesPanel({ projectId, projectName, compact = false }: Props) {
  const { stages, isLoading, createStage, progressPercent, completedCount, totalCount } = useProjectStages(projectId);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [newStageDescription, setNewStageDescription] = useState("");

  const handleAddStage = () => {
    if (!newStageName.trim()) return;
    createStage.mutate({
      project_id: projectId,
      name: newStageName,
      description: newStageDescription || undefined,
    });
    setNewStageName("");
    setNewStageDescription("");
    setShowAddDialog(false);
  };

  if (isLoading) {
    return <div className="animate-pulse h-12 bg-muted rounded" />;
  }

  if (compact && stages.length === 0) {
    return null;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <button 
        className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">שלבים</span>
          <Badge variant="secondary" className="text-xs">
            {completedCount}/{totalCount}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={progressPercent} className="h-1.5 w-16" />
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-3 space-y-2">
          {stages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              אין שלבים עדיין
            </p>
          ) : (
            stages.map((stage, index) => {
              const status = statusConfig[stage.status];
              return (
                <div 
                  key={stage.id}
                  className="flex items-center gap-2 p-2 rounded hover:bg-muted/50"
                >
                  <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                  <div className={cn("w-2 h-2 rounded-full", status.color.replace("text-", "bg-"))} />
                  <span className="flex-1 text-sm truncate">{stage.name}</span>
                  <span className={cn("text-xs flex items-center gap-1", status.color)}>
                    {status.icon}
                    {status.label}
                  </span>
                </div>
              );
            })
          )}

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full mt-2">
                <Plus className="h-3 w-3 ml-1" />
                הוסף שלב
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>הוספת שלב חדש</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>שם השלב</Label>
                  <Input
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    placeholder="למשל: עיצוב גרפי"
                  />
                </div>
                <div>
                  <Label>תיאור (אופציונלי)</Label>
                  <Textarea
                    value={newStageDescription}
                    onChange={(e) => setNewStageDescription(e.target.value)}
                    placeholder="תיאור קצר..."
                    rows={2}
                  />
                </div>
                <Button onClick={handleAddStage} className="w-full">
                  צור שלב
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
