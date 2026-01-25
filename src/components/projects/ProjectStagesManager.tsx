import { useState } from "react";
import { useProjectStages, type ProjectStage, type StageStatus } from "@/hooks/useProjectStages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  GripVertical, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  UserCheck,
  MoreHorizontal,
  Trash2,
  Edit,
  Send
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusConfig: Record<StageStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "ממתין", color: "bg-muted text-muted-foreground", icon: <Clock className="h-3 w-3" /> },
  in_progress: { label: "בעבודה", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: <Clock className="h-3 w-3" /> },
  waiting_client: { label: "ממתין ללקוח", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: <AlertCircle className="h-3 w-3" /> },
  approved: { label: "אושר", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: <UserCheck className="h-3 w-3" /> },
  completed: { label: "הושלם", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: <CheckCircle2 className="h-3 w-3" /> },
};

interface Props {
  projectId: string;
  projectName?: string;
}

export function ProjectStagesManager({ projectId, projectName }: Props) {
  const { 
    stages, 
    isLoading, 
    createStage, 
    updateStage, 
    deleteStage, 
    requestClientApproval,
    progressPercent, 
    completedCount, 
    totalCount 
  } = useProjectStages(projectId);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<ProjectStage | null>(null);
  
  const [newStage, setNewStage] = useState({
    name: "",
    description: "",
    estimated_hours: "",
    estimated_cost: "",
    due_date: "",
    requires_client_approval: false,
  });

  const handleCreate = () => {
    if (!newStage.name.trim()) return;
    
    createStage.mutate({
      project_id: projectId,
      name: newStage.name,
      description: newStage.description || undefined,
      estimated_hours: newStage.estimated_hours ? parseFloat(newStage.estimated_hours) : undefined,
      estimated_cost: newStage.estimated_cost ? parseFloat(newStage.estimated_cost) : undefined,
      due_date: newStage.due_date || undefined,
      requires_client_approval: newStage.requires_client_approval,
    });
    
    setNewStage({ name: "", description: "", estimated_hours: "", estimated_cost: "", due_date: "", requires_client_approval: false });
    setIsAddOpen(false);
  };

  const handleStatusChange = (stageId: string, status: StageStatus) => {
    updateStage.mutate({ id: stageId, status });
  };

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">שלבי הפרויקט</CardTitle>
            {projectName && <p className="text-sm text-muted-foreground">{projectName}</p>}
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 ml-1" />
                שלב חדש
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>הוספת שלב חדש</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>שם השלב</Label>
                  <Input 
                    value={newStage.name}
                    onChange={(e) => setNewStage(s => ({ ...s, name: e.target.value }))}
                    placeholder="למשל: עיצוב ראשוני"
                  />
                </div>
                <div>
                  <Label>תיאור</Label>
                  <Textarea 
                    value={newStage.description}
                    onChange={(e) => setNewStage(s => ({ ...s, description: e.target.value }))}
                    placeholder="תיאור קצר של השלב..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>שעות מוערכות</Label>
                    <Input 
                      type="number"
                      value={newStage.estimated_hours}
                      onChange={(e) => setNewStage(s => ({ ...s, estimated_hours: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>עלות מוערכת (₪)</Label>
                    <Input 
                      type="number"
                      value={newStage.estimated_cost}
                      onChange={(e) => setNewStage(s => ({ ...s, estimated_cost: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>תאריך יעד</Label>
                  <Input 
                    type="date"
                    value={newStage.due_date}
                    onChange={(e) => setNewStage(s => ({ ...s, due_date: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="client-approval"
                    checked={newStage.requires_client_approval}
                    onChange={(e) => setNewStage(s => ({ ...s, requires_client_approval: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="client-approval">דורש אישור לקוח</Label>
                </div>
                <Button onClick={handleCreate} className="w-full">
                  צור שלב
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>התקדמות</span>
            <span>{completedCount}/{totalCount} שלבים הושלמו</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {stages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>אין שלבים בפרויקט זה</p>
            <p className="text-sm">לחץ על "שלב חדש" להוספת שלב ראשון</p>
          </div>
        ) : (
          stages.map((stage, index) => (
            <div 
              key={stage.id} 
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              
              <span className="text-sm text-muted-foreground w-6">{index + 1}</span>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{stage.name}</span>
                  {stage.requires_client_approval && (
                    <Badge variant="outline" className="text-xs">דורש אישור</Badge>
                  )}
                </div>
                {stage.description && (
                  <p className="text-sm text-muted-foreground truncate">{stage.description}</p>
                )}
              </div>
              
              <Select 
                value={stage.status} 
                onValueChange={(value) => handleStatusChange(stage.id, value as StageStatus)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        {config.icon}
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditingStage(stage)}>
                    <Edit className="h-4 w-4 ml-2" />
                    ערוך
                  </DropdownMenuItem>
                  {/* Request Client Approval - only show if not already approved/waiting */}
                  {!stage.approved_by_client && stage.status !== 'waiting_client' && (
                    <DropdownMenuItem 
                      onClick={() => requestClientApproval.mutate(stage.id)}
                    >
                      <Send className="h-4 w-4 ml-2" />
                      בקש אישור לקוח
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => deleteStage.mutate(stage.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                    מחק
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
