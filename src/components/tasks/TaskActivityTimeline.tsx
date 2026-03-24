import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  ArrowRightLeft,
  UserCheck,
  Paperclip,
  Bell,
  Plus,
  Send,
  Loader2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskActivity {
  id: string;
  task_id: string;
  user_id: string | null;
  activity_type: string;
  content: string | null;
  metadata: any;
  created_at: string;
}

interface TaskActivityTimelineProps {
  taskId: string;
}

const activityConfig: Record<string, { icon: typeof MessageSquare; label: string; color: string }> = {
  comment: { icon: MessageSquare, label: "הערה", color: "text-primary bg-primary/10" },
  status_change: { icon: ArrowRightLeft, label: "שינוי סטטוס", color: "text-warning bg-warning/10" },
  assignment: { icon: UserCheck, label: "שיוך", color: "text-info bg-info/10" },
  attachment: { icon: Paperclip, label: "קובץ", color: "text-success bg-success/10" },
  reminder: { icon: Bell, label: "תזכורת", color: "text-destructive bg-destructive/10" },
  created: { icon: Plus, label: "נוצר", color: "text-muted-foreground bg-muted" },
};

const statusLabels: Record<string, string> = {
  pending: "לא התחיל",
  "in-progress": "בתהליך",
  waiting: "ממתין",
  completed: "הושלם",
  todo: "לביצוע",
  blocked: "חסום",
};

export function TaskActivityTimeline({ taskId }: TaskActivityTimelineProps) {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["task-activity", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_activity")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TaskActivity[];
    },
    enabled: !!taskId,
  });

  // Fetch user profiles for display
  const userIds = [...new Set(activities.map(a => a.user_id).filter(Boolean))];
  const { data: profiles = [] } = useQuery({
    queryKey: ["activity-profiles", userIds.join(",")],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      const { data } = await supabase
        .from("team")
        .select("user_id, name, avatar_color")
        .in("user_id", userIds as string[]);
      return data || [];
    },
    enabled: userIds.length > 0,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("task_activity")
        .insert({
          task_id: taskId,
          user_id: userData.user?.id,
          activity_type: "comment",
          content,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-activity", taskId] });
      setNewComment("");
    },
    onError: () => toast.error("שגיאה בהוספת הערה"),
  });

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment.trim());
  };

  const getUserName = (userId: string | null) => {
    if (!userId) return "מערכת";
    const profile = profiles.find((p: any) => p.user_id === userId);
    return profile?.name || "משתמש";
  };

  const getUserColor = (userId: string | null) => {
    if (!userId) return "#6B7280";
    const profile = profiles.find((p: any) => p.user_id === userId);
    return profile?.avatar_color || "#3B82F6";
  };

  const renderActivityContent = (activity: TaskActivity) => {
    switch (activity.activity_type) {
      case "status_change": {
        const oldStatus = statusLabels[activity.metadata?.old_status] || activity.metadata?.old_status;
        const newStatus = statusLabels[activity.metadata?.new_status] || activity.metadata?.new_status;
        return (
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="text-xs">{oldStatus}</Badge>
            <span className="text-muted-foreground">→</span>
            <Badge variant="secondary" className="text-xs">{newStatus}</Badge>
          </div>
        );
      }
      case "assignment":
        return (
          <p className="text-sm text-muted-foreground">
            שויך ל: <span className="font-medium text-foreground">{activity.metadata?.assignee}</span>
          </p>
        );
      case "comment":
        return (
          <p className="text-sm whitespace-pre-wrap bg-muted/30 rounded-lg p-2.5">
            {activity.content}
          </p>
        );
      default:
        return activity.content ? (
          <p className="text-sm text-muted-foreground">{activity.content}</p>
        ) : null;
    }
  };

  return (
    <div className="space-y-3">
      {/* Comment input */}
      <div className="flex gap-2">
        <Textarea
          placeholder="הוסף הערה..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={2}
          className="flex-1 text-sm resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSubmitComment();
            }
          }}
        />
        <Button
          size="icon"
          onClick={handleSubmitComment}
          disabled={!newComment.trim() || addCommentMutation.isPending}
          className="h-auto self-end"
        >
          {addCommentMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">
          <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
          אין פעילות עדיין
        </div>
      ) : (
        <ScrollArea className="max-h-[350px]">
          <div className="space-y-1">
            {activities.map((activity, idx) => {
              const config = activityConfig[activity.activity_type] || activityConfig.created;
              const Icon = config.icon;
              const isLast = idx === activities.length - 1;

              return (
                <div key={activity.id} className="flex gap-3 relative">
                  {/* Timeline line */}
                  {!isLast && (
                    <div className="absolute right-[15px] top-8 bottom-0 w-px bg-border" />
                  )}

                  {/* Icon */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10",
                    config.color
                  )}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">{getUserName(activity.user_id)}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(activity.created_at), "dd/MM HH:mm")}
                      </span>
                    </div>
                    {renderActivityContent(activity)}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
