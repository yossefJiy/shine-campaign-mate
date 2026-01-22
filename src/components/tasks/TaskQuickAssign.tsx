import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { User, UserPlus, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface TaskQuickAssignProps {
  taskId: string;
  currentAssignee: string | null;
  assigneeInfo?: { name: string; color: string; initials: string } | null;
  compact?: boolean;
  onUpdate?: () => void;
}

export function TaskQuickAssign({
  taskId,
  currentAssignee,
  assigneeInfo,
  compact = false,
  onUpdate,
}: TaskQuickAssignProps) {
  const queryClient = useQueryClient();

  // Fetch active team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-members-quick"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team")
        .select("id, name, avatar_color")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (assignee: string | null) => {
      const { error } = await supabase
        .from("tasks")
        .update({ assignee })
        .eq("id", taskId);
      if (error) throw error;
    },
    onMutate: async (assignee) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData(["tasks"]);
      
      queryClient.setQueriesData({ queryKey: ["tasks"] }, (old: any) => {
        if (!old) return old;
        return old.map((task: any) => 
          task.id === taskId ? { ...task, assignee } : task
        );
      });
      
      return { previousTasks };
    },
    onError: (err, assignee, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
      toast.error("שגיאה בעדכון שיוך");
    },
    onSuccess: () => {
      toast.success("השיוך עודכן");
      onUpdate?.();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const handleAssign = (memberName: string | null) => {
    updateMutation.mutate(memberName);
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").slice(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {assigneeInfo ? (
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0 rounded-full", compact && "h-7 w-7")}
            style={{ backgroundColor: assigneeInfo.color }}
            title={`משויך ל: ${assigneeInfo.name}`}
          >
            <span className="text-xs font-medium text-white">{assigneeInfo.initials}</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0 rounded-full border-2 border-dashed border-muted-foreground/30 hover:border-primary/50", compact && "h-7 w-7")}
            title="הקצה למישהו"
          >
            <UserPlus className="w-4 h-4 text-muted-foreground" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>הקצה למישהו</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => handleAssign(null)}
          className={cn(!currentAssignee && "bg-muted")}
        >
          <User className="w-4 h-4 ml-2 text-muted-foreground" />
          ללא שיוך
          {!currentAssignee && <Check className="w-4 h-4 mr-auto" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="max-h-60 overflow-y-auto">
          {teamMembers.map((member) => (
            <DropdownMenuItem
              key={member.id}
              onClick={() => handleAssign(member.name)}
              className={cn(currentAssignee === member.name && "bg-muted")}
            >
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white ml-2"
                style={{ backgroundColor: member.avatar_color || 'hsl(var(--primary))' }}
              >
                {getInitials(member.name)}
              </div>
              <span className="flex-1">{member.name}</span>
              {currentAssignee === member.name && <Check className="w-4 h-4 mr-auto" />}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
