import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, subDays } from "date-fns";

export type TaskTag = 'income_generating' | 'operational' | 'client_dependent';

export interface SmartTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  task_tag: TaskTag;
  income_value: number | null;
  assignee: string | null;
  client_id: string;
  client_name?: string;
}

export interface DashboardStats {
  /** Top priority tasks to work on now (any tag) */
  topTasks: SmartTask[];
  /** Tasks in waiting/blocked status (client delays) */
  clientDelayTasks: SmartTask[];
  overduePayments: {
    id: string;
    client_id: string;
    client_name: string;
    amount: number;
    due_date: string;
    days_overdue: number;
  }[];
  stalledProjects: {
    id: string;
    name: string;
    client_name: string;
    days_since_activity: number;
    last_task_update: string | null;
  }[];
  todayStats: {
    totalTasks: number;
    completedTasks: number;
  };
}

// Priority sort order for dashboard display
const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function useSmartDashboard(clientId?: string) {
  const today = startOfDay(new Date()).toISOString();

  return useQuery({
    queryKey: ["smart-dashboard", clientId],
    queryFn: async (): Promise<DashboardStats> => {
      // 1. Top priority non-completed tasks
      //    NOTE: task_tag is currently uniformly 'operational'.
      //    When tags are properly assigned, filter can be refined to prioritize income_generating.
      let topQuery = supabase
        .from("tasks")
        .select(`
          id, title, status, priority, due_date, task_tag, income_value, assignee, client_id,
          clients:clients!tasks_client_id_fkey(name)
        `)
        .not("status", "in", '("completed","cancelled")')
        .not("status", "in", '("waiting","blocked")')
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(5);

      if (clientId) {
        topQuery = topQuery.eq("client_id", clientId);
      }

      const { data: topTasksRaw } = await topQuery;

      // Sort by priority in JS since DB doesn't know priority ordering
      const sortedTopTasks = (topTasksRaw || []).sort((a: any, b: any) => {
        const aPri = PRIORITY_ORDER[a.priority] ?? 99;
        const bPri = PRIORITY_ORDER[b.priority] ?? 99;
        return aPri - bPri;
      });

      // 2. Client delay tasks (waiting/blocked status)
      let delayQuery = supabase
        .from("tasks")
        .select(`
          id, title, status, priority, due_date, task_tag, income_value, assignee, client_id,
          clients:clients!tasks_client_id_fkey(name)
        `)
        .in("status", ["waiting", "blocked"])
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(10);

      if (clientId) {
        delayQuery = delayQuery.eq("client_id", clientId);
      }

      const { data: delayTasksRaw } = await delayQuery;

      // 3. Overdue payments
      let paymentsQuery = supabase
        .from("billing_records")
        .select(`
          id, client_id, total_amount, due_date,
          clients:clients!billing_records_client_id_fkey(name)
        `)
        .eq("status", "pending")
        .lt("due_date", today);

      if (clientId) {
        paymentsQuery = paymentsQuery.eq("client_id", clientId);
      }

      const { data: overduePaymentsRaw } = await paymentsQuery;

      // 4. Stalled projects (no activity in 7+ days)
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();

      let projectsQuery = supabase
        .from("projects")
        .select(`
          id, name, client_id, updated_at,
          clients:clients!projects_client_id_fkey(name)
        `)
        .neq("status", "completed")
        .lt("updated_at", sevenDaysAgo);

      if (clientId) {
        projectsQuery = projectsQuery.eq("client_id", clientId);
      }

      const { data: stalledProjectsRaw } = await projectsQuery;

      // 5. Today's stats
      const todayEnd = today.replace("T00:00:00.000Z", "T23:59:59.999Z");
      let todayQuery = supabase
        .from("tasks")
        .select("id, status")
        .gte("due_date", today)
        .lte("due_date", todayEnd);

      if (clientId) {
        todayQuery = todayQuery.eq("client_id", clientId);
      }

      const { data: todayTasks } = await todayQuery;

      // Transform
      const topTasks: SmartTask[] = sortedTopTasks.slice(0, 5).map((t: any) => ({
        ...t,
        client_name: t.clients?.name,
      }));

      const clientDelayTasks: SmartTask[] = (delayTasksRaw || []).map((t: any) => ({
        ...t,
        client_name: t.clients?.name,
      }));

      const overduePayments = (overduePaymentsRaw || []).map((p: any) => ({
        id: p.id,
        client_id: p.client_id,
        client_name: p.clients?.name || "לקוח לא ידוע",
        amount: p.total_amount || 0,
        due_date: p.due_date,
        days_overdue: Math.floor((Date.now() - new Date(p.due_date).getTime()) / (1000 * 60 * 60 * 24)),
      }));

      const stalledProjects = (stalledProjectsRaw || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        client_name: p.clients?.name || "לקוח לא ידוע",
        days_since_activity: Math.floor((Date.now() - new Date(p.updated_at).getTime()) / (1000 * 60 * 60 * 24)),
        last_task_update: p.updated_at,
      }));

      const completedToday = (todayTasks || []).filter((t: any) => t.status === "completed");

      return {
        topTasks,
        clientDelayTasks,
        overduePayments,
        stalledProjects,
        todayStats: {
          totalTasks: (todayTasks || []).length,
          completedTasks: completedToday.length,
        },
      };
    },
    staleTime: 1000 * 60 * 2,
  });
}
