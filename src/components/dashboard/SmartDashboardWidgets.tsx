import { useSmartDashboard } from "@/hooks/useSmartDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  PauseCircle,
  ChevronLeft,
  CheckCircle2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface Props {
  clientId?: string;
}

export function SmartDashboardWidgets({ clientId }: Props) {
  const { data, isLoading } = useSmartDashboard(clientId);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">משימות היום</p>
                <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                  {data.todayStats.completedTasks}/{data.todayStats.totalTasks}
                </p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">משימות בעדיפות עליונה</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {data.topTasks.length}
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 dark:text-amber-400">תשלומים באיחור</p>
                <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                  {data.overduePayments.length}
                </p>
              </div>
              <AlertTriangle className="h-10 w-10 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Priority Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                משימות בעדיפות עליונה
              </CardTitle>
              <Badge variant="secondary">{data.topTasks.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.topTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                אין משימות פתוחות
              </p>
            ) : (
              data.topTasks.map((task) => (
                <div 
                  key={task.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/tasks?task=${task.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{task.title}</p>
                    <p className="text-sm text-muted-foreground">{task.client_name}</p>
                  </div>
                  {task.priority && (
                    <Badge variant="outline" className="text-xs">
                      {task.priority}
                    </Badge>
                  )}
                  <ChevronLeft className="h-4 w-4 text-muted-foreground mr-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Client Delay Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                ממתין ללקוח
              </CardTitle>
              <Badge variant="secondary">{data.clientDelayTasks.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.clientDelayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                אין משימות שממתינות ללקוח
              </p>
            ) : (
              data.clientDelayTasks.slice(0, 5).map((task) => (
                <div 
                  key={task.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/tasks?task=${task.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{task.title}</p>
                    <p className="text-sm text-muted-foreground">{task.client_name}</p>
                  </div>
                  {task.due_date && (
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(task.due_date), { locale: he, addSuffix: true })}
                    </span>
                  )}
                  <ChevronLeft className="h-4 w-4 text-muted-foreground mr-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Overdue Payments */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                תשלומים באיחור
              </CardTitle>
              <Badge variant="destructive">{data.overduePayments.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.overduePayments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                אין תשלומים באיחור 🎉
              </p>
            ) : (
              data.overduePayments.map((payment) => (
                <div 
                  key={payment.id} 
                  className="flex items-center justify-between p-3 border border-red-200 dark:border-red-900/30 rounded-lg bg-red-50/50 dark:bg-red-950/20"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{payment.client_name}</p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {payment.days_overdue} ימים באיחור
                    </p>
                  </div>
                  <Badge variant="destructive">
                    ₪{payment.amount.toLocaleString()}
                  </Badge>
                </div>
              ))
            )}
            {data.overduePayments.length > 0 && (
              <Button 
                variant="outline" 
                className="w-full mt-2"
                onClick={() => navigate("/billing")}
              >
                צפה בכל התשלומים
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Stalled Projects */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <PauseCircle className="h-5 w-5 text-muted-foreground" />
                פרויקטים ללא התקדמות
              </CardTitle>
              <Badge variant="outline">{data.stalledProjects.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.stalledProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                כל הפרויקטים פעילים ✨
              </p>
            ) : (
              data.stalledProjects.slice(0, 5).map((project) => (
                <div 
                  key={project.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/projects?project=${project.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{project.name}</p>
                    <p className="text-sm text-muted-foreground">{project.client_name}</p>
                  </div>
                  <Badge variant="outline">
                    {project.days_since_activity} ימים
                  </Badge>
                  <ChevronLeft className="h-4 w-4 text-muted-foreground mr-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
