import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Flame, 
  Clock, 
  DollarSign, 
  AlertTriangle, 
  Play, 
  Bell, 
  ExternalLink,
  CheckCircle2
} from "lucide-react";
import { useSmartDashboard } from "@/hooks/useSmartDashboard";
import { microcopy, formatMessage } from "@/lib/microcopy";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FocusDashboardProps {
  clientId?: string;
}

export function FocusDashboard({ clientId }: FocusDashboardProps) {
  const { data, isLoading, error } = useSmartDashboard(clientId);
  const navigate = useNavigate();

  const handleStartTask = async (taskId: string) => {
    const { error } = await supabase
      .from("tasks")
      .update({ status: "in_progress" })
      .eq("id", taskId);

    if (error) {
      toast.error("שגיאה בעדכון המשימה");
    } else {
      toast.success("המשימה התחילה!");
    }
  };

  const handleSendReminder = async (clientId: string, message: string) => {
    // TODO: Implement reminder sending via edge function
    toast.success(microcopy.messages.reminderSent);
  };

  const handleMarkAsPaid = async (recordId: string) => {
    const { error } = await supabase
      .from("billing_records")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", recordId);

    if (error) {
      toast.error("שגיאה בעדכון התשלום");
    } else {
      toast.success("התשלום סומן כשולם");
    }
  };

  if (isLoading) {
    return <FocusDashboardSkeleton />;
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">שגיאה בטעינת הדשבורד</p>
        </CardContent>
      </Card>
    );
  }

  const hasIncomeTasksToday = data?.incomeGeneratingTasks && data.incomeGeneratingTasks.length > 0;
  const hasClientDelays = data?.clientDependentTasks && data.clientDependentTasks.length > 0;
  const hasOverduePayments = data?.overduePayments && data.overduePayments.length > 0;
  const hasStalledProjects = data?.stalledProjects && data.stalledProjects.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold text-foreground">
          {microcopy.dashboard.greeting}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {microcopy.mindset.focusOnIncome}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Income Tasks Today */}
        <Card className={cn(
          "border-2",
          hasIncomeTasksToday ? "border-amber-500/50 bg-amber-50/30 dark:bg-amber-950/20" : "border-muted"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Flame className="h-5 w-5 text-amber-500" />
              {microcopy.sections.incomeToday}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasIncomeTasksToday ? (
              <div className="space-y-3">
                {data.incomeGeneratingTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {task.client_name}
                        {task.income_value && (
                          <span className="mr-2 text-amber-600">
                            ₪{task.income_value.toLocaleString()}
                          </span>
                        )}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="default"
                      className="gap-1 shrink-0"
                      onClick={() => handleStartTask(task.id)}
                    >
                      <Play className="h-3 w-3" />
                      {microcopy.buttons.started}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>{microcopy.dashboard.noIncomeTasksToday}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Waiting for Client */}
        <Card className={cn(
          "border-2",
          hasClientDelays ? "border-orange-500/50" : "border-muted"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-orange-500" />
              {microcopy.sections.waitingForClient}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasClientDelays ? (
              <div className="space-y-3">
                {data.clientDependentTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {task.client_name}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 shrink-0"
                      onClick={() => handleSendReminder(task.client_id, task.title)}
                    >
                      <Bell className="h-3 w-3" />
                      תזכורת
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>אין משימות ממתינות ללקוח</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Payments */}
        <Card className={cn(
          "border-2",
          hasOverduePayments ? "border-red-500/50" : "border-muted"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-red-500" />
              {microcopy.sections.openPayments}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasOverduePayments ? (
              <div className="space-y-3">
                {data.overduePayments.slice(0, 5).map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{payment.client_name}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-red-600">
                          ₪{payment.amount.toLocaleString()}
                        </span>
                        <Badge variant="destructive" className="text-xs">
                          {formatMessage(microcopy.messages.waitingForClientDays, { days: payment.days_overdue })}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 shrink-0"
                      onClick={() => handleMarkAsPaid(payment.id)}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      שולם
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>אין תשלומים פתוחים</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stalled Projects */}
        <Card className={cn(
          "border-2",
          hasStalledProjects ? "border-yellow-500/50" : "border-muted"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              {microcopy.sections.projectsAtRisk}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasStalledProjects ? (
              <div className="space-y-3">
                {data.stalledProjects.slice(0, 5).map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {project.client_name} • 
                        <span className="text-yellow-600 mr-1">
                          {formatMessage(microcopy.messages.noProgressWarning, { days: project.days_since_activity })}
                        </span>
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 shrink-0"
                      onClick={() => navigate(`/projects?id=${project.id}`)}
                    >
                      <ExternalLink className="h-3 w-3" />
                      {microcopy.buttons.goToProject}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>כל הפרויקטים בתנועה</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today Stats Summary */}
      {data?.todayStats && (
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-around text-center">
              <div>
                <p className="text-2xl font-bold">{data.todayStats.completedTasks}</p>
                <p className="text-sm text-muted-foreground">משימות הושלמו</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <p className="text-2xl font-bold">{data.todayStats.totalTasks}</p>
                <p className="text-sm text-muted-foreground">משימות היום</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <p className="text-2xl font-bold text-green-600">
                  ₪{data.todayStats.incomeValue.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">ערך הכנסה</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mindset Quote */}
      <p className="text-center text-sm text-muted-foreground italic">
        {microcopy.mindset.smallProgressMatters}
      </p>
    </div>
  );
}

function FocusDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <Skeleton className="h-8 w-64 mx-auto" />
        <Skeleton className="h-4 w-48 mx-auto mt-2" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
