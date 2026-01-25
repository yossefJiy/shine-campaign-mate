import { useState } from "react";
import { format, differenceInHours } from "date-fns";
import { 
  Inbox, 
  AlertTriangle, 
  FolderKanban, 
  Clock, 
  User,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { microcopy } from "@/lib/microcopy";
import { toast } from "sonner";

interface InboxTask {
  id: string;
  title: string;
  created_at: string;
  assignee: string | null;
  priority: string;
  client_name?: string;
}

interface Project {
  id: string;
  name: string;
  color: string | null;
}

interface TaskInboxProps {
  tasks: InboxTask[];
  projects: Project[];
  onAssignToProject: (taskId: string, projectId: string) => void;
  isAssigning?: boolean;
}

export function TaskInbox({ tasks, projects, onAssignToProject, isAssigning }: TaskInboxProps) {
  const [selectedProject, setSelectedProject] = useState<Record<string, string>>({});

  if (tasks.length === 0) {
    return null;
  }

  const handleAssign = (taskId: string) => {
    const projectId = selectedProject[taskId];
    if (!projectId) {
      toast.error("בחר פרויקט לפני שיוך");
      return;
    }
    onAssignToProject(taskId, projectId);
  };

  return (
    <Card className="border-warning/50 bg-warning/5 mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-warning" />
            <CardTitle className="text-base">{microcopy.tasks.inboxTitle}</CardTitle>
            <Badge variant="secondary" className="bg-warning/20 text-warning">
              {tasks.length}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {microcopy.tasks.inboxDescription}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.map((task) => {
          const hoursOld = differenceInHours(new Date(), new Date(task.created_at));
          const isUrgent = hoursOld > 20; // Close to 24 hour limit
          
          return (
            <div 
              key={task.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border bg-background",
                isUrgent && "border-destructive/50 bg-destructive/5"
              )}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex flex-col min-w-0">
                  <span className="font-medium truncate">{task.title}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {task.client_name && <span>{task.client_name}</span>}
                    {task.assignee && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {task.assignee}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {hoursOld < 1 ? "פחות משעה" : `לפני ${hoursOld} שעות`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isUrgent && (
                  <Badge variant="destructive" className="text-xs gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    נדרש שיוך
                  </Badge>
                )}
                
                <Select 
                  value={selectedProject[task.id] || ""} 
                  onValueChange={(v) => setSelectedProject(prev => ({ ...prev, [task.id]: v }))}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="בחר פרויקט" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: p.color || 'hsl(var(--primary))' }} 
                          />
                          {p.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button 
                  size="sm" 
                  onClick={() => handleAssign(task.id)}
                  disabled={!selectedProject[task.id] || isAssigning}
                >
                  <FolderKanban className="w-4 h-4 ml-1" />
                  שייך
                </Button>
              </div>
            </div>
          );
        })}

        <p className="text-xs text-muted-foreground text-center pt-2">
          ⚠️ {microcopy.tasks.noProjectWarning}
        </p>
      </CardContent>
    </Card>
  );
}
